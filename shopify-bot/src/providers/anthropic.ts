import Anthropic from "@anthropic-ai/sdk";
import type { LlmProvider, LlmRequest, LlmResponse, LlmToolUse, ModelTier } from "./types.js";

/**
 * Model choice per tier.
 *
 * The router runs on every turn and only has to classify and rewrite, so it
 * runs on Haiku. The customer-facing reply runs on Opus — the persona is the
 * product, and a reply that sounds robotic or invents a price costs more than
 * the token difference ever saves.
 *
 * Note the per-model API differences (they are not interchangeable):
 *   - Haiku 4.5 rejects output_config.effort, so the router sends none.
 *   - Opus 5 runs adaptive thinking by default, so `thinking` is omitted; effort
 *     is pinned low because this is a latency-sensitive chat route, and chat is
 *     one of the workloads that does not repay higher effort.
 */
const MODELS: Record<ModelTier, string> = {
  router: "claude-haiku-4-5",
  reply: "claude-opus-5",
};

/** USD per million tokens, for the per-conversation cost log. */
const PRICING: Record<string, { input: number; output: number; cacheRead: number }> = {
  "claude-haiku-4-5": { input: 1.0, output: 5.0, cacheRead: 0.1 },
  "claude-opus-5": { input: 5.0, output: 25.0, cacheRead: 0.5 },
};

export function estimateCostUsd(
  model: string,
  usage: { inputTokens: number; outputTokens: number; cacheReadTokens: number },
): number {
  const price = PRICING[model];
  if (!price) return 0;
  return (
    (usage.inputTokens * price.input +
      usage.outputTokens * price.output +
      usage.cacheReadTokens * price.cacheRead) /
    1_000_000
  );
}

export class AnthropicProvider implements LlmProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;

  constructor(client?: Anthropic) {
    // Zero-arg construction resolves ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN,
    // or an `ant auth login` profile. Don't hardcode a key.
    this.client = client ?? new Anthropic();
  }

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const model = MODELS[req.tier];

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: req.maxTokens,
      system: req.system,
      messages: req.messages,
    };
    if (req.tools && req.tools.length > 0) params.tools = req.tools;
    if (req.toolChoice) params.tool_choice = req.toolChoice;
    // effort is supported on Opus 5 but errors on Haiku 4.5.
    if (req.tier === "reply") params.output_config = { effort: "low" };

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create(params);
    } catch (error) {
      if (error instanceof Anthropic.BadRequestError) {
        throw new Error(`Anthropic rejected the request (${model}): ${error.message}`);
      }
      if (error instanceof Anthropic.AuthenticationError) {
        throw new Error(
          "Anthropic authentication failed. Set ANTHROPIC_API_KEY, or run `ant auth login`.",
        );
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new Error("Anthropic rate limit hit — back off and retry.");
      }
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Anthropic API error ${error.status}: ${error.message}`);
      }
      throw error;
    }

    // Always check stop_reason before reading content — a refusal returns 200.
    if (response.stop_reason === "refusal") {
      const category = response.stop_details?.category ?? "unknown";
      throw new Error(`Model declined to answer (category: ${category}).`);
    }

    let text = "";
    const toolUses: LlmToolUse[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        text += block.text;
      } else if (block.type === "tool_use") {
        toolUses.push({ id: block.id, name: block.name, input: block.input });
      }
    }

    return {
      text: text.trim(),
      toolUses,
      stopReason: response.stop_reason,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      },
    };
  }
}
