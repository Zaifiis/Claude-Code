import type Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { LlmProvider, LlmRequest, LlmResponse, LlmToolUse, ModelTier } from "./types.js";

/**
 * OpenAI provider.
 *
 * The pipeline speaks Anthropic's message shape internally (it was written
 * against that SDK's types), so this file translates in both directions. That
 * translation is the only reason this is more than fifty lines — the request
 * itself is ordinary Chat Completions.
 *
 * Tier split, per the "cheapest model per job" decision:
 *   router — Luna, the cost-optimised tier. Runs on every turn, only classifies.
 *   reply  — Terra, the balanced tier. Override with OPENAI_REPLY_MODEL if you
 *            want Astra (the flagship); it is roughly 5x the price per token,
 *            which is a real cost per conversation, not a rounding error.
 */
const DEFAULT_MODELS: Record<ModelTier, string> = {
  router: "gpt-5.6-luna",
  reply: "gpt-5.6-terra",
};

/** USD per million tokens. Verified against OpenAI's pricing page. */
const PRICING: Record<string, { input: number; output: number; cacheRead: number }> = {
  "gpt-6-astra": { input: 10.0, output: 50.0, cacheRead: 1.0 },
  "gpt-5.6-terra": { input: 2.0, output: 12.0, cacheRead: 0.2 },
};

const warnedUnpriced = new Set<string>();

export function estimateOpenAiCostUsd(
  model: string,
  usage: { inputTokens: number; outputTokens: number; cacheReadTokens: number },
): number {
  const price = PRICING[model];
  if (!price) {
    // Better to say so once than to quietly report every conversation as free.
    if (!warnedUnpriced.has(model)) {
      warnedUnpriced.add(model);
      console.warn(
        `[cost] No pricing on file for "${model}" — cost will read as $0. ` +
          "Add it to PRICING in src/providers/openai.ts.",
      );
    }
    return 0;
  }
  const billedInput = Math.max(0, usage.inputTokens - usage.cacheReadTokens);
  return (
    (billedInput * price.input +
      usage.outputTokens * price.output +
      usage.cacheReadTokens * price.cacheRead) /
    1_000_000
  );
}

/** Anthropic tool definitions -> OpenAI function tools. */
function toOpenAiTools(tools: Anthropic.Tool[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      ...(tool.description ? { description: tool.description } : {}),
      parameters: tool.input_schema as Record<string, unknown>,
    },
  }));
}

function toOpenAiToolChoice(
  choice: Anthropic.ToolChoice | undefined,
): OpenAI.Chat.Completions.ChatCompletionToolChoiceOption | undefined {
  if (!choice) return undefined;
  if (choice.type === "tool") return { type: "function", function: { name: choice.name } };
  if (choice.type === "any") return "required";
  if (choice.type === "none") return "none";
  return "auto";
}

function textOf(blocks: Anthropic.ContentBlockParam[]): string {
  return blocks
    .filter((b): b is Anthropic.TextBlockParam => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function toolResultText(content: Anthropic.ToolResultBlockParam["content"]): string {
  if (typeof content === "string") return content;
  if (!content) return "";
  return content
    .filter((part): part is Anthropic.TextBlockParam => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

/**
 * Anthropic messages -> OpenAI messages.
 *
 * The shapes differ in one structural way that matters: Anthropic returns tool
 * results as blocks inside a *user* message, while OpenAI expects a separate
 * message per result with `role: "tool"`. Getting this wrong produces a model
 * that appears to ignore its own tool output.
 */
function toOpenAiMessages(
  system: Anthropic.TextBlockParam[],
  messages: Anthropic.MessageParam[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const out: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  const systemText = system.map((block) => block.text).join("\n\n");
  if (systemText) out.push({ role: "system", content: systemText });

  for (const message of messages) {
    if (typeof message.content === "string") {
      out.push({ role: message.role, content: message.content });
      continue;
    }

    if (message.role === "assistant") {
      const toolUses = message.content.filter(
        (b): b is Anthropic.ToolUseBlockParam => b.type === "tool_use",
      );
      const text = textOf(message.content);

      const assistant: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam = {
        role: "assistant",
        content: text || null,
      };
      if (toolUses.length > 0) {
        assistant.tool_calls = toolUses.map((use) => ({
          id: use.id,
          type: "function",
          function: { name: use.name, arguments: JSON.stringify(use.input ?? {}) },
        }));
      }
      out.push(assistant);
      continue;
    }

    // role: "user" — may carry tool results, ordinary text, or both.
    const toolResults = message.content.filter(
      (b): b is Anthropic.ToolResultBlockParam => b.type === "tool_result",
    );
    for (const result of toolResults) {
      out.push({
        role: "tool",
        tool_call_id: result.tool_use_id,
        content: toolResultText(result.content),
      });
    }

    const text = textOf(message.content);
    if (text) out.push({ role: "user", content: text });
  }

  return out;
}

export class OpenAiProvider implements LlmProvider {
  readonly name = "openai";
  private readonly client: OpenAI;
  private readonly models: Record<ModelTier, string>;

  constructor(client?: OpenAI) {
    this.client = client ?? new OpenAI();
    this.models = {
      router: process.env["OPENAI_ROUTER_MODEL"] || DEFAULT_MODELS.router,
      reply: process.env["OPENAI_REPLY_MODEL"] || DEFAULT_MODELS.reply,
    };
  }

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const model = this.models[req.tier];

    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model,
      messages: toOpenAiMessages(req.system, req.messages),
      // max_tokens is deprecated and rejected by reasoning models.
      max_completion_tokens: req.maxTokens,
    };

    if (req.tools && req.tools.length > 0) {
      params.tools = toOpenAiTools(req.tools);
      const choice = toOpenAiToolChoice(req.toolChoice);
      if (choice) params.tool_choice = choice;
    }

    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await this.client.chat.completions.create(params);
    } catch (error) {
      if (error instanceof OpenAI.AuthenticationError) {
        throw new Error("OpenAI rejected the API key. Check OPENAI_API_KEY in .env.");
      }
      if (error instanceof OpenAI.RateLimitError) {
        throw new Error(
          "OpenAI rate limit or quota exceeded. If this is a new key, check that the " +
            "account has credit — a key with no balance fails exactly like this.",
        );
      }
      if (error instanceof OpenAI.NotFoundError) {
        throw new Error(
          `OpenAI has no model "${model}" available to this account. ` +
            "Set OPENAI_ROUTER_MODEL / OPENAI_REPLY_MODEL in .env to models you can access.",
        );
      }
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API error ${error.status}: ${error.message}`);
      }
      throw error;
    }

    const choice = completion.choices[0];
    const message = choice?.message;

    const toolUses: LlmToolUse[] = (message?.tool_calls ?? []).flatMap((call) => {
      if (call.type !== "function") return [];
      let input: unknown = {};
      try {
        input = JSON.parse(call.function.arguments || "{}");
      } catch {
        // A malformed tool call is recoverable: the tool layer treats a bad
        // input as a not-found and the model gets to try again.
        input = {};
      }
      return [{ id: call.id, name: call.function.name, input }];
    });

    const usage = completion.usage;
    const cacheReadTokens = usage?.prompt_tokens_details?.cached_tokens ?? 0;

    return {
      text: (message?.content ?? "").trim(),
      toolUses,
      stopReason: toolUses.length > 0 ? "tool_use" : "end_turn",
      model: completion.model,
      usage: {
        inputTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
        cacheReadTokens,
      },
    };
  }
}
