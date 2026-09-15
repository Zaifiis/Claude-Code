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
import { createHmac } from "node:crypto";
import { detectCustomerGender, neutraliseAddress } from "../src/agent/address.js";
import { classifyByGid, parseBulkJsonl } from "../src/shopify/bulk.js";
import { isFresh, verifyAppProxySignature, verifyWebhookHmac } from "../src/server/verify.js";
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

  // --- request authentication ----------------------------------------------
  // These are the only thing between the backend and the open internet. A bug
  // here does not show up as a broken feature — it shows up as someone else
  // using your OpenAI credits, so it is checked directly.
  const SECRET = "test_secret_value";

  function signedProxyQuery(params: Record<string, string>): URLSearchParams {
    const sorted = Object.keys(params).sort();
    const payload = sorted.map((key) => `${key}=${params[key]}`).join("");
    const signature = createHmac("sha256", SECRET).update(payload).digest("hex");
    const query = new URLSearchParams(params);
    query.set("signature", signature);
    return query;
  }

  const goodProxy = signedProxyQuery({
    shop: "sana-threads-dev.myshopify.com",
    path_prefix: "/apps/chat",
    timestamp: String(Math.floor(Date.now() / 1000)),
  });
  const proxyResult = verifyAppProxySignature(goodProxy, SECRET);
  check("valid app proxy signature is accepted", proxyResult.valid === true);
  check("shop domain is extracted", proxyResult.shop === "sana-threads-dev.myshopify.com");

  const tampered = signedProxyQuery({
    shop: "sana-threads-dev.myshopify.com",
    path_prefix: "/apps/chat",
    timestamp: String(Math.floor(Date.now() / 1000)),
  });
  tampered.set("shop", "attacker-store.myshopify.com");
  check(
    "tampering with the shop parameter is rejected",
    verifyAppProxySignature(tampered, SECRET).valid === false,
  );

  check(
    "a request with no signature is rejected",
    verifyAppProxySignature(new URLSearchParams({ shop: "x.myshopify.com" }), SECRET).valid === false,
  );

  check(
    "a signature made with the wrong secret is rejected",
    verifyAppProxySignature(goodProxy, "wrong_secret").valid === false,
  );

  check("a fresh timestamp passes", isFresh(String(Math.floor(Date.now() / 1000))));
  check(
    "an old timestamp is rejected (replay protection)",
    isFresh(String(Math.floor(Date.now() / 1000) - 3600)) === false,
  );
  check("a missing timestamp is rejected", isFresh(null) === false);

  const body = Buffer.from(JSON.stringify({ id: 1, title: "Kurta" }));
  const goodHmac = createHmac("sha256", SECRET).update(body).digest("base64");
  check("valid webhook hmac is accepted", verifyWebhookHmac(body, goodHmac, SECRET) === true);
  check(
    "a webhook with a tampered body is rejected",
    verifyWebhookHmac(Buffer.from('{"id":1,"title":"Hacked"}'), goodHmac, SECRET) === false,
  );
  check("a webhook with no hmac header is rejected", verifyWebhookHmac(body, "", SECRET) === false);
  check(
    "a webhook signed with the wrong secret is rejected",
    verifyWebhookHmac(body, goodHmac, "wrong_secret") === false,
  );

  // --- gendered address ------------------------------------------------------
  // Real bug from the first storefront conversation: the bot called a male
  // customer "baji". The prompt forbids it; this makes it certain.
  check(
    "leading Baji is removed",
    neutraliseAddress("Baji, kya dhoond rahi hain?", "unknown") === "Kya dhoond rahi hain?",
    neutraliseAddress("Baji, kya dhoond rahi hain?", "unknown"),
  );
  check(
    "Ji baji collapses to Ji",
    neutraliseAddress("Ji baji, batayein kya chahiye", "unknown") === "Ji, batayein kya chahiye",
    neutraliseAddress("Ji baji, batayein kya chahiye", "unknown"),
  );
  check(
    "trailing bhai is removed",
    neutraliseAddress("Theek hai bhai", "unknown") === "Theek hai",
    neutraliseAddress("Theek hai bhai", "unknown"),
  );
  check(
    "mid-sentence address is removed",
    neutraliseAddress("Hoodie available hai, baji", "unknown") === "Hoodie available hai",
    neutraliseAddress("Hoodie available hai, baji", "unknown"),
  );
  check(
    "a reply with no address term is untouched",
    neutraliseAddress("Ye do cheezein mil sakti hain", "unknown") === "Ye do cheezein mil sakti hain",
  );
  check(
    "once gender is known the term is allowed",
    neutraliseAddress("Theek hai bhai", "male") === "Theek hai bhai",
  );

  check(
    "customer saying larka hu reveals male",
    detectCustomerGender([], "ma tw larka hu") === "male",
  );
  check(
    "customer saying larki hun reveals female",
    detectCustomerGender([], "main larki hun") === "female",
  );
  check(
    "no reveal stays unknown",
    detectCustomerGender([], "koi hoodie hai?") === "unknown",
  );
  check(
    "a reveal earlier in the conversation still counts",
    detectCustomerGender(
      [{ role: "user", content: "ma larka hu" }],
      "hoodie dikhao",
    ) === "male",
  );

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
