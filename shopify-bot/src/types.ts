/**
 * Domain types for the store mirror.
 *
 * These are deliberately independent of both Shopify's GraphQL shapes and the
 * Supabase row shapes: the sync layer maps Shopify -> these, the catalog layer
 * maps Supabase rows -> these, and the agent only ever sees these. That is what
 * lets the agent run against fixtures with no Shopify and no database.
 */

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export interface Variant {
  /** Numeric Shopify variant id — required for /cart/{id}:{qty} permalinks. */
  id: string;
  gid: string;
  title: string;
  sku?: string;
  /** e.g. { Size: "M", Color: "Black" } */
  options: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  inventoryQuantity: number;
  available: boolean;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  /** Plain text. HTML is stripped during sync. */
  description: string;
  productType: string;
  vendor?: string;
  tags: string[];
  status: ProductStatus;
  collections: string[];
  variants: Variant[];
  imageUrl?: string;
}

export type StoreDocKind =
  | "refund_policy"
  | "shipping_policy"
  | "privacy_policy"
  | "terms"
  | "faq"
  | "page";

export interface StoreDoc {
  kind: StoreDocKind;
  slug: string;
  title: string;
  body: string;
}

export interface StoreProfile {
  shopDomain: string;
  shopName: string;
  currency: string;
  countryCode?: string;
  /** Short merchant-written description of what the store sells. */
  about?: string;
}

/** Per-shop configuration the merchant controls from the dashboard. */
export interface BotSettings {
  enabled: boolean;
  botName: string;
  brandVoice?: string;
  /**
   * casual  — bhai/baji allowed, very informal
   * neutral — friendly, no slang address terms
   * formal  — polite and restrained; what luxury brands want
   */
  register: "formal" | "neutral" | "casual";
  greeting?: string;
  /** 0 means the bot may never offer a discount. */
  maxDiscountPercent: number;
  discountCode?: string;
  codAvailable: boolean;
  deliveryDaysMin?: number;
  deliveryDaysMax?: number;
  escalationContact?: string;
}

/** Everything the agent needs about one store. */
export interface StoreSnapshot {
  profile: StoreProfile;
  settings: BotSettings;
  products: Product[];
  docs: StoreDoc[];
}

/** Which language the customer is writing in, so we can mirror it. */
export type ReplyLanguage = "english" | "roman_urdu" | "urdu";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

export function emptyUsage(): TokenUsage {
  return { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };
}

export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
  };
}

/** Lowest price across a product's available variants, or across all if none. */
export function priceRange(product: Product): { min: number; max: number } {
  const pool = product.variants.filter((v) => v.available);
  const variants = pool.length > 0 ? pool : product.variants;
  const prices = variants.map((v) => v.price);
  if (prices.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function isAvailable(product: Product): boolean {
  return product.variants.some((v) => v.available);
}

/** PKR 4,500 — the format Pakistani shoppers expect. */
export function formatMoney(amount: number, currency: string): string {
  const rounded = Math.round(amount);
  return `${currency} ${rounded.toLocaleString("en-US")}`;
}
