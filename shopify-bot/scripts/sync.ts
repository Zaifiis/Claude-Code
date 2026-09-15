/**
 * Pull a real Shopify store into the mirror.
 *
 *   npm run sync
 *
 * Reads from .env:
 *   SHOP_DOMAIN=your-store.myshopify.com
 *   SHOPIFY_ADMIN_TOKEN=shpat_...        (custom app token — see SETUP.md)
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   VOYAGE_API_KEY=...                   (optional; falls back to the offline
 *                                         embedder, which is not semantic)
 *
 * Run it again any time — it is idempotent, and it reconciles deletions.
 */

import { loadEnv } from "../src/env.js";
import { createSupabaseClient } from "../src/catalog/supabase.js";
import { createEmbeddingProvider } from "../src/providers/embeddings.js";
import { ShopifyClient } from "../src/shopify/client.js";
import { fullSync } from "../src/sync/run.js";

loadEnv();

const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. See SETUP.md.`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const shopDomain = required("SHOP_DOMAIN");
  const accessToken = required("SHOPIFY_ADMIN_TOKEN");

  const supabase = createSupabaseClient();
  const shopify = new ShopifyClient({ shopDomain, accessToken });
  const embeddings = createEmbeddingProvider();

  console.log(`${BOLD}Syncing ${shopDomain}${RESET}`);
  if (embeddings.name === "hash-offline") {
    console.log(
      `${YELLOW}No VOYAGE_API_KEY — using the offline embedder.${RESET}`,
      `${DIM}Search will work but will not be semantic. Set a key before judging retrieval quality.${RESET}`,
    );
  }
  console.log();

  const report = await fullSync(supabase, shopify, accessToken, embeddings, (message) =>
    console.log(`${DIM}${message}${RESET}`),
  );

  console.log();
  console.log(`${BOLD}Done in ${(report.durationMs / 1000).toFixed(1)}s${RESET}`);
  console.log(`  products     ${report.products}`);
  console.log(`  variants     ${report.variants}`);
  console.log(`  collections  ${report.collections}`);
  console.log(`  docs         ${report.docs}`);
  console.log(`  embedded     ${report.embedded} ${DIM}(only what changed)${RESET}`);
  if (report.deletedProducts > 0) {
    console.log(`  removed      ${report.deletedProducts} ${DIM}(deleted in Shopify)${RESET}`);
  }

  if (report.docs === 0) {
    console.log();
    console.log(
      `${YELLOW}This store has no policy pages or content pages.${RESET}`,
      `${DIM}The bot will not be able to answer "COD hai?" or "delivery kitne din?" —`,
      `write them in Shopify admin under Settings → Policies.${RESET}`,
    );
  }

  console.log();
  console.log(`${DIM}Now talk to it:  SHOP_DOMAIN=${shopDomain} npm run chat${RESET}`);
}

main().catch((error: unknown) => {
  console.error(`\nSync failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
