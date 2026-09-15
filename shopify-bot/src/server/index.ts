import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runTurn } from "../agent/pipeline.js";
import { MemoryCatalog } from "../catalog/memory.js";
import { SupabaseCatalog, createSupabaseClient } from "../catalog/supabase.js";
import type { CatalogRepository } from "../catalog/types.js";
import { storeSnapshot } from "../../fixtures/store.js";
import { createProvider } from "../factory.js";
import { createEmbeddingProvider } from "../providers/embeddings.js";
import type { LlmProvider } from "../providers/types.js";
import {
  findOrCreateConversation,
  loadHistory,
  recordTurn,
} from "./conversations.js";
import {
  handleAppUninstalled,
  handleCustomerRedact,
  handleInventoryUpdate,
  handleProductDelete,
  handleProductUpdate,
  handleShopRedact,
} from "./webhooks.js";
import { MemoryHistoryStore } from "./memory-history.js";
import { isFresh, verifyAppProxySignature, verifyWebhookHmac } from "./verify.js";

/**
 * The backend the storefront widget talks to.
 *
 * Two surfaces:
 *   /apps/chat   — App Proxy. Shopify signs it, so we know which shop it is.
 *   /webhooks/*  — Shopify HMAC-signed catalog changes.
 *
 * Plain node:http, no framework: this serves two routes, and a dependency in
 * the request path of every customer message is a dependency worth not having.
 */

const MAX_BODY_BYTES = 256 * 1024;
const MAX_MESSAGE_CHARS = 2000;

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

/** Per-shop catalog instances, built once and reused across requests. */
class CatalogCache {
  private readonly cache = new Map<string, Promise<CatalogRepository>>();
  /**
   * BOT_CATALOG=memory serves every shop from the fixture store, and so does a
   * missing Supabase config. That makes the widget and the whole request path
   * testable before the database exists — the difference between debugging the
   * widget today and waiting on a migration first.
   */
  private readonly useFixtures = process.env["BOT_CATALOG"] === "memory";

  constructor(private readonly supabase: SupabaseClient | null) {}

  get(shopDomain: string): Promise<CatalogRepository> {
    if (this.useFixtures || !this.supabase) {
      return Promise.resolve(new MemoryCatalog(storeSnapshot));
    }

    const existing = this.cache.get(shopDomain);
    if (existing) return existing;

    const created = SupabaseCatalog.forShopDomain(
      this.supabase,
      shopDomain,
      createEmbeddingProvider(),
    ).catch((error: unknown) => {
      // Do not cache a failure — the shop may install a moment later.
      this.cache.delete(shopDomain);
      throw error;
    });

    this.cache.set(shopDomain, created);
    return created;
  }
}

interface ChatRequestBody {
  message?: unknown;
  visitor_id?: unknown;
}

async function handleChat(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  deps: {
    supabase: SupabaseClient | null;
    provider: LlmProvider;
    catalogs: CatalogCache;
    apiSecret: string;
    memoryHistory: MemoryHistoryStore;
  },
): Promise<void> {
  const verified = verifyAppProxySignature(url.searchParams, deps.apiSecret);
  if (!verified.valid || !verified.shop) {
    // Almost always one of: SHOPIFY_API_SECRET does not match this app, or the
    // request did not come through Shopify's proxy at all.
    console.warn(
      `[chat] signature rejected (shop=${url.searchParams.get("shop") ?? "none"}, ` +
        `signature=${url.searchParams.get("signature") ? "present" : "missing"})`,
    );
    json(res, 401, { error: "invalid_signature" });
    return;
  }
  if (!isFresh(url.searchParams.get("timestamp"))) {
    console.warn("[chat] rejected a request with a stale timestamp");
    json(res, 401, { error: "stale_request" });
    return;
  }

  const raw = await readBody(req);
  let body: ChatRequestBody;
  try {
    body = JSON.parse(raw.toString("utf8")) as ChatRequestBody;
  } catch {
    json(res, 400, { error: "invalid_json" });
    return;
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const visitorId = typeof body.visitor_id === "string" ? body.visitor_id.slice(0, 64) : "";

  if (!message || !visitorId) {
    json(res, 400, { error: "message_and_visitor_id_required" });
    return;
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    json(res, 400, { error: "message_too_long" });
    return;
  }

  let catalog: CatalogRepository;
  try {
    catalog = await deps.catalogs.get(verified.shop);
  } catch {
    json(res, 404, { error: "shop_not_installed" });
    return;
  }

  const settings = await catalog.getSettings();
  if (!settings.enabled) {
    json(res, 403, { error: "bot_disabled" });
    return;
  }

  // Server-sent events, so the reply appears as it is written rather than
  // after a four second pause.
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const startedAt = Date.now();
  const supabase = deps.supabase;
  const conversation =
    supabase && catalog instanceof SupabaseCatalog
      ? await findOrCreateConversation(supabase, catalog.shopId, visitorId)
      : null;

  // Fall back to in-process history when there is no database. Without this the
  // bot forgets the previous message entirely and starts every turn from
  // nothing, which reads as stupidity rather than as a missing feature.
  const history =
    supabase && conversation
      ? await loadHistory(supabase, conversation.id)
      : deps.memoryHistory.get(verified.shop, visitorId);

  try {
    const result = await runTurn({
      provider: deps.provider,
      catalog,
      history,
      userMessage: message,
      onDelta: (delta) => send("delta", { text: delta }),
    });

    send("done", {
      reply: result.reply,
      escalated: result.escalated,
      cart_link_sent: result.cartLinkSent,
    });
    res.end();

    if (supabase && conversation) {
      await recordTurn(supabase, conversation, message, result, Date.now() - startedAt);
    } else {
      deps.memoryHistory.append(verified.shop, visitorId, message, result.reply);
    }
  } catch (error) {
    // The stream is already open, so the error goes down the stream, not as a
    // status code. The widget shows a fallback rather than a blank bubble.
    send("error", {
      message: "Sorry — something went wrong. Please try again.",
    });
    res.end();
    console.error("[chat]", error instanceof Error ? error.message : error);
  }
}

async function handleWebhook(
  req: IncomingMessage,
  res: ServerResponse,
  deps: { supabase: SupabaseClient | null; apiSecret: string },
): Promise<void> {
  const raw = await readBody(req);
  const hmac = String(req.headers["x-shopify-hmac-sha256"] ?? "");
  const topic = String(req.headers["x-shopify-topic"] ?? "");
  const shopDomain = String(req.headers["x-shopify-shop-domain"] ?? "");

  if (!verifyWebhookHmac(raw, hmac, deps.apiSecret)) {
    json(res, 401, { error: "invalid_hmac" });
    return;
  }

  // Acknowledge immediately: Shopify retries anything slower than 5 seconds,
  // and a retry storm is worse than a slightly late write.
  json(res, 200, { ok: true });

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw.toString("utf8")) as Record<string, unknown>;
  } catch {
    return;
  }

  // Without a database there is nowhere to apply the change; the 200 above
  // still stops Shopify retrying.
  if (!deps.supabase) return;

  try {
    switch (topic) {
      case "products/create":
      case "products/update":
        await handleProductUpdate(deps.supabase, shopDomain, payload as never);
        break;
      case "products/delete":
        await handleProductDelete(deps.supabase, shopDomain, payload as never);
        break;
      case "inventory_levels/update":
        await handleInventoryUpdate(deps.supabase, shopDomain, payload as never);
        break;
      case "app/uninstalled":
        await handleAppUninstalled(deps.supabase, shopDomain);
        break;
      case "customers/data_request":
      case "customers/redact":
        await handleCustomerRedact(deps.supabase, shopDomain);
        break;
      case "shop/redact":
        await handleShopRedact(deps.supabase, shopDomain);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`[webhook ${topic}]`, error instanceof Error ? error.message : error);
  }
}

export function startServer(port = Number(process.env["PORT"] ?? 3000)): void {
  const apiSecret = process.env["SHOPIFY_API_SECRET"];
  if (!apiSecret) {
    throw new Error(
      "SHOPIFY_API_SECRET is required — it is what verifies that requests actually came from Shopify.",
    );
  }

  const hasSupabase =
    Boolean(process.env["SUPABASE_URL"]) && Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = hasSupabase ? createSupabaseClient() : null;

  if (!supabase) {
    console.warn(
      "No Supabase credentials — serving the fixture store, and conversations will " +
        "not be saved. Fine for testing the widget; not for a real store.",
    );
  }

  const provider = createProvider();
  const catalogs = new CatalogCache(supabase);
  const memoryHistory = new MemoryHistoryStore();

  // Log every request. Without this, a widget that says "connection problem"
  // gives you nothing to work with — you cannot tell a blocked proxy from a
  // rejected signature from a crash.
  const quiet = process.env["LOG_REQUESTS"] === "off";

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const startedAt = Date.now();

    // Shopify's App Proxy forwards the path WITH a trailing slash — a request
    // the widget sends to /apps/chat arrives here as /apps/chat/. Normalise it,
    // or every single storefront message 404s while the same URL works by hand.
    const path =
      url.pathname.length > 1 && url.pathname.endsWith("/")
        ? url.pathname.slice(0, -1)
        : url.pathname;

    if (!quiet) {
      res.on("finish", () => {
        console.log(
          `${req.method} ${url.pathname} -> ${res.statusCode} (${Date.now() - startedAt}ms)` +
            (url.searchParams.get("shop") ? ` shop=${url.searchParams.get("shop")}` : ""),
        );
      });
    }

    void (async () => {
      try {
        if (req.method === "GET" && path === "/health") {
          json(res, 200, {
            ok: true,
            provider: provider.name,
            storage: supabase ? "supabase" : "in-memory",
            conversations: memoryHistory.size,
          });
          return;
        }

        if (req.method === "POST" && path === "/apps/chat") {
          await handleChat(req, res, url, {
            supabase,
            provider,
            catalogs,
            apiSecret,
            memoryHistory,
          });
          return;
        }

        if (req.method === "POST" && path.startsWith("/webhooks")) {
          await handleWebhook(req, res, { supabase, apiSecret });
          return;
        }

        json(res, 404, { error: "not_found" });
      } catch (error) {
        console.error("[server]", error instanceof Error ? error.message : error);
        if (!res.headersSent) json(res, 500, { error: "internal_error" });
        else res.end();
      }
    })();
  });

  server.listen(port, () => {
    console.log(`shopify-bot listening on :${port} (provider: ${provider.name})`);
  });
}
