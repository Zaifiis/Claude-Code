import type { SupabaseClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";
import type { TurnResult } from "../agent/pipeline.js";

/**
 * Conversation persistence.
 *
 * Two jobs: keep history so the bot remembers the last few turns, and record
 * what every turn cost. The cost log is not optional bookkeeping — it is the
 * number that decides whether this product can be sold profitably, and you
 * cannot reconstruct it after the fact.
 *
 * Every function is best-effort: a logging failure must never take down a
 * customer's chat.
 */

/** How many prior turns to replay. Long enough to hold a thread, short enough
 * to keep the prompt cheap — every turn resends the whole history. */
const HISTORY_LIMIT = 12;

export interface ConversationRef {
  id: string;
  shopId: string;
}

export async function findOrCreateConversation(
  supabase: SupabaseClient,
  shopId: string,
  visitorId: string,
): Promise<ConversationRef | null> {
  try {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("shop_id", shopId)
      .eq("visitor_id", visitorId)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return { id: (existing as { id: string }).id, shopId };

    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ shop_id: shopId, visitor_id: visitorId })
      .select("id")
      .single();

    if (error || !created) return null;
    return { id: (created as { id: string }).id, shopId };
  } catch {
    return null;
  }
}

/**
 * Rebuild pipeline history from stored messages.
 *
 * Only user text and final assistant replies are replayed — tool calls and
 * their results are deliberately dropped. Replaying those would balloon the
 * prompt, and the model does not need last turn's raw JSON to answer this one.
 */
export async function loadHistory(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<Anthropic.MessageParam[]> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    if (error || !data) return [];

    const rows = (data as Array<{ role: string; content: string | null }>).reverse();
    const messages: Anthropic.MessageParam[] = [];

    for (const row of rows) {
      if (!row.content) continue;
      if (row.role !== "user" && row.role !== "assistant") continue;
      messages.push({ role: row.role, content: row.content });
    }

    // The API rejects a history that opens on an assistant turn.
    while (messages.length > 0 && messages[0]?.role === "assistant") messages.shift();
    return messages;
  } catch {
    return [];
  }
}

export async function recordTurn(
  supabase: SupabaseClient,
  conversation: ConversationRef,
  userMessage: string,
  result: TurnResult,
  latencyMs: number,
): Promise<void> {
  try {
    await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        shop_id: conversation.shopId,
        role: "user",
        content: userMessage,
      },
      {
        conversation_id: conversation.id,
        shop_id: conversation.shopId,
        role: "assistant",
        content: result.reply,
        tool_calls: result.toolCalls.length > 0 ? result.toolCalls : null,
        input_tokens: result.usage.inputTokens,
        output_tokens: result.usage.outputTokens,
        cache_read_tokens: result.usage.cacheReadTokens,
        cost_usd: result.costUsd,
        latency_ms: latencyMs,
      },
    ]);

    const update: Record<string, unknown> = { last_message_at: new Date().toISOString() };
    if (result.cartLinkSent) update["cart_link_sent"] = true;
    if (result.escalated) {
      update["escalated"] = true;
      update["escalation_reason"] = result.route.intent;
    }

    await supabase.from("conversations").update(update).eq("id", conversation.id);
  } catch {
    // Never let bookkeeping break a live conversation.
  }
}
