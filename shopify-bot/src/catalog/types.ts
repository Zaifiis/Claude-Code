import type { BotSettings, Product, StoreDoc, StoreProfile } from "../types.js";

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  /** Default true — customers do not want to hear about sold out things. */
  inStockOnly?: boolean;
  productType?: string;
}

export interface SearchHit {
  product: Product;
  score: number;
}

/**
 * Everything the agent can read about a store.
 *
 * Two implementations: MemoryCatalog (fixtures, for development and evals) and
 * SupabaseCatalog (the real store mirror). The agent cannot tell them apart,
 * which is what makes persona work testable without a Shopify store.
 */
export interface CatalogRepository {
  getProfile(): Promise<StoreProfile>;
  getSettings(): Promise<BotSettings>;
  searchProducts(
    query: string,
    filters?: SearchFilters,
    limit?: number,
  ): Promise<SearchHit[]>;
  getProductByHandle(handle: string): Promise<Product | null>;
  /** Products often bought alongside `handle` — same collection, similar tags. */
  getRelatedProducts(handle: string, limit?: number): Promise<Product[]>;
  getDocs(kind?: string): Promise<StoreDoc[]>;
}
