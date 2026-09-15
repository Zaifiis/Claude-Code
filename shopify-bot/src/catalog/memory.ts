import type { BotSettings, Product, StoreDoc, StoreProfile, StoreSnapshot } from "../types.js";
import { isAvailable, priceRange } from "../types.js";
import type { CatalogRepository, SearchFilters, SearchHit } from "./types.js";

/**
 * Lexical search over an in-memory catalog.
 *
 * This is NOT the production retrieval path — SupabaseCatalog uses pgvector
 * plus trigram matching via the match_products() SQL function. This exists so
 * the agent, the persona and the eval set can be developed and run with no
 * database and no API keys. It is deliberately simple and deterministic, which
 * also makes eval failures easy to attribute: if a case fails here, it is the
 * prompt's fault, not the retriever's.
 */

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "for", "of", "in", "on", "to", "and", "or",
  "me", "my", "i", "you", "your", "it", "with", "any", "some", "do", "does",
  "have", "has", "want", "need", "show", "looking", "under", "below", "rs",
  "pkr", "price", "cost", "please", "hai", "ha", "hain", "koi", "kya", "ka",
  "ki", "ke", "mein", "mujhe", "chahiye", "acha", "achha", "sa", "se",
]);

/**
 * Shopper vocabulary -> catalog vocabulary. The router already rewrites Roman
 * Urdu into English, so this only has to close the gap between how people
 * describe things and how merchants tag them.
 */
const SYNONYMS: Record<string, string[]> = {
  warm: ["winter", "fleece", "khaddar", "pashmina", "puffer"],
  cold: ["winter"],
  winter: ["winter", "fleece", "khaddar", "puffer", "pashmina"],
  summer: ["summer", "lawn", "cotton"],
  suit: ["unstitched", "lawn", "3-piece", "2-piece"],
  dress: ["kurta", "unstitched"],
  shirt: ["kurta"],
  jacket: ["jacket", "puffer", "hoodie"],
  sweater: ["hoodie", "fleece"],
  shoes: ["footwear", "sneakers", "khussa"],
  bag: ["bag", "tote"],
  perfume: ["fragrance", "attar"],
  scent: ["fragrance", "attar"],
  gift: ["gift", "gifts"],
  wedding: ["bridal", "occasion", "wedding"],
  formal: ["occasion", "formal"],
  office: ["office", "everyday"],
  cheap: ["budget"],
  affordable: ["budget"],
  modest: ["modest", "abaya"],
  hijab: ["abaya", "modest"],
  scarf: ["scarf", "shawl"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function expand(tokens: string[]): string[] {
  const out = new Set(tokens);
  for (const t of tokens) {
    for (const syn of SYNONYMS[t] ?? []) out.add(syn);
  }
  return [...out];
}

function fieldScore(tokens: string[], field: string, weight: number): number {
  if (!field) return 0;
  const haystack = field.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (haystack.includes(t)) score += weight;
  }
  return score;
}

export class MemoryCatalog implements CatalogRepository {
  constructor(private readonly snapshot: StoreSnapshot) {}

  async getProfile(): Promise<StoreProfile> {
    return this.snapshot.profile;
  }

  async getSettings(): Promise<BotSettings> {
    return this.snapshot.settings;
  }

  async searchProducts(
    query: string,
    filters: SearchFilters = {},
    limit = 6,
  ): Promise<SearchHit[]> {
    const inStockOnly = filters.inStockOnly ?? true;
    const tokens = expand(tokenize(query));

    const hits: SearchHit[] = [];
    for (const product of this.snapshot.products) {
      if (product.status !== "ACTIVE") continue;
      if (inStockOnly && !isAvailable(product)) continue;

      const { min, max } = priceRange(product);
      if (filters.minPrice !== undefined && max < filters.minPrice) continue;
      if (filters.maxPrice !== undefined && min > filters.maxPrice) continue;
      if (
        filters.productType &&
        product.productType.toLowerCase() !== filters.productType.toLowerCase()
      ) {
        continue;
      }

      let score = 0;
      score += fieldScore(tokens, product.title, 3);
      score += fieldScore(tokens, product.tags.join(" "), 2);
      score += fieldScore(tokens, product.productType, 2);
      score += fieldScore(tokens, product.collections.join(" "), 1);
      score += fieldScore(tokens, product.description, 1);

      // With no query tokens (e.g. "show me anything"), fall back to a weak
      // in-stock signal so the bot still has something concrete to offer.
      if (tokens.length === 0) score = 0.5;

      if (score > 0) hits.push({ product, score });
    }

    hits.sort((a, b) => b.score - a.score || a.product.title.localeCompare(b.product.title));
    return hits.slice(0, limit);
  }

  async getProductByHandle(handle: string): Promise<Product | null> {
    return this.snapshot.products.find((p) => p.handle === handle) ?? null;
  }

  async getRelatedProducts(handle: string, limit = 3): Promise<Product[]> {
    const source = await this.getProductByHandle(handle);
    if (!source) return [];

    const scored = this.snapshot.products
      .filter((p) => p.handle !== handle && p.status === "ACTIVE" && isAvailable(p))
      .map((p) => {
        const sharedCollections = p.collections.filter((c) =>
          source.collections.includes(c),
        ).length;
        const sharedTags = p.tags.filter((t) => source.tags.includes(t)).length;
        // Prefer a different product type: a second identical kurta is not an
        // upsell, a shawl to go with the kurta is.
        const differentType = p.productType !== source.productType ? 1 : 0;
        return { p, score: sharedCollections * 2 + sharedTags + differentType };
      })
      .filter((x) => x.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((x) => x.p);
  }

  async getDocs(kind?: string): Promise<StoreDoc[]> {
    if (!kind) return this.snapshot.docs;
    return this.snapshot.docs.filter((d) => d.kind === kind || d.slug === kind);
  }
}
