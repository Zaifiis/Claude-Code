/**
 * Tool-layer smoke test.
 *
 *   npm run smoke
 *
 * Exercises executeTool directly, with no model in the loop. These are the
 * paths the bot's honesty depends on — if check_stock lies or build_cart_link
 * produces a bad URL, no amount of prompt tuning saves you.
 */

import { storeSnapshot } from "../fixtures/store.js";
import { buildCartUrl, executeTool, type ToolContext } from "../src/agent/tools.js";
import { MemoryCatalog } from "../src/catalog/memory.js";

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
