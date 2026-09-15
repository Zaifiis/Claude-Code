import type Anthropic from "@anthropic-ai/sdk";

/**
 * In-process conversation history, for when Supabase is not configured.
 *
 * Without this the bot has no memory: every message starts a fresh
 * conversation, so it finds a hoodie, then forgets it the moment the customer
 * says "medium size chahiye" and starts offering bags. That is not a tuning
 * problem, it is amnesia, and it makes the bot look stupid in a way no prompt
 * can fix.
 *
 * Deliberately simple and deliberately temporary: it lives in one process and
 * dies with it. Production stores history in Supabase, which survives restarts
 * and lets you read conversations back. This exists so the widget behaves
 * correctly while you are still building.
 */

interface Entry {
  messages: Anthropic.MessageParam[];
  lastSeen: number;
}

/** Turns to keep. Every turn resends the whole history, so this is a cost knob. */
const MAX_MESSAGES = 12;
/** Drop a conversation after this long idle. */
const TTL_MS = 2 * 60 * 60 * 1000;
/** Hard cap on conversations held, so a busy dev store cannot grow unbounded. */
const MAX_CONVERSATIONS = 500;

export class MemoryHistoryStore {
  private readonly entries = new Map<string, Entry>();

  private key(shopDomain: string, visitorId: string): string {
    return `${shopDomain}::${visitorId}`;
  }

  get(shopDomain: string, visitorId: string): Anthropic.MessageParam[] {
    this.sweep();
    const entry = this.entries.get(this.key(shopDomain, visitorId));
    if (!entry) return [];
    entry.lastSeen = Date.now();
    return entry.messages;
  }

  /**
   * Store the turn as plain text.
   *
   * Tool calls and their results are dropped on purpose: replaying last turn's
   * raw JSON balloons the prompt and the model does not need it to answer the
   * next question. This mirrors what loadHistory() does for Supabase, so the
   * bot behaves the same either way.
   */
  append(
    shopDomain: string,
    visitorId: string,
    userMessage: string,
    assistantReply: string,
  ): void {
    if (!assistantReply.trim()) return;

    const key = this.key(shopDomain, visitorId);
    const entry = this.entries.get(key) ?? { messages: [], lastSeen: Date.now() };

    entry.messages.push({ role: "user", content: userMessage });
    entry.messages.push({ role: "assistant", content: assistantReply });
    entry.lastSeen = Date.now();

    // Keep the tail, and never let it start on an assistant turn — the API
    // rejects a history that does not begin with the customer.
    if (entry.messages.length > MAX_MESSAGES) {
      entry.messages = entry.messages.slice(entry.messages.length - MAX_MESSAGES);
    }
    while (entry.messages.length > 0 && entry.messages[0]?.role === "assistant") {
      entry.messages.shift();
    }

    this.entries.set(key, entry);
    this.evictIfNeeded();
  }

  private sweep(): void {
    const cutoff = Date.now() - TTL_MS;
    for (const [key, entry] of this.entries) {
      if (entry.lastSeen < cutoff) this.entries.delete(key);
    }
  }

  private evictIfNeeded(): void {
    if (this.entries.size <= MAX_CONVERSATIONS) return;
    const oldest = [...this.entries.entries()].sort((a, b) => a[1].lastSeen - b[1].lastSeen);
    const excess = this.entries.size - MAX_CONVERSATIONS;
    for (let i = 0; i < excess; i++) {
      const key = oldest[i]?.[0];
      if (key) this.entries.delete(key);
    }
  }

  /** Conversations currently held. Exposed for the health check. */
  get size(): number {
    return this.entries.size;
  }
}
