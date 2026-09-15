import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmbeddingProvider } from "../providers/embeddings.js";
import { classifyByGid, parseBulkJsonl, runBulkQuery } from "../shopify/bulk.js";
import { htmlToText, type ShopifyClient } from "../shopify/client.js";
import {
  COLLECTIONS_BULK_QUERY,
  PAGES_QUERY,
  PRODUCTS_BULK_QUERY,
  SHOP_QUERY,
} from "../shopify/queries.js";
import {
  embeddableText,
  hashContent,
  mapCollection,
  mapProduct,
  policyKind,
  type MappedProduct,
} from "./map.js";

/**
 * Full catalog sync.
 *
 * Reconciliation strategy: every row written in a run is stamped with that
 * run's timestamp, and anything left carrying an older stamp was deleted in
 * Shopify. That scales to any catalog size, unlike sending every known id back
 * in a NOT IN clause, and it means a full sync is self-healing — whatever
 * webhooks dropped gets fixed here.
 */

const CHUNK = 250;

export interface SyncReport {
  shopId: string;
  products: number;
  variants: number;
  collections: number;
  docs: number;
  embedded: number;
  deletedProducts: number;
  durationMs: number;
}

function chunk<T>(items: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

interface ShopQueryResult {
  shop: {
    name: string;
    myshopifyDomain: string;
    currencyCode: string;
    billingAddress: { countryCodeV2: string | null } | null;
    shopPolicies: Array<{ type: string; title: string | null; body: string | null }>;
  };
}

/** Create or refresh the shops row, returning its id. */
export async function ensureShop(
  supabase: SupabaseClient,
  shopify: ShopifyClient,
  accessToken: string,
): Promise<{ shopId: string; shop: ShopQueryResult["shop"] }> {
  const { shop } = await shopify.query<ShopQueryResult>(SHOP_QUERY);

  const { data, error } = await supabase
    .from("shops")
    .upsert(
      {
        shop_domain: shop.myshopifyDomain,
        access_token: accessToken,
        shop_name: shop.name,
        currency: shop.currencyCode,
        country_code: shop.billingAddress?.countryCodeV2 ?? null,
        sync_state: "running",
        sync_error: null,
        uninstalled_at: null,
      },
      { onConflict: "shop_domain" },
    )
    .select("id")
    .single();

  if (error) throw new Error(`Could not upsert shop: ${error.message}`);
  return { shopId: (data as { id: string }).id, shop };
}

export async function syncCatalog(
  supabase: SupabaseClient,
  shopify: ShopifyClient,
  shopId: string,
  runStamp: string,
): Promise<{
  products: number;
  variants: number;
  collections: number;
  deletedProducts: number;
  embeddable: Array<{ productId: string; hash: string; text: string }>;
}> {
  // --- products + variants -------------------------------------------------
  const productJsonl = await runBulkQuery(shopify, PRODUCTS_BULK_QUERY);
  const productBulk = parseBulkJsonl(productJsonl, classifyByGid);

  const mapped: MappedProduct[] = productBulk.roots.map((node) =>
    mapProduct(node, productBulk.childrenOf(String(node.id), "ProductVariant")),
  );

  const productIdByGid = new Map<string, string>();
  for (const batch of chunk(mapped)) {
    const rows = batch.map((p) => ({
      shop_id: shopId,
      shopify_gid: p.shopify_gid,
      handle: p.handle,
      title: p.title,
      description: p.description,
      product_type: p.product_type,
      vendor: p.vendor,
      tags: p.tags,
      status: p.status,
      images: p.images,
      online_store_url: p.online_store_url,
      price_min: p.price_min,
      price_max: p.price_max,
      available: p.available,
      shopify_updated_at: p.shopify_updated_at,
      content_hash: p.content_hash,
      synced_at: runStamp,
    }));

    const { data, error } = await supabase
      .from("products")
      .upsert(rows, { onConflict: "shop_id,shopify_gid" })
      .select("id, shopify_gid");

    if (error) throw new Error(`Could not upsert products: ${error.message}`);
    for (const row of data ?? []) {
      const r = row as { id: string; shopify_gid: string };
      productIdByGid.set(r.shopify_gid, r.id);
    }
  }

  // --- variants ------------------------------------------------------------
  const variantRows = mapped.flatMap((product) => {
    const productId = productIdByGid.get(product.shopify_gid);
    if (!productId) return [];
    return product.variants.map((v) => ({
      shop_id: shopId,
      product_id: productId,
      shopify_gid: v.shopify_gid,
      shopify_variant_id: v.shopify_variant_id,
      title: v.title,
      sku: v.sku,
      options: v.options,
      price: v.price,
      compare_at_price: v.compare_at_price,
      inventory_quantity: v.inventory_quantity,
      available: v.available,
      position: v.position,
      shopify_updated_at: v.shopify_updated_at,
      synced_at: runStamp,
    }));
  });

  for (const batch of chunk(variantRows)) {
    const { error } = await supabase
      .from("variants")
      .upsert(batch, { onConflict: "shop_id,shopify_gid" });
    if (error) throw new Error(`Could not upsert variants: ${error.message}`);
  }

  // --- collections ---------------------------------------------------------
  const collectionJsonl = await runBulkQuery(shopify, COLLECTIONS_BULK_QUERY);
  const collectionBulk = parseBulkJsonl(collectionJsonl, classifyByGid);
  const collections = collectionBulk.roots.map((node) =>
    mapCollection(node, collectionBulk.childrenOf(String(node.id), "Product")),
  );

  const collectionIdByGid = new Map<string, string>();
  for (const batch of chunk(collections)) {
    const rows = batch.map((c) => ({
      shop_id: shopId,
      shopify_gid: c.shopify_gid,
      handle: c.handle,
      title: c.title,
      description: c.description,
      shopify_updated_at: c.shopify_updated_at,
      synced_at: runStamp,
    }));

    const { data, error } = await supabase
      .from("collections")
      .upsert(rows, { onConflict: "shop_id,shopify_gid" })
      .select("id, shopify_gid");

    if (error) throw new Error(`Could not upsert collections: ${error.message}`);
    for (const row of data ?? []) {
      const r = row as { id: string; shopify_gid: string };
      collectionIdByGid.set(r.shopify_gid, r.id);
    }
  }

  // Membership is small and churns; rebuild it rather than diffing.
  const productIds = [...productIdByGid.values()];
  for (const batch of chunk(productIds, 100)) {
    const { error } = await supabase.from("product_collections").delete().in("product_id", batch);
    if (error) throw new Error(`Could not clear collection links: ${error.message}`);
  }

  const links = collections.flatMap((collection) => {
    const collectionId = collectionIdByGid.get(collection.shopify_gid);
    if (!collectionId) return [];
    return collection.productGids
      .map((gid) => productIdByGid.get(gid))
      .filter((id): id is string => Boolean(id))
      .map((productId) => ({ product_id: productId, collection_id: collectionId }));
  });

  for (const batch of chunk(links)) {
    const { error } = await supabase
      .from("product_collections")
      .upsert(batch, { onConflict: "product_id,collection_id" });
    if (error) throw new Error(`Could not link collections: ${error.message}`);
  }

  // --- reconcile deletions -------------------------------------------------
  const { data: deleted, error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("shop_id", shopId)
    .lt("synced_at", runStamp)
    .select("id");
  if (deleteError) throw new Error(`Could not reconcile deleted products: ${deleteError.message}`);

  // Variants of surviving products that vanished (a removed size, say).
  const { error: variantDeleteError } = await supabase
    .from("variants")
    .delete()
    .eq("shop_id", shopId)
    .lt("synced_at", runStamp);
  if (variantDeleteError) {
    throw new Error(`Could not reconcile deleted variants: ${variantDeleteError.message}`);
  }

  const { error: collectionDeleteError } = await supabase
    .from("collections")
    .delete()
    .eq("shop_id", shopId)
    .lt("synced_at", runStamp);
  if (collectionDeleteError) {
    throw new Error(`Could not reconcile deleted collections: ${collectionDeleteError.message}`);
  }

  // Collection titles feed the embedded text, so resolve them per product.
  const titlesByProductGid = new Map<string, string[]>();
  for (const collection of collections) {
    for (const gid of collection.productGids) {
      const list = titlesByProductGid.get(gid) ?? [];
      list.push(collection.title);
      titlesByProductGid.set(gid, list);
    }
  }

  const embeddable = mapped
    .map((product) => {
      const productId = productIdByGid.get(product.shopify_gid);
      if (!productId) return null;
      const text = embeddableText(product, titlesByProductGid.get(product.shopify_gid) ?? []);
      return { productId, hash: hashContent(text), text };
    })
    .filter((x): x is { productId: string; hash: string; text: string } => x !== null);

  return {
    products: mapped.length,
    variants: variantRows.length,
    collections: collections.length,
    deletedProducts: (deleted ?? []).length,
    embeddable,
  };
}

/** Policies and merchant-written pages. These are what the bot quotes. */
export async function syncDocs(
  supabase: SupabaseClient,
  shopify: ShopifyClient,
  shopId: string,
  shop: ShopQueryResult["shop"],
  runStamp: string,
): Promise<number> {
  const rows: Array<Record<string, unknown>> = [];

  for (const policy of shop.shopPolicies ?? []) {
    const body = htmlToText(policy.body);
    if (!body) continue; // An unwritten policy is worse than useless to quote.
    rows.push({
      shop_id: shopId,
      kind: policyKind(policy.type),
      slug: policy.type.toLowerCase(),
      title: policy.title ?? policy.type,
      body,
      content_hash: hashContent(body),
      synced_at: runStamp,
    });
  }

  let cursor: string | null = null;
  for (;;) {
    const page: {
      pages: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        edges: Array<{
          node: { id: string; handle: string; title: string; body: string; updatedAt: string };
        }>;
      };
    } = await shopify.query(PAGES_QUERY, { cursor });

    for (const edge of page.pages.edges) {
      const body = htmlToText(edge.node.body);
      if (!body) continue;
      rows.push({
        shop_id: shopId,
        kind: "page",
        slug: edge.node.handle,
        title: edge.node.title,
        body,
        content_hash: hashContent(body),
        shopify_updated_at: edge.node.updatedAt,
        synced_at: runStamp,
      });
    }

    if (!page.pages.pageInfo.hasNextPage) break;
    cursor = page.pages.pageInfo.endCursor;
  }

  for (const batch of chunk(rows)) {
    const { error } = await supabase
      .from("store_docs")
      .upsert(batch, { onConflict: "shop_id,kind,slug" });
    if (error) throw new Error(`Could not upsert store docs: ${error.message}`);
  }

  const { error } = await supabase
    .from("store_docs")
    .delete()
    .eq("shop_id", shopId)
    .lt("synced_at", runStamp);
  if (error) throw new Error(`Could not reconcile deleted docs: ${error.message}`);

  return rows.length;
}

/**
 * Embed only what changed.
 *
 * A stock change rewrites the product row but not its embeddable text, so the
 * content hash is unchanged and no embedding is bought. On a big catalog this
 * is the difference between a few cents a day and a few dollars.
 */
export async function embedProducts(
  supabase: SupabaseClient,
  shopId: string,
  embeddings: EmbeddingProvider,
  items: Array<{ productId: string; hash: string; text: string }>,
): Promise<number> {
  if (items.length === 0) return 0;

  const { data, error } = await supabase
    .from("embeddings")
    .select("owner_id, content_hash")
    .eq("shop_id", shopId)
    .eq("owner_type", "product");

  if (error) throw new Error(`Could not read existing embeddings: ${error.message}`);

  const existing = new Map(
    (data ?? []).map((row) => {
      const r = row as { owner_id: string; content_hash: string };
      return [r.owner_id, r.content_hash];
    }),
  );

  const stale = items.filter((item) => existing.get(item.productId) !== item.hash);
  if (stale.length === 0) return 0;

  let embedded = 0;
  // Batch to keep request bodies sane; embedding APIs cap inputs per call.
  for (const batch of chunk(stale, 96)) {
    const vectors = await embeddings.embed(batch.map((item) => item.text));
    const rows = batch.map((item, index) => ({
      shop_id: shopId,
      owner_type: "product",
      owner_id: item.productId,
      content: item.text,
      content_hash: item.hash,
      embedding: vectors[index],
      model: embeddings.name,
    }));

    const { error: upsertError } = await supabase
      .from("embeddings")
      .upsert(rows, { onConflict: "shop_id,owner_type,owner_id" });
    if (upsertError) throw new Error(`Could not upsert embeddings: ${upsertError.message}`);
    embedded += rows.length;
  }

  return embedded;
}

export async function fullSync(
  supabase: SupabaseClient,
  shopify: ShopifyClient,
  accessToken: string,
  embeddings: EmbeddingProvider,
  onProgress: (message: string) => void = () => {},
): Promise<SyncReport> {
  const startedAt = Date.now();
  const runStamp = new Date().toISOString();

  onProgress("Reading shop profile…");
  const { shopId, shop } = await ensureShop(supabase, shopify, accessToken);

  try {
    onProgress("Running bulk catalog export (this can take a minute)…");
    const catalog = await syncCatalog(supabase, shopify, shopId, runStamp);

    onProgress("Syncing policies and pages…");
    const docs = await syncDocs(supabase, shopify, shopId, shop, runStamp);

    onProgress(`Embedding changed products (${catalog.embeddable.length} candidates)…`);
    const embedded = await embedProducts(supabase, shopId, embeddings, catalog.embeddable);

    await supabase
      .from("shops")
      .update({ sync_state: "ready", last_full_sync_at: runStamp, sync_error: null })
      .eq("id", shopId);

    return {
      shopId,
      products: catalog.products,
      variants: catalog.variants,
      collections: catalog.collections,
      docs,
      embedded,
      deletedProducts: catalog.deletedProducts,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    // Leave a breadcrumb in the row so the merchant dashboard can show why.
    await supabase
      .from("shops")
      .update({
        sync_state: "error",
        sync_error: error instanceof Error ? error.message : String(error),
      })
      .eq("id", shopId);
    throw error;
  }
}
