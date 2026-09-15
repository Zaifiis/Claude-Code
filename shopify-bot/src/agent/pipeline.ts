import type Anthropic from "@anthropic-ai/sdk";
import type { CatalogRepository } from "../catalog/types.js";
import { estimateCostUsd } from "../providers/anthropic.js";
import type { LlmProvider } from "../providers/types.js";
import type { ReplyLanguage, TokenUsage } from "../types.js";
import { addUsage, emptyUsage } from "../types.js";
import { checkReply, type GuardrailWarning } from "./guardrails.js";
import { detectLanguage, extractPriceCap } from "./language.js";
import { buildSystemBlocks, routingHint } from "./persona.js";
import { executeTool, replyTools, ROUTE_TOOL_NAME, routeTool, type ToolContext } from "./tools.js";

/**
 * One customer turn, end to end.
 *
 * route (cheap model) -> retrieve via tools (strong model) -> reply
 *
 * Deliberately free of HTTP, Shopify and Supabase: give it a CatalogRepository
 * and an LlmProvider and it runs anywhere — the terminal harness, the eval
 * runner, and later the app proxy endpoint and a WhatsApp webhook.
 */

const ROUTER_SYSTEM =
  "You classify incoming messages for a Pakistani online store's chat. " +
  "Customers write in English, Roman Urdu (Urdu in Latin letters) or Urdu script, often mixed. " +
  "Call the route tool exactly once. Rewrite what they want as a short English product search query — " +
  "translate Roman Urdu shopping words (kurta, lawn, suit, sasta, garam, sardi) into the English terms a " +
  "product catalog would use. Do not answer the customer.";

export interface RouteResult {
  intent: string;
  language: ReplyLanguage;
  searchQuery: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface TurnInput {
  provider: LlmProvider;
  catalog: CatalogRepository;
  /** Prior turns. Pass the `messages` from the previous TurnResult. */
  history?: Anthropic.MessageParam[];
  userMessage: string;
  /** Guard against a tool loop that never terminates. */
  maxToolRounds?: number;
}

export interface TurnResult {
  reply: string;
  route: RouteResult;
  /** Full history including this turn — feed straight back in as `history`. */
  messages: Anthropic.MessageParam[];
  toolCalls: Array<{ name: string; input: unknown }>;
  usage: TokenUsage;
  costUsd: number;
  cartLinkSent: boolean;
  escalated: boolean;
  warnings: GuardrailWarning[];
}

/** Heuristic fallback when the router call fails or returns nothing usable. */
function fallbackRoute(userMessage: string): RouteResult {
  return {
    intent: "product_search",
    language: detectLanguage(userMessage),
    searchQuery: userMessage,
    maxPrice: extractPriceCap(userMessage),
  };
}

function parseRoute(input: unknown, userMessage: string): RouteResult {
  if (typeof input !== "object" || input === null) return fallbackRoute(userMessage);
  const raw = input as Record<string, unknown>;

  const language = raw["language"];
  const intent = raw["intent"];
  const searchQuery = raw["search_query"];
  const minPrice = raw["min_price"];
  const maxPrice = raw["max_price"];

  return {
    intent: typeof intent === "string" ? intent : "other",
    language:
      language === "english" || language === "roman_urdu" || language === "urdu"
        ? language
        : detectLanguage(userMessage),
    searchQuery: typeof searchQuery === "string" && searchQuery.length > 0 ? searchQuery : userMessage,
    minPrice: typeof minPrice === "number" ? minPrice : undefined,
    maxPrice: typeof maxPrice === "number" ? maxPrice : undefined,
  };
}

export async function runTurn(input: TurnInput): Promise<TurnResult> {
  const { provider, catalog, userMessage } = input;
  const maxToolRounds = input.maxToolRounds ?? 4;

  const [profile, settings] = await Promise.all([
    catalog.getProfile(),
    catalog.getSettings(),
  ]);

  let usage = emptyUsage();
  let costUsd = 0;

  // ---- Step 1: route -------------------------------------------------------
  let route: RouteResult;
  try {
    const routed = await provider.complete({
      tier: "router",
      system: [{ type: "text", text: ROUTER_SYSTEM }],
      messages: [{ role: "user", content: userMessage }],
      tools: [routeTool],
      toolChoice: { type: "tool", name: ROUTE_TOOL_NAME },
      maxTokens: 512,
    });

    usage = addUsage(usage, routed.usage);
    costUsd += estimateCostUsd(routed.model, routed.usage);

    const call = routed.toolUses.find((t) => t.name === ROUTE_TOOL_NAME);
    route = call ? parseRoute(call.input, userMessage) : fallbackRoute(userMessage);
  } catch {
    // A router failure must never take the conversation down — degrade to
    // heuristics and let the reply model do the work.
    route = fallbackRoute(userMessage);
  }

  // ---- Step 2/3: retrieve and reply ---------------------------------------
  const ctx: ToolContext = { catalog, profile, settings };
  const system = buildSystemBlocks(profile, settings);

  const messages: Anthropic.MessageParam[] = [
    ...(input.history ?? []),
    {
      role: "user",
      content: [
        { type: "text", text: userMessage },
        { type: "text", text: routingHint(route.language, route.intent) },
      ],
    },
  ];

  const toolCalls: Array<{ name: string; input: unknown }> = [];
  let reply = "";

  for (let round = 0; round <= maxToolRounds; round++) {
    const result = await provider.complete({
      tier: "reply",
      system,
      messages,
      tools: replyTools,
      maxTokens: 2000,
    });

    usage = addUsage(usage, result.usage);
    costUsd += estimateCostUsd(result.model, result.usage);

    if (result.toolUses.length === 0) {
      reply = result.text;
      messages.push({ role: "assistant", content: result.text });
      break;
    }

    // Echo the assistant turn back verbatim, tool_use ids included.
    const assistantContent: Anthropic.ContentBlockParam[] = [];
    if (result.text) assistantContent.push({ type: "text", text: result.text });
    for (const use of result.toolUses) {
      assistantContent.push({
        type: "tool_use",
        id: use.id,
        name: use.name,
        input: use.input as Record<string, unknown>,
      });
    }
    messages.push({ role: "assistant", content: assistantContent });

    // Run them concurrently, then return ALL results in ONE user message —
    // splitting them trains the model out of making parallel calls.
    const results = await Promise.all(
      result.toolUses.map(async (use) => {
        toolCalls.push({ name: use.name, input: use.input });
        try {
          return { id: use.id, content: await executeTool(use.name, use.input, ctx) };
        } catch (error) {
          return {
            id: use.id,
            content: JSON.stringify({
              error: "tool_failed",
              detail: error instanceof Error ? error.message : String(error),
            }),
            isError: true,
          };
        }
      }),
    );

    messages.push({
      role: "user",
      content: results.map((r) => ({
        type: "tool_result" as const,
        tool_use_id: r.id,
        content: r.content,
        ...(r.isError ? { is_error: true } : {}),
      })),
    });

    if (round === maxToolRounds) {
      // Out of rounds with no answer — better to say nothing than to guess.
      reply = result.text;
    }
  }

  return {
    reply,
    route,
    messages,
    toolCalls,
    usage,
    costUsd,
    cartLinkSent: ctx.cartLinkSent ?? false,
    escalated: ctx.escalated ?? false,
    warnings: checkReply(reply, route.language),
  };
}
