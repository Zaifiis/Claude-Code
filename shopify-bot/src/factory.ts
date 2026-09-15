import { MemoryCatalog } from "./catalog/memory.js";
import { createSupabaseClient, SupabaseCatalog } from "./catalog/supabase.js";
import type { CatalogRepository } from "./catalog/types.js";
import { createEmbeddingProvider } from "./providers/embeddings.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { MockProvider } from "./providers/mock.js";
import type { LlmProvider } from "./providers/types.js";
import { storeSnapshot } from "../fixtures/store.js";

/**
 * Picks a provider based on what credentials are actually present.
 *
 * With no key you still get a running bot (templated replies) so the plumbing,
 * the tools and the cart links can be exercised. With a key you get the real
 * thing. BOT_PROVIDER=mock forces the offline path even when a key exists,
 * which is what CI should use.
 */
export function createProvider(): LlmProvider {
  const forced = process.env["BOT_PROVIDER"];
  if (forced === "mock") return new MockProvider();
  if (forced === "anthropic") return new AnthropicProvider();

  const hasKey =
    Boolean(process.env["ANTHROPIC_API_KEY"]) ||
    Boolean(process.env["ANTHROPIC_AUTH_TOKEN"]);
  return hasKey ? new AnthropicProvider() : new MockProvider();
}

/**
 * Fixtures by default; the real store mirror when Supabase is configured.
 *
 * Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SHOP_DOMAIN and the same
 * `npm run chat` talks to a live catalog. BOT_CATALOG=memory forces fixtures.
 */
export async function createCatalog(): Promise<CatalogRepository> {
  if (process.env["BOT_CATALOG"] === "memory") return new MemoryCatalog(storeSnapshot);

  const shopDomain = process.env["SHOP_DOMAIN"];
  const hasSupabase =
    Boolean(process.env["SUPABASE_URL"]) && Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"]);

  if (shopDomain && hasSupabase) {
    return SupabaseCatalog.forShopDomain(
      createSupabaseClient(),
      shopDomain,
      createEmbeddingProvider(),
    );
  }

  return new MemoryCatalog(storeSnapshot);
}
