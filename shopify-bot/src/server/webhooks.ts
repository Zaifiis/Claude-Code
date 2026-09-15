import type { SupabaseClient } from "@supabase/supabase-js";
import { htmlToText } from "../shopify/client.js";
import { hashContent } from "../sync/map.js";

/**
 * Webhook handlers.
 *
 * Shopify does not guarantee delivery, and duplicates and out-of-order
 * payloads are normal — so every handler here is idempotent and compares
 * Shopify's own updated_at before writing. The daily reconcile in
 * scripts/sync.ts is the safety net that fixes whatever these miss.
 *
 * Handlers must return fast: Shopify expects a 200 within 5 seconds and
 * retries if it does not get one.
 */

async function shopIdFor(
  supabase: SupabaseClient,
  shopDomain: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("shops")
    .select("id")
    .eq("shop_domain", shopDomain)
    .maybeSingle();
  return data ? (data as { id: string }).id : null;
}

/** REST webhook payloads use numeric ids; the mirror stores gids. */
function productGid(id: unknown): string {
  return `gid://shopify/Product/${String(id)}`;
}

interface ProductWebhook {
  id: number | string;
  handle?: string;
  title?: string;
  body_html?: string | null;
  product_type?: string | null;
  vendor?: string | null;
  tags?: string | string[];
  status?: string;
  updated_at?: string;
  variants?: Array<{
    id: number | string;
    title?: string;
    sku?: string | null;
    price?: string | number | null;
    compare_at_price?: string | number | null;
    inventory_quantity?: number | null;
    position?: number | null;
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
    updated_at?: string;
  }>;
  options?: Array<{ name: string; position: number }>;
  image?: { src?: string } | null;
}

export async function handleProductUpdate(
  supabase: SupabaseClient,
  shopDomain: string,
  payload: ProductWebhook,
): Promise<void> {
  const shopId = await shopIdFor(supabase, shopDomain);
  if (!shopId) return;

  const gid = productGid(payload.id);

  // Drop stale deliveries. Webhooks arrive out of order often enough that
  // without this an old payload can overwrite a newer price.
  const { data: existing } = await supabase
    .from("products")
    .select("id, shopify_updated_at")
    .eq("shop_id", shopId)
    .eq("shopify_gid", gid)
    .maybeSingle();

  if (existing && payload.updated_at) {
    const current = (existing as { shopify_updated_at: string | null }).shopify_updated_at;
    if (current && new Date(current) > new Date(payload.updated_at)) return;
  }

  const tags = Array.isArray(payload.tags)
    ? payload.tags
    : typeof payload.tags === "string"
      ? payload.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  const variants = payload.variants ?? [];
  const prices = variants
    .map((v) => (typeof v.price === "string" ? Number.parseFloat(v.price) : (v.price ?? 0)))
    .filter((n): n is number => Number.isFinite(n));
  const available = variants.some((v) => (v.inventory_quantity ?? 0) > 0);

  const description = htmlToText(payload.body_html);
  const optionNames = (payload.options ?? []).map((o) => o.name);

  const { data: upserted, error } = await supabase
    .from("products")
    .upsert(
      {
        shop_id: shopId,
        shopify_gid: gid,
        handle: payload.handle ?? "",
        title: payload.title ?? "",
        description,
        product_type: payload.product_type ?? "",
        vendor: payload.vendor ?? null,
        tags,
        status: (payload.status ?? "active").toUpperCase(),
        images: payload.image?.src ? [{ url: payload.image.src }] : [],
        price_min: prices.length > 0 ? Math.min(...prices) : null,
        price_max: prices.length > 0 ? Math.max(...prices) : null,
        available,
        shopify_updated_at: payload.updated_at ?? null,
        content_hash: hashContent(
          [payload.title, payload.product_type, tags.join(" "), description].join("\n"),
        ),
        synced_at: new Date().toISOString(),
      },
      { onConflict: "shop_id,shopify_gid" },
    )
    .select("id")
    .single();

  if (error || !upserted) return;
  const productId = (upserted as { id: string }).id;

  if (variants.length === 0) return;

  const optionsFor = (v: NonNullable<ProductWebhook["variants"]>[number]) => {
    const map: Record<string, string> = {};
    const values = [v.option1, v.option2, v.option3];
    optionNames.forEach((name, index) => {
      const value = values[index];
      if (value) map[name] = value;
    });
    return map;
  };

  await supabase.from("variants").upsert(
    variants.map((v) => ({
      shop_id: shopId,
      product_id: productId,
      shopify_gid: `gid://shopify/ProductVariant/${String(v.id)}`,
      shopify_variant_id: String(v.id),
      title: v.title ?? "Default Title",
      sku: v.sku ?? null,
      options: optionsFor(v),
      price: typeof v.price === "string" ? Number.parseFloat(v.price) : (v.price ?? 0),
      compare_at_price:
        typeof v.compare_at_price === "string"
          ? Number.parseFloat(v.compare_at_price)
          : (v.compare_at_price ?? null),
      inventory_quantity: v.inventory_quantity ?? 0,
      available: (v.inventory_quantity ?? 0) > 0,
      position: v.position ?? null,
      shopify_updated_at: v.updated_at ?? null,
      synced_at: new Date().toISOString(),
    })),
    { onConflict: "shop_id,shopify_gid" },
  );

  // The embedding is now stale. Deleting it is the cheap, correct move: the
  // next sync re-embeds, and until then hybrid search still finds the product
  // by keyword rather than returning a wrong vector.
  await supabase
    .from("embeddings")
    .delete()
    .eq("shop_id", shopId)
    .eq("owner_type", "product")
    .eq("owner_id", productId);
}

export async function handleProductDelete(
  supabase: SupabaseClient,
  shopDomain: string,
  payload: { id: number | string },
): Promise<void> {
  const shopId = await shopIdFor(supabase, shopDomain);
  if (!shopId) return;
  await supabase
    .from("products")
    .delete()
    .eq("shop_id", shopId)
    .eq("shopify_gid", productGid(payload.id));
}

/**
 * Inventory moved. This is the highest-volume webhook by far, and it must stay
 * cheap — no embedding work, no product rewrite, just the stock number.
 */
export async function handleInventoryUpdate(
  supabase: SupabaseClient,
  shopDomain: string,
  payload: { inventory_item_id?: number | string; available?: number | null },
): Promise<void> {
  const shopId = await shopIdFor(supabase, shopDomain);
  if (!shopId || payload.inventory_item_id === undefined) return;

  // The mirror keys variants by variant id, not inventory item id. Rather than
  // store a second mapping, let the reconcile job pick this up — but do mark
  // the shop so the dashboard can show that stock may be behind.
  await supabase
    .from("shops")
    .update({ last_delta_sync_at: new Date().toISOString() })
    .eq("id", shopId);
}

export async function handleAppUninstalled(
  supabase: SupabaseClient,
  shopDomain: string,
): Promise<void> {
  // Keep the row: the merchant may reinstall, and the access token is already
  // dead. Marking it is enough, and it keeps their conversation history.
  await supabase
    .from("shops")
    .update({ uninstalled_at: new Date().toISOString(), sync_state: "pending" })
    .eq("shop_domain", shopDomain);
}

/**
 * GDPR topics. Mandatory for App Store review, and answering them correctly is
 * not optional even on a dev store.
 */
export async function handleCustomerRedact(
  supabase: SupabaseClient,
  shopDomain: string,
): Promise<void> {
  // This app stores no customer PII: conversations are keyed by an anonymous
  // visitor id generated in the browser, never by customer id or email. There
  // is nothing to erase, and that is the honest answer to give Shopify.
  void supabase;
  void shopDomain;
}

export async function handleShopRedact(
  supabase: SupabaseClient,
  shopDomain: string,
): Promise<void> {
  // 48 hours after uninstall. Delete everything; the cascade clears products,
  // variants, embeddings, conversations and messages with it.
  await supabase.from("shops").delete().eq("shop_domain", shopDomain);
}
