import { createHash } from "node:crypto";
import type { BulkNode } from "../shopify/bulk.js";
import { htmlToText, numericId } from "../shopify/client.js";

/**
 * Shopify bulk nodes -> database rows.
 *
 * Pure functions, no network and no database, so the mapping is testable with
 * a fixture JSONL file — see scripts/smoke.ts. Mapping bugs are quiet and
 * expensive (a mis-parsed price is a wrong price quoted to a customer), so this
 * layer is worth testing directly rather than only end to end.
 */

export interface MappedVariant {
  shopify_gid: string;
  shopify_variant_id: string;
  title: string;
  sku: string | null;
  options: Record<string, string>;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number;
  available: boolean;
  position: number | null;
  shopify_updated_at: string | null;
}

export interface MappedProduct {
  shopify_gid: string;
  handle: string;
  title: string;
  description: string;
  product_type: string;
  vendor: string | null;
  tags: string[];
  status: string;
  images: Array<{ url: string }>;
  online_store_url: string | null;
  price_min: number | null;
  price_max: number | null;
  available: boolean;
  shopify_updated_at: string | null;
  content_hash: string;
  variants: MappedVariant[];
}

function str(node: BulkNode, key: string): string | null {
  const value = node[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toPrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function featuredImageUrl(node: BulkNode): string | null {
  const media = node["featuredMedia"];
  if (!media || typeof media !== "object") return null;
  const preview = (media as Record<string, unknown>)["preview"];
  if (!preview || typeof preview !== "object") return null;
  const image = (preview as Record<string, unknown>)["image"];
  if (!image || typeof image !== "object") return null;
  const url = (image as Record<string, unknown>)["url"];
  return typeof url === "string" ? url : null;
}

export function mapVariant(node: BulkNode): MappedVariant {
  const options: Record<string, string> = {};
  const selected = node["selectedOptions"];
  if (Array.isArray(selected)) {
    for (const option of selected) {
      if (!option || typeof option !== "object") continue;
      const { name, value } = option as { name?: unknown; value?: unknown };
      if (typeof name === "string" && typeof value === "string") options[name] = value;
    }
  }

  const inventoryQuantity =
    typeof node["inventoryQuantity"] === "number" ? node["inventoryQuantity"] : 0;
  // Trust availableForSale when present: it accounts for "continue selling when
  // out of stock", which a raw quantity does not.
  const available =
    typeof node["availableForSale"] === "boolean"
      ? node["availableForSale"]
      : inventoryQuantity > 0;

  return {
    shopify_gid: String(node.id),
    shopify_variant_id: numericId(String(node.id)),
    title: str(node, "title") ?? "Default Title",
    sku: str(node, "sku"),
    options,
    price: toPrice(node["price"]) ?? 0,
    compare_at_price: toPrice(node["compareAtPrice"]),
    inventory_quantity: inventoryQuantity,
    available,
    position: typeof node["position"] === "number" ? node["position"] : null,
    shopify_updated_at: str(node, "updatedAt"),
  };
}

/**
 * Text that gets embedded. Changing this changes every product's content hash
 * and forces a full re-embed on the next sync — which is correct, but costs
 * money, so change it deliberately.
 */
export function embeddableText(
  product: Pick<MappedProduct, "title" | "description" | "product_type" | "tags" | "variants">,
  collectionTitles: string[] = [],
): string {
  const optionValues = new Set<string>();
  for (const variant of product.variants) {
    for (const value of Object.values(variant.options)) optionValues.add(value);
  }

  return [
    product.title,
    product.product_type,
    product.tags.join(" "),
    collectionTitles.join(" "),
    [...optionValues].join(" "),
    product.description,
  ]
    .filter((part) => part.trim().length > 0)
    .join("\n");
}

export function hashContent(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function mapProduct(node: BulkNode, variantNodes: BulkNode[]): MappedProduct {
  const variants = variantNodes.map(mapVariant);
  const availableVariants = variants.filter((v) => v.available);
  const pricePool = availableVariants.length > 0 ? availableVariants : variants;
  const prices = pricePool.map((v) => v.price);

  const imageUrl = featuredImageUrl(node);
  const product: MappedProduct = {
    shopify_gid: String(node.id),
    handle: str(node, "handle") ?? "",
    title: str(node, "title") ?? "",
    description: htmlToText(str(node, "descriptionHtml")),
    product_type: str(node, "productType") ?? "",
    vendor: str(node, "vendor"),
    tags: Array.isArray(node["tags"]) ? (node["tags"] as string[]) : [],
    status: str(node, "status") ?? "ACTIVE",
    images: imageUrl ? [{ url: imageUrl }] : [],
    online_store_url: str(node, "onlineStoreUrl"),
    price_min: prices.length > 0 ? Math.min(...prices) : null,
    price_max: prices.length > 0 ? Math.max(...prices) : null,
    available: availableVariants.length > 0,
    shopify_updated_at: str(node, "updatedAt"),
    content_hash: "",
    variants,
  };

  product.content_hash = hashContent(embeddableText(product));
  return product;
}

export interface MappedCollection {
  shopify_gid: string;
  handle: string;
  title: string;
  description: string;
  shopify_updated_at: string | null;
  productGids: string[];
}

export function mapCollection(node: BulkNode, productNodes: BulkNode[]): MappedCollection {
  return {
    shopify_gid: String(node.id),
    handle: str(node, "handle") ?? "",
    title: str(node, "title") ?? "",
    description: htmlToText(str(node, "descriptionHtml")),
    shopify_updated_at: str(node, "updatedAt"),
    productGids: productNodes.map((p) => String(p.id)),
  };
}

/** Shopify policy type (REFUND_POLICY) -> our store_docs.kind. */
export function policyKind(shopifyType: string): string {
  const map: Record<string, string> = {
    REFUND_POLICY: "refund_policy",
    SHIPPING_POLICY: "shipping_policy",
    PRIVACY_POLICY: "privacy_policy",
    TERMS_OF_SERVICE: "terms",
    TERMS_OF_SALE: "terms",
    LEGAL_NOTICE: "terms",
    SUBSCRIPTION_POLICY: "terms",
    CONTACT_INFORMATION: "page",
  };
  return map[shopifyType] ?? "page";
}
