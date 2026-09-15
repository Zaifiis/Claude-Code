import type Anthropic from "@anthropic-ai/sdk";
import type { TokenUsage } from "../types.js";

/**
 * Two tiers, per the "cheapest model per job" decision:
 *
 *   router — intent classification, language detection, query rewriting.
 *            High volume, structurally simple, runs on every single turn.
 *   reply  — the customer-facing message. This is the product; do not cheap out.
 */
export type ModelTier = "router" | "reply";

export interface LlmToolUse {
  id: string;
  name: string;
  input: unknown;
}

export interface LlmRequest {
  tier: ModelTier;
  /**
   * System blocks in stable-first order. Mark the stable prefix with
   * cache_control so the persona and store profile are not re-billed every turn.
   */
  system: Anthropic.TextBlockParam[];
  messages: Anthropic.MessageParam[];
  tools?: Anthropic.Tool[];
  toolChoice?: Anthropic.ToolChoice;
  maxTokens: number;
}

export interface LlmResponse {
  text: string;
  toolUses: LlmToolUse[];
  stopReason: Anthropic.Message["stop_reason"];
  model: string;
  usage: TokenUsage;
}

export interface LlmProvider {
  readonly name: string;
  complete(req: LlmRequest): Promise<LlmResponse>;
}
