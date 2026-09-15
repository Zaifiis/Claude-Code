import type Anthropic from "@anthropic-ai/sdk";
import type { CatalogRepository, SearchFilters } from "../catalog/types.js";
import type { BotSettings, Product, StoreProfile } from "../types.js";
import { formatMoney, isAvailable, priceRange } from "../types.js";

/**
 * The agent's tools.
 *
 * Every fact the bot states about a product, a price, stock or a policy must
 * come back from one of these. That is the whole anti-hallucination strategy:
 * the model is never asked to remember the catalog, only to talk about what a
 * tool just handed it.
 */

export const TOOL_NAMES = {
  search: "search_products",
  details: "get_product_details",
  stock: "check_stock",
  policy: "get_policy",
  cart: "build_cart_link",
  upsell: "suggest_upsell",
  escalate: "escalate_to_human",
} as const;

export const ROUTE_TOOL_NAME = "route";

/**
 * Router tool. strict:true guarantees the arguments validate exactly, which
 * matters because the pipeline branches on these values without re-checking.
 */
export const routeTool: Anthropic.Tool = {
  name: ROUTE_TOOL_NAME,
  description:
    "Classify the customer's latest message and rewrite it as an English product search query.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      intent: {
        type: "string",
        enum: [
          "greeting",
          "product_search",
          "product_question",
          "policy_question",
          "order_status",
          "complaint",
          "checkout_help",
          "smalltalk",
          "other",
        ],
        description: "What the customer is trying to do.",
      },
      language: {
        type: "string",
        enum: ["english", "roman_urdu", "urdu"],
        description:
          "The script and language the customer wrote in. roman_urdu means Urdu written in Latin letters.",
      },
      search_query: {
        type: "string",
        description:
          "The customer's need rewritten as a short English product search query. Empty string if they are not looking for a product.",
      },
      min_price: {
        type: ["number", "null"],
        description: "Minimum price in store currency if the customer named one, else null.",
      },
      max_price: {
        type: ["number", "null"],
        description: "Maximum price in store currency if the customer named one, else null.",
      },
    },
    required: ["intent", "language", "search_query", "min_price", "max_price"],
  },
};

export const replyTools: Anthropic.Tool[] = [
  {
    name: TOOL_NAMES.search,
    description:
      "Search this store's catalog. Use it before recommending anything. Returns only products that exist in this store.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "English search terms." },
        min_price: { type: "number" },
        max_price: { type: "number" },
        in_stock_only: {
          type: "boolean",
          description: "Defaults to true. Only set false if the customer asks about a sold out item.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: TOOL_NAMES.details,
    description:
      "Get full details for one product: description, every variant, price and stock per variant.",
    input_schema: {
      type: "object",
      properties: { handle: { type: "string" } },
      required: ["handle"],
    },
  },
  {
    name: TOOL_NAMES.stock,
    description:
      "Check whether a specific size or colour of a product is in stock right now.",
    input_schema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        option_value: {
          type: "string",
          description: "e.g. \"M\", \"UK 8\", \"Black\". Omit to get all variants.",
        },
      },
      required: ["handle"],
    },
  },
  {
    name: TOOL_NAMES.policy,
    description:
      "Read the store's own policy text: shipping, delivery time, COD, returns, exchanges, sizing. Never answer these from memory.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: ["shipping", "returns", "sizing", "about", "all"],
        },
      },
      required: ["topic"],
    },
  },
  {
    name: TOOL_NAMES.cart,
    description:
      "Build a checkout link that adds a specific variant to the cart. Only call this once the customer has chosen a product and, where the product has sizes, a size.",
    input_schema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        option_value: {
          type: "string",
          description: "The chosen size or colour. Required if the product has more than one variant.",
        },
        quantity: { type: "number" },
      },
      required: ["handle"],
    },
  },
  {
    name: TOOL_NAMES.upsell,
    description:
      "Find products that go with one the customer is already interested in. Only use after they have shown interest in something specific.",
    input_schema: {
      type: "object",
      properties: { handle: { type: "string" } },
      required: ["handle"],
    },
  },
  {
    name: TOOL_NAMES.escalate,
    description:
      "Hand over to a human. Use for complaints, refund disputes, anything about an existing order, or when you genuinely cannot help.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string" },
      },
      required: ["reason"],
    },
  },
];

export interface ToolContext {
  catalog: CatalogRepository;
  profile: StoreProfile;
  settings: BotSettings;
  /** Set to true by build_cart_link, for conversation analytics. */
  cartLinkSent?: boolean;
  escalated?: boolean;
}

function summarizeProduct(product: Product, currency: string) {
  const { min, max } = priceRange(product);
  const inStockOptions = product.variants
    .filter((v) => v.available)
    .map((v) => v.title);
  return {
    handle: product.handle,
    title: product.title,
    type: product.productType,
    price: min === max ? formatMoney(min, currency) : `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`,
    available: isAvailable(product),
    in_stock_options: inStockOptions,
    description: product.description.slice(0, 220),
  };
}

/** Case- and space-insensitive match of a customer's stated size/colour. */
function findVariant(product: Product, optionValue?: string) {
  if (!optionValue) {
    return product.variants.find((v) => v.available) ?? product.variants[0];
  }
  const needle = optionValue.trim().toLowerCase().replace(/\s+/g, "");
  return product.variants.find((v) =>
    Object.values(v.options).some(
      (value) => value.toLowerCase().replace(/\s+/g, "") === needle,
    ) || v.title.toLowerCase().replace(/\s+/g, "") === needle,
  );
}

export function buildCartUrl(
  shopDomain: string,
  variantId: string,
  quantity = 1,
): string {
  // Shopify cart permalink. Works on every store with no Storefront API token.
  return `https://${shopDomain}/cart/${variantId}:${Math.max(1, Math.floor(quantity))}`;
}

type ToolInput = Record<string, unknown>;

function str(input: ToolInput, key: string): string | undefined {
  const value = input[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function num(input: ToolInput, key: string): number | undefined {
  const value = input[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * Execute one tool call. Returns a JSON string to hand back as a tool_result.
 * Never throws for ordinary "not found" cases — the model needs to see those
 * as data so it can tell the customer the truth.
 */
export async function executeTool(
  name: string,
  rawInput: unknown,
  ctx: ToolContext,
): Promise<string> {
  const input: ToolInput =
    typeof rawInput === "object" && rawInput !== null ? (rawInput as ToolInput) : {};
  const currency = ctx.profile.currency;

  switch (name) {
    case TOOL_NAMES.search: {
      const filters: SearchFilters = {
        minPrice: num(input, "min_price"),
        maxPrice: num(input, "max_price"),
        inStockOnly: input["in_stock_only"] === false ? false : true,
      };
      const hits = await ctx.catalog.searchProducts(str(input, "query") ?? "", filters, 6);
      if (hits.length === 0) {
        return JSON.stringify({
          results: [],
          note: "No products in this store matched. Do not invent alternatives — say you do not have it and ask what else they need.",
        });
      }
      return JSON.stringify({
        results: hits.map((h) => summarizeProduct(h.product, currency)),
      });
    }

    case TOOL_NAMES.details: {
      const handle = str(input, "handle");
      const product = handle ? await ctx.catalog.getProductByHandle(handle) : null;
      if (!product) return JSON.stringify({ error: "not_found", handle });
      return JSON.stringify({
        handle: product.handle,
        title: product.title,
        type: product.productType,
        description: product.description,
        tags: product.tags,
        available: isAvailable(product),
        variants: product.variants.map((v) => ({
          option: v.title,
          price: formatMoney(v.price, currency),
          available: v.available,
          quantity: v.inventoryQuantity,
        })),
      });
    }

    case TOOL_NAMES.stock: {
      const handle = str(input, "handle");
      const product = handle ? await ctx.catalog.getProductByHandle(handle) : null;
      if (!product) return JSON.stringify({ error: "not_found", handle });
      const optionValue = str(input, "option_value");
      if (!optionValue) {
        return JSON.stringify({
          handle: product.handle,
          variants: product.variants.map((v) => ({
            option: v.title,
            available: v.available,
            quantity: v.inventoryQuantity,
          })),
        });
      }
      const variant = findVariant(product, optionValue);
      if (!variant) {
        return JSON.stringify({
          handle: product.handle,
          requested: optionValue,
          error: "no_such_option",
          available_options: product.variants.map((v) => v.title),
        });
      }
      return JSON.stringify({
        handle: product.handle,
        option: variant.title,
        available: variant.available,
        quantity: variant.inventoryQuantity,
      });
    }

    case TOOL_NAMES.policy: {
      const topic = str(input, "topic") ?? "all";
      const kindByTopic: Record<string, string | undefined> = {
        shipping: "shipping_policy",
        returns: "refund_policy",
        sizing: "sizing",
        about: "authenticity",
        all: undefined,
      };
      const docs = await ctx.catalog.getDocs(kindByTopic[topic]);
      if (docs.length === 0) {
        return JSON.stringify({
          documents: [],
          note: "This store has not written that policy. Say you will check with the team rather than guessing.",
        });
      }
      return JSON.stringify({
        documents: docs.map((d) => ({ title: d.title, body: d.body })),
        cod_available: ctx.settings.codAvailable,
        delivery_days:
          ctx.settings.deliveryDaysMin && ctx.settings.deliveryDaysMax
            ? `${ctx.settings.deliveryDaysMin}-${ctx.settings.deliveryDaysMax}`
            : undefined,
      });
    }

    case TOOL_NAMES.cart: {
      const handle = str(input, "handle");
      const product = handle ? await ctx.catalog.getProductByHandle(handle) : null;
      if (!product) return JSON.stringify({ error: "not_found", handle });

      const optionValue = str(input, "option_value");
      if (!optionValue && product.variants.length > 1) {
        return JSON.stringify({
          error: "option_required",
          available_options: product.variants.filter((v) => v.available).map((v) => v.title),
          note: "Ask the customer which one they want before sending a link.",
        });
      }
      const variant = findVariant(product, optionValue);
      if (!variant) {
        return JSON.stringify({
          error: "no_such_option",
          requested: optionValue,
          available_options: product.variants.filter((v) => v.available).map((v) => v.title),
        });
      }
      if (!variant.available) {
        return JSON.stringify({
          error: "out_of_stock",
          option: variant.title,
          available_options: product.variants.filter((v) => v.available).map((v) => v.title),
          note: "Tell the customer this one is sold out and offer what is in stock.",
        });
      }

      ctx.cartLinkSent = true;
      return JSON.stringify({
        url: buildCartUrl(ctx.profile.shopDomain, variant.id, num(input, "quantity") ?? 1),
        product: product.title,
        option: variant.title,
        price: formatMoney(variant.price, currency),
      });
    }

    case TOOL_NAMES.upsell: {
      const handle = str(input, "handle");
      if (!handle) return JSON.stringify({ suggestions: [] });
      const related = await ctx.catalog.getRelatedProducts(handle, 3);
      return JSON.stringify({
        suggestions: related.map((p) => summarizeProduct(p, currency)),
      });
    }

    case TOOL_NAMES.escalate: {
      ctx.escalated = true;
      return JSON.stringify({
        handed_over: true,
        contact: ctx.settings.escalationContact ?? null,
        note: "Tell the customer a person will follow up, and give the contact if there is one.",
      });
    }

    default:
      return JSON.stringify({ error: "unknown_tool", name });
  }
}
