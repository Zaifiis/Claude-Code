import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import type { EmbeddingProvider } from "../providers/embeddings.js";
import type {
  BotSettings,
  Product,
  ProductStatus,
  StoreDoc,
  StoreDocKind,
  StoreProfile,
  Variant,
} from "../types.js";
import type { CatalogRepository, SearchFilters, SearchHit } from "./types.js";

/**
 * The real store mirror.
 *
 * Implements the same CatalogRepository interface as MemoryCatalog, so the
 * agent, the tools and the eval runner are unchanged — swapping fixtures for a
 * live store is one line in factory.ts.
 *
 * Every query is scoped by shop_id. That scoping is the multi-tenant boundary:
 * this client uses the service role key, which bypasses RLS, so the filters
 * here are the only thing standing between one merchant's catalog and another's.
 * Do not add a query to this file without a .eq("shop_id", this.shopId).
 */

interface ProductRow {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  product_type: string | null;
  vendor: string | null;
  tags: string[] | null;
  status: string;
  images: unknown;
  online_store_url: string | null;
  shopify_gid: string;
}

interface VariantRow {
  product_id: string;
  shopify_gid: string;
  shopify_variant_id: string;
  title: string | null;
  sku: string | null;
  options: Record<string, string> | null;
  price: number | string | null;
  compare_at_price: number | string | null;
  inventory_quantity: number | null;
  available: boolean;
  position: number | null;
}

interface MatchRow {
  product_id: string;
  score: number;
}

const PRODUCT_COLUMNS =
  "id, handle, title, description, product_type, vendor, tags, status, images, online_store_url, shopify_gid";

const VARIANT_COLUMNS =
  "product_id, shopify_gid, shopify_variant_id, title, sku, options, price, compare_at_price, inventory_quantity, available, position";

function toNumber(value: number | string | null): number {
  if (value === null) return 0;
  return typeof value === "number" ? value : Number.parseFloat(value);
}

function firstImageUrl(images: unknown): string | undefined {
  if (!Array.isArray(images) || images.length === 0) return undefined;
  const first = images[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "url" in first) {
    const url = (first as { url: unknown }).url;
    if (typeof url === "string") return url;
  }
  return undefined;
}

function toVariant(row: VariantRow): Variant {
  return {
    id: row.shopify_variant_id,
    gid: row.shopify_gid,
    title: row.title ?? "Default Title",
    ...(row.sku ? { sku: row.sku } : {}),
    options: row.options ?? {},
    price: toNumber(row.price),
    ...(row.compare_at_price !== null
      ? { compareAtPrice: toNumber(row.compare_at_price) }
      : {}),
    inventoryQuantity: row.inventory_quantity ?? 0,
    available: row.available,
    ...(row.position !== null ? {} : {}),
  };
}

function toProduct(
  row: ProductRow,
  variants: Variant[],
  collections: string[],
): Product {
  const imageUrl = firstImageUrl(row.images);
  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    description: row.description ?? "",
    productType: row.product_type ?? "",
    ...(row.vendor ? { vendor: row.vendor } : {}),
    tags: row.tags ?? [],
    status: (row.status as ProductStatus) ?? "ACTIVE",
    collections,
    variants,
    ...(imageUrl ? { imageUrl } : {}),
  };
}

export class SupabaseCatalog implements CatalogRepository {
  private profileCache?: StoreProfile;
  private settingsCache?: BotSettings;

  constructor(
    private readonly client: SupabaseClient,
    private readonly shopId: string,
    private readonly embeddings: EmbeddingProvider,
  ) {}

  /** Resolve a shop row id from its myshopify domain. */
  static async forShopDomain(
    client: SupabaseClient,
    shopDomain: string,
    embeddings: EmbeddingProvider,
  ): Promise<SupabaseCatalog> {
    const { data, error } = await client
      .from("shops")
      .select("id")
      .eq("shop_domain", shopDomain)
      .maybeSingle();

    if (error) throw new Error(`Could not look up shop ${shopDomain}: ${error.message}`);
    if (!data) throw new Error(`Shop ${shopDomain} is not installed.`);

    return new SupabaseCatalog(client, (data as { id: string }).id, embeddings);
  }

  async getProfile(): Promise<StoreProfile> {
    if (this.profileCache) return this.profileCache;

    const { data, error } = await this.client
      .from("shops")
      .select("shop_domain, shop_name, currency, country_code")
      .eq("id", this.shopId)
      .single();

    if (error) throw new Error(`Could not load shop profile: ${error.message}`);
    const row = data as {
      shop_domain: string;
      shop_name: string | null;
      currency: string;
      country_code: string | null;
    };

    this.profileCache = {
      shopDomain: row.shop_domain,
      shopName: row.shop_name ?? row.shop_domain,
      currency: row.currency,
      ...(row.country_code ? { countryCode: row.country_code } : {}),
    };
    return this.profileCache;
  }

  async getSettings(): Promise<BotSettings> {
    if (this.settingsCache) return this.settingsCache;

    const { data, error } = await this.client
      .from("bot_settings")
      .select("*")
      .eq("shop_id", this.shopId)
      .maybeSingle();

    if (error) throw new Error(`Could not load bot settings: ${error.message}`);

    // A shop with no settings row yet gets safe defaults: enabled, neutral
    // register, and — importantly — no discount authority.
    const row = (data ?? {}) as Record<string, unknown>;
    this.settingsCache = {
      enabled: row["enabled"] !== false,
      botName: typeof row["bot_name"] === "string" ? row["bot_name"] : "Sales Assistant",
      ...(typeof row["brand_voice"] === "string" ? { brandVoice: row["brand_voice"] } : {}),
      register:
        row["register"] === "formal" || row["register"] === "casual"
          ? row["register"]
          : "neutral",
      ...(typeof row["greeting"] === "string" ? { greeting: row["greeting"] } : {}),
      maxDiscountPercent:
        typeof row["max_discount_percent"] === "number" ? row["max_discount_percent"] : 0,
      ...(typeof row["discount_code"] === "string"
        ? { discountCode: row["discount_code"] }
        : {}),
      codAvailable: row["cod_available"] !== false,
      ...(typeof row["delivery_days_min"] === "number"
        ? { deliveryDaysMin: row["delivery_days_min"] }
        : {}),
      ...(typeof row["delivery_days_max"] === "number"
        ? { deliveryDaysMax: row["delivery_days_max"] }
        : {}),
      ...(typeof row["escalation_contact"] === "string"
        ? { escalationContact: row["escalation_contact"] }
        : {}),
    };
    return this.settingsCache;
  }

  async searchProducts(
    query: string,
    filters: SearchFilters = {},
    limit = 6,
  ): Promise<SearchHit[]> {
    const [embedding] = await this.embeddings.embed([query]);
    if (!embedding) return [];

    const { data, error } = await this.client.rpc("match_products", {
      p_shop_id: this.shopId,
      p_query_embedding: embedding,
      p_query_text: query,
      p_min_price: filters.minPrice ?? null,
      p_max_price: filters.maxPrice ?? null,
      p_in_stock_only: filters.inStockOnly ?? true,
      p_limit: limit,
    });

    if (error) throw new Error(`Product search failed: ${error.message}`);

    const matches = (data ?? []) as MatchRow[];
    if (matches.length === 0) return [];

    const products = await this.hydrate(matches.map((m) => m.product_id));
    const scoreById = new Map(matches.map((m) => [m.product_id, m.score]));

    // match_products already ordered by score; preserve it.
    return matches
      .map((match) => {
        const product = products.get(match.product_id);
        return product ? { product, score: scoreById.get(match.product_id) ?? 0 } : null;
      })
      .filter((hit): hit is SearchHit => hit !== null)
      .filter((hit) =>
        filters.productType
          ? hit.product.productType.toLowerCase() === filters.productType.toLowerCase()
          : true,
      );
  }

  async getProductByHandle(handle: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("shop_id", this.shopId)
      .eq("handle", handle)
      .maybeSingle();

    if (error) throw new Error(`Could not load product ${handle}: ${error.message}`);
    if (!data) return null;

    const products = await this.hydrate([(data as ProductRow).id]);
    return products.get((data as ProductRow).id) ?? null;
  }

  async getRelatedProducts(handle: string, limit = 3): Promise<Product[]> {
    const source = await this.getProductByHandle(handle);
    if (!source) return [];

    const { data: links, error: linkError } = await this.client
      .from("product_collections")
      .select("collection_id")
      .eq("product_id", source.id);

    if (linkError) throw new Error(`Could not load collections: ${linkError.message}`);
    const collectionIds = (links ?? []).map((l) => (l as { collection_id: string }).collection_id);
    if (collectionIds.length === 0) return [];

    const { data: siblings, error: siblingError } = await this.client
      .from("product_collections")
      .select("product_id")
      .in("collection_id", collectionIds)
      .neq("product_id", source.id)
      // Over-fetch: we filter to available and prefer a different product type
      // below, and both can eliminate a lot of candidates.
      .limit(limit * 8);

    if (siblingError) throw new Error(`Could not load related products: ${siblingError.message}`);

    const ids = [...new Set((siblings ?? []).map((s) => (s as { product_id: string }).product_id))];
    if (ids.length === 0) return [];

    const hydrated = await this.hydrate(ids);
    const candidates = [...hydrated.values()].filter(
      (p) => p.status === "ACTIVE" && p.variants.some((v) => v.available),
    );

    // A second identical kurta is not an upsell; a shawl to go with it is.
    candidates.sort((a, b) => {
      const aDifferent = a.productType !== source.productType ? 1 : 0;
      const bDifferent = b.productType !== source.productType ? 1 : 0;
      return bDifferent - aDifferent;
    });

    return candidates.slice(0, limit);
  }

  async getDocs(kind?: string): Promise<StoreDoc[]> {
    let query = this.client
      .from("store_docs")
      .select("kind, slug, title, body")
      .eq("shop_id", this.shopId);

    if (kind) query = query.or(`kind.eq.${kind},slug.eq.${kind}`);

    const { data, error } = await query;
    if (error) throw new Error(`Could not load store docs: ${error.message}`);

    return (data ?? []).map((row) => {
      const doc = row as { kind: string; slug: string; title: string | null; body: string };
      return {
        kind: doc.kind as StoreDocKind,
        slug: doc.slug,
        title: doc.title ?? doc.slug,
        body: doc.body,
      };
    });
  }

  /** Load products plus their variants and collection titles in three queries. */
  private async hydrate(productIds: string[]): Promise<Map<string, Product>> {
    if (productIds.length === 0) return new Map();

    const [productsResult, variantsResult, collectionsResult] = await Promise.all([
      this.client
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("shop_id", this.shopId)
        .in("id", productIds),
      this.client
        .from("variants")
        .select(VARIANT_COLUMNS)
        .eq("shop_id", this.shopId)
        .in("product_id", productIds)
        .order("position", { ascending: true }),
      this.client
        .from("product_collections")
        .select("product_id, collections(title)")
        .in("product_id", productIds),
    ]);

    if (productsResult.error) {
      throw new Error(`Could not load products: ${productsResult.error.message}`);
    }
    if (variantsResult.error) {
      throw new Error(`Could not load variants: ${variantsResult.error.message}`);
    }
    if (collectionsResult.error) {
      throw new Error(`Could not load collections: ${collectionsResult.error.message}`);
    }

    const variantsByProduct = new Map<string, Variant[]>();
    for (const row of (variantsResult.data ?? []) as VariantRow[]) {
      const list = variantsByProduct.get(row.product_id) ?? [];
      list.push(toVariant(row));
      variantsByProduct.set(row.product_id, list);
    }

    const collectionsByProduct = new Map<string, string[]>();
    for (const row of collectionsResult.data ?? []) {
      // PostgREST types an embedded relation as an array; at runtime a
      // to-one relation comes back as a single object. Handle both.
      const link = row as unknown as {
        product_id: string;
        collections: { title: string } | { title: string }[] | null;
      };
      if (!link.collections) continue;
      const titles = Array.isArray(link.collections)
        ? link.collections.map((c) => c.title)
        : [link.collections.title];
      const list = collectionsByProduct.get(link.product_id) ?? [];
      list.push(...titles);
      collectionsByProduct.set(link.product_id, list);
    }

    const out = new Map<string, Product>();
    for (const row of (productsResult.data ?? []) as ProductRow[]) {
      out.set(
        row.id,
        toProduct(
          row,
          variantsByProduct.get(row.id) ?? [],
          collectionsByProduct.get(row.id) ?? [],
        ),
      );
    }
    return out;
  }
}

/** Service-role client. Server side only — this key bypasses every RLS policy. */
export function createSupabaseClient(): SupabaseClient {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
