import { MemoryCatalog } from "./catalog/memory.js";
import type { CatalogRepository } from "./catalog/types.js";
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

/** The fixture store. Swap for SupabaseCatalog once a real store is synced. */
export function createCatalog(): CatalogRepository {
  return new MemoryCatalog(storeSnapshot);
}
