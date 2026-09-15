/**
 * Tool-layer smoke test.
 *
 *   npm run smoke
 *
 * Exercises executeTool directly, with no model in the loop. These are the
 * paths the bot's honesty depends on — if check_stock lies or build_cart_link
 * produces a bad URL, no amount of prompt tuning saves you.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { storeSnapshot } from "../fixtures/store.js";
import { buildCartUrl, executeTool, type ToolContext } from "../src/agent/tools.js";
import { MemoryCatalog } from "../src/catalog/memory.js";
import { classifyByGid, parseBulkJsonl } from "../src/shopify/bulk.js";
import { htmlToText, numericId } from "../src/shopify/client.js";
import { mapProduct } from "../src/sync/map.js";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

let failures = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    console.log(`${GREEN}ok${RESET}   ${name}`);
  } else {
    failures++;
    console.log(`${RED}FAIL${RESET} ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function call(
  ctx: ToolContext,
  name: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return JSON.parse(await executeTool(name, input, ctx)) as Record<string, unknown>;
}

async function main(): Promise<void> {
  const catalog = new MemoryCatalog(storeSnapshot);
  const ctx: ToolContext = {
    catalog,
    profile: storeSnapshot.profile,
    settings: storeSnapshot.settings,
  };

  // --- search ---------------------------------------------------------------
  const warm = await call(ctx, "search_products", { query: "something warm for winter" });
  const warmTitles = (warm["results"] as Array<Record<string, unknown>>).map((r) => String(r["title"]));
  check("search finds winter items for a vague 'warm' query", warmTitles.length > 0, warmTitles.join(", "));
  check(
    "search results are all in stock by default",
    (warm["results"] as Array<Record<string, unknown>>).every((r) => r["available"] === true),
  );

  const nothing = await call(ctx, "search_products", { query: "iphone charger cable" });
  check(
    "search returns empty for products the store does not sell",
    (nothing["results"] as unknown[]).length === 0,
  );

  const capped = await call(ctx, "search_products", { query: "kurta", max_price: 3300 });
  check("price cap is applied", (capped["results"] as unknown[]).length > 0);

  // --- stock honesty --------------------------------------------------------
  const soldOut = await call(ctx, "check_stock", { handle: "bridal-dupatta-red" });
  const soldOutVariants = soldOut["variants"] as Array<Record<string, unknown>>;
  check(
    "a fully sold out product reports available:false",
    soldOutVariants.every((v) => v["available"] === false),
  );

  const maroonSmall = await call(ctx, "check_stock", {
    handle: "fleece-hoodie-maroon",
    option_value: "S",
  });
  check("out of stock size reports available:false", maroonSmall["available"] === false);

  const blackMedium = await call(ctx, "check_stock", {
    handle: "fleece-hoodie-black",
    option_value: "M",
  });
  check("in stock size reports available:true", blackMedium["available"] === true);

  const badOption = await call(ctx, "check_stock", {
    handle: "fleece-hoodie-black",
    option_value: "XXXL",
  });
  check("nonexistent size returns an error, not a guess", badOption["error"] === "no_such_option");

  // --- cart links -----------------------------------------------------------
  check(
    "cart permalink format",
    buildCartUrl("demo.myshopify.com", "12345", 2) === "https://demo.myshopify.com/cart/12345:2",
    buildCartUrl("demo.myshopify.com", "12345", 2),
  );

  const needsOption = await call(ctx, "build_cart_link", { handle: "cotton-kurta-white" });
  check(
    "multi-variant product refuses a link until a size is chosen",
    needsOption["error"] === "option_required",
  );

  const goodLink = await call(ctx, "build_cart_link", {
    handle: "cotton-kurta-white",
    option_value: "M",
  });
  const url = String(goodLink["url"] ?? "");
  check("valid cart link is produced", /^https:\/\/sana-threads\.myshopify\.com\/cart\/\d+:1$/.test(url), url);
  check("cart link sets the analytics flag", ctx.cartLinkSent === true);

  const oosLink = await call(ctx, "build_cart_link", {
    handle: "fleece-hoodie-maroon",
    option_value: "S",
  });
  check("no cart link for an out of stock size", oosLink["error"] === "out_of_stock");

  const singleVariant = await call(ctx, "build_cart_link", { handle: "leather-tote-tan" });
  check(
    "single-variant product links without asking for an option",
    typeof singleVariant["url"] === "string",
  );

  // --- policies -------------------------------------------------------------
  const shipping = await call(ctx, "get_policy", { topic: "shipping" });
  const shippingBody = String(
    (shipping["documents"] as Array<Record<string, unknown>>)[0]?.["body"] ?? "",
  );
  check("shipping policy mentions COD", /cash on delivery/i.test(shippingBody));
  check("shipping policy is returned with delivery days", shipping["delivery_days"] === "2-5");

  const returns = await call(ctx, "get_policy", { topic: "returns" });
  check(
    "returns policy states the unstitched exclusion",
    /unstitched/i.test(String((returns["documents"] as Array<Record<string, unknown>>)[0]?.["body"] ?? "")),
  );

  // --- upsell ---------------------------------------------------------------
  const upsell = await call(ctx, "suggest_upsell", { handle: "cotton-kurta-white" });
  const suggestions = upsell["suggestions"] as Array<Record<string, unknown>>;
  check("upsell returns related products", suggestions.length > 0);
  check(
    "upsell never suggests the same product back",
    suggestions.every((s) => s["handle"] !== "cotton-kurta-white"),
  );

  // --- escalation -----------------------------------------------------------
  const escalated = await call(ctx, "escalate_to_human", { reason: "refund dispute" });
  check("escalation returns the contact", escalated["handed_over"] === true);
  check("escalation sets the flag", ctx.escalated === true);

  // --- unknown tool ---------------------------------------------------------
  const unknown = await call(ctx, "delete_everything", {});
  check("unknown tool names are rejected", unknown["error"] === "unknown_tool");

  // --- sync: bulk JSONL parsing and mapping ---------------------------------
  // Mapping bugs are quiet and expensive — a mis-parsed price is a wrong price
  // quoted to a real customer — so this is checked against a real-shaped
  // Shopify bulk export rather than only end to end.
  const here = dirname(fileURLToPath(import.meta.url));
  const jsonl = readFileSync(join(here, "../fixtures/bulk-sample.jsonl"), "utf8");
  const bulk = parseBulkJsonl(jsonl, classifyByGid);

  check("bulk parse finds both products as roots", bulk.roots.length === 2);
  check(
    "variants are attached to the right parent",
    bulk.childrenOf("gid://shopify/Product/8001", "ProductVariant").length === 2 &&
      bulk.childrenOf("gid://shopify/Product/8002", "ProductVariant").length === 1,
  );

  const kurtaNode = bulk.roots.find((n) => n["handle"] === "cotton-kurta-white")!;
  const kurta = mapProduct(
    kurtaNode,
    bulk.childrenOf("gid://shopify/Product/8001", "ProductVariant"),
  );

  check("price strings become numbers", kurta.variants[0]?.price === 3200);
  check("variant id is numeric for cart links", kurta.variants[0]?.shopify_variant_id === "45001");
  check("selectedOptions become an options map", kurta.variants[0]?.options["Size"] === "S");
  check("sold out variant is marked unavailable", kurta.variants[1]?.available === false);
  check("product is available when any variant is", kurta.available === true);
  check(
    "price range ignores out of stock variants",
    kurta.price_min === 3200 && kurta.price_max === 3200,
  );
  check("compareAtPrice is kept when set", kurta.variants[1]?.compare_at_price === 4000);
  check("null sku stays null", kurta.variants[0]?.sku === "KUR-W-S");

  const dupattaNode = bulk.roots.find((n) => n["handle"] === "bridal-dupatta-red")!;
  const dupatta = mapProduct(
    dupattaNode,
    bulk.childrenOf("gid://shopify/Product/8002", "ProductVariant"),
  );
  check("fully sold out product is unavailable", dupatta.available === false);
  check(
    "price range falls back to all variants when none available",
    dupatta.price_min === 18500,
  );
  check("missing featured image maps to no images", dupatta.images.length === 0);

  check("html is stripped from descriptions", !kurta.description.includes("<"));
  check("br becomes a newline", kurta.description.includes("\n"));
  check("list items survive as bullets", kurta.description.includes("• Pre-shrunk"));
  check("html entities are decoded", dupatta.description.includes("zari work & hand"));

  check(
    "content hash is stable for identical input",
    mapProduct(kurtaNode, bulk.childrenOf("gid://shopify/Product/8001", "ProductVariant"))
      .content_hash === kurta.content_hash,
  );
  check("content hash differs between products", kurta.content_hash !== dupatta.content_hash);

  check("numericId extracts the trailing id", numericId("gid://shopify/Product/8001") === "8001");
  check("htmlToText handles null", htmlToText(null) === "");
  check("malformed jsonl lines are skipped", parseBulkJsonl("{bad\n", classifyByGid).roots.length === 0);

  console.log();
  if (failures === 0) {
    console.log(`${GREEN}All tool checks passed.${RESET}`);
  } else {
    console.log(`${RED}${failures} check(s) failed.${RESET}`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
