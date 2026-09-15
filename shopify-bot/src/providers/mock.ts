import type Anthropic from "@anthropic-ai/sdk";
import { detectLanguage, extractPriceCap } from "../agent/language.js";
import { ROUTE_TOOL_NAME, TOOL_NAMES } from "../agent/tools.js";
import type { ReplyLanguage } from "../types.js";
import type { LlmProvider, LlmRequest, LlmResponse, TextDeltaHandler } from "./types.js";

/**
 * Offline provider — no API key, no network, fully deterministic.
 *
 * This is a WIRING HARNESS, not a good salesperson. It exists so the pipeline,
 * the tools, the cart links and the eval runner can be exercised before you
 * have an Anthropic key, and so CI can run without spending money. Its replies
 * are templated: they will be correct and on-language, but flat.
 *
 * Judge persona quality only against AnthropicProvider.
 */
export class MockProvider implements LlmProvider {
  readonly name = "mock";

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const userText = lastUserText(req.messages);
    const language = detectLanguage(userText);

    if (req.tier === "router") {
      return this.route(userText, language);
    }

    // Only results from THIS turn count. The history carries tool results from
    // previous turns, and treating those as fresh makes the bot answer the new
    // question with the old answer.
    const results = toolResultsThisTurn(req.messages);
    if (results.length === 0) {
      return this.chooseTool(req.messages, userText);
    }
    return this.speak(results[results.length - 1]!, language);
  }

  /** Emits the finished text word by word so the streaming UI can be tested. */
  async completeStreaming(req: LlmRequest, onDelta: TextDeltaHandler): Promise<LlmResponse> {
    const result = await this.complete(req);
    for (const word of result.text.split(/(\s+)/)) {
      if (word) onDelta(word);
    }
    return result;
  }

  private route(userText: string, language: ReplyLanguage): LlmResponse {
    const lower = userText.toLowerCase();
    let intent = "product_search";
    if (/^(hi|hello|salam|assalam|aoa)\b/.test(lower)) intent = "greeting";
    else if (/(deliver|shipping|cod|cash on|return|refund|exchange|size|policy|kitne din)/.test(lower)) {
      intent = "policy_question";
    } else if (/(order|tracking|parcel|kahan hai)/.test(lower)) intent = "order_status";
    else if (/(complain|ghalat|wrong|damaged|kharab|bakwas)/.test(lower)) intent = "complaint";

    const maxPrice = extractPriceCap(userText);

    return response({
      toolUses: [
        {
          id: "mock-route",
          name: ROUTE_TOOL_NAME,
          input: {
            intent,
            language,
            search_query: intent === "product_search" ? stripNoise(userText) : "",
            min_price: null,
            max_price: maxPrice ?? null,
          },
        },
      ],
      stopReason: "tool_use",
      model: "mock-router",
    });
  }

  private chooseTool(messages: Anthropic.MessageParam[], userText: string): LlmResponse {
    const lower = userText.toLowerCase();

    // Hand over anything about an existing order, a complaint or a refund.
    if (
      /(mera order|my order|tracking|parcel|kahan hai|complain|ghalat size|wrong size|damaged|kharab|money back|refund kar|want my money)/.test(
        lower,
      )
    ) {
      return toolCall(TOOL_NAMES.escalate, { reason: stripNoise(userText).slice(0, 80) });
    }

    // Close: an affirmative, plus a product already discussed this conversation.
    if (/\b(bhej do|bhejdo|le lunga|le lungi|i'?ll take|ill take|theek hai|thik hai|ok(ay)?|yes|haan|han ji|order kar)\b/.test(lower)) {
      const handle = lastSeenHandle(messages);
      const option = lastSeenOption(messages);
      if (handle) {
        return toolCall(TOOL_NAMES.cart, option ? { handle, option_value: option } : { handle });
      }
    }

    if (/^(hi|hello|hey|salam|assalam|aoa)\b/.test(lower)) {
      // A greeting needs no tool — answering it with a catalog search is
      // exactly the robotic behaviour the persona rules forbid.
      return response({
        text: say(detectLanguage(userText), "greet"),
        model: "mock-reply",
      });
    }
    if (/(deliver|shipping|cod|cash on|kitne din|kal tak|kab tak)/.test(lower)) {
      return toolCall(TOOL_NAMES.policy, { topic: "shipping" });
    }
    if (/(return|refund|exchange|wapas)/.test(lower)) {
      return toolCall(TOOL_NAMES.policy, { topic: "returns" });
    }
    if (/(size|fitting|naap)/.test(lower)) {
      return toolCall(TOOL_NAMES.policy, { topic: "sizing" });
    }
    return toolCall(TOOL_NAMES.search, {
      query: stripNoise(userText),
      max_price: extractPriceCap(userText),
    });
  }

  private speak(resultJson: string, language: ReplyLanguage): LlmResponse {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(resultJson) as Record<string, unknown>;
    } catch {
      return response({ text: say(language, "generic"), model: "mock-reply" });
    }

    if (Array.isArray(data["results"])) {
      const results = data["results"] as Array<Record<string, unknown>>;
      if (results.length === 0) return response({ text: say(language, "none"), model: "mock-reply" });
      const top = results.slice(0, 2);
      const lines = top.map((r) => `${String(r["title"])}, ${String(r["price"])}`);
      return response({
        text: `${say(language, "found")}\n${lines.join("\n")}\n${say(language, "which")}`,
        model: "mock-reply",
      });
    }

    if (typeof data["url"] === "string") {
      return response({
        text: `${say(language, "cart")}\n${String(data["url"])}`,
        model: "mock-reply",
      });
    }

    if (Array.isArray(data["documents"])) {
      const docs = data["documents"] as Array<Record<string, unknown>>;
      const body = String(docs[0]?.["body"] ?? "");
      return response({
        text: `${say(language, "policy")}\n${body.split("\n").slice(0, 3).join("\n")}`,
        model: "mock-reply",
      });
    }

    if (data["error"] === "out_of_stock") {
      return response({ text: say(language, "sold_out"), model: "mock-reply" });
    }

    if (data["error"] === "option_required" || data["error"] === "no_such_option") {
      const options = (data["available_options"] as string[] | undefined) ?? [];
      return response({
        text: `${say(language, "ask_option")} ${options.join(", ")}`.trim(),
        model: "mock-reply",
      });
    }

    return response({ text: say(language, "generic"), model: "mock-reply" });
  }
}

type Phrase = "found" | "which" | "none" | "cart" | "policy" | "sold_out" | "generic" | "greet" | "ask_option";

const PHRASES: Record<ReplyLanguage, Record<Phrase, string>> = {
  english: {
    found: "These two should work:",
    which: "Which one do you like?",
    none: "We don't have that one. What else are you looking for?",
    cart: "Here you go, this link adds it to your cart:",
    policy: "Here's how it works:",
    sold_out: "That one's sold out right now. Want me to show what's in stock?",
    generic: "Tell me a bit more and I'll find it for you.",
    greet: "Hello! What are you looking for today?",
    ask_option: "Which size should I send?",
  },
  roman_urdu: {
    found: "Ye do cheezein mil sakti hain:",
    which: "Konsi pasand aayi?",
    none: "Ye to available nahi hai. Aur kya dekhna chahenge?",
    cart: "Ye lijiye, is link se cart mein add ho jayega:",
    policy: "Ji, aise hota hai:",
    sold_out: "Ye filhal out of stock hai. Jo available hai wo dikha dun?",
    generic: "Thora aur bataiye, main dhoond deti hun.",
    greet: "Walaikum assalam! Kya dhoond rahe hain?",
    ask_option: "Konsi size bhejun?",
  },
  urdu: {
    found: "یہ دو چیزیں مل سکتی ہیں:",
    which: "کون سی پسند آئی؟",
    none: "یہ دستیاب نہیں ہے۔ اور کیا دیکھنا چاہیں گے؟",
    cart: "یہ لیجیے، اس لنک سے کارٹ میں شامل ہو جائے گا:",
    policy: "جی، ایسے ہوتا ہے:",
    sold_out: "یہ فی الحال دستیاب نہیں۔ جو موجود ہے وہ دکھا دوں؟",
    generic: "تھوڑا اور بتائیے، میں ڈھونڈ دیتی ہوں۔",
    greet: "وعلیکم السلام! کیا ڈھونڈ رہے ہیں؟",
    ask_option: "کون سا سائز بھیجوں؟",
  },
};

function say(language: ReplyLanguage, phrase: Phrase): string {
  return PHRASES[language][phrase];
}

function response(partial: Partial<LlmResponse>): LlmResponse {
  return {
    text: "",
    toolUses: [],
    stopReason: "end_turn",
    model: "mock",
    usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 },
    ...partial,
  };
}

function toolCall(name: string, input: Record<string, unknown>): LlmResponse {
  return response({
    toolUses: [{ id: `mock-${name}`, name, input }],
    stopReason: "tool_use",
    model: "mock-reply",
  });
}

function stripNoise(text: string): string {
  return text.replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
}

function lastUserText(messages: Anthropic.MessageParam[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]!;
    if (message.role !== "user") continue;
    if (typeof message.content === "string") return message.content;
    const text = message.content
      .filter((b): b is Anthropic.TextBlockParam => b.type === "text")
      .map((b) => b.text)
      .join(" ");
    if (text.trim()) return text;
  }
  return "";
}

/** Index of the last user message that carries actual customer text. */
function lastUserTextIndex(messages: Anthropic.MessageParam[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]!;
    if (message.role !== "user") continue;
    if (typeof message.content === "string") return i;
    if (message.content.some((b) => b.type === "text")) return i;
  }
  return -1;
}

/**
 * The product the customer most likely means by "that one".
 *
 * Takes the TOP-ranked handle from the most recent tool result that had any —
 * search results come back best-first, so the last handle in the list is the
 * worst match, which is exactly the wrong thing to put in someone's cart.
 */
function lastSeenHandle(messages: Anthropic.MessageParam[]): string | undefined {
  const results = allToolResults(messages);
  for (let i = results.length - 1; i >= 0; i--) {
    const match = results[i]!.match(/"handle"\s*:\s*"([^"]+)"/);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

/** A size or colour the customer named anywhere in the conversation. */
function lastSeenOption(messages: Anthropic.MessageParam[]): string | undefined {
  const texts: string[] = [];
  for (const message of messages) {
    if (message.role !== "user") continue;
    if (typeof message.content === "string") {
      texts.push(message.content);
    } else {
      for (const block of message.content) {
        if (block.type === "text") texts.push(block.text);
      }
    }
  }
  const joined = texts.join(" ");
  const uk = joined.match(/\bUK\s*(\d+)\b/i);
  if (uk) return `UK ${uk[1]}`;
  const named = joined.match(/\b(small|medium|large|extra large)\b/i);
  if (named?.[1]) {
    const map: Record<string, string> = {
      small: "S",
      medium: "M",
      large: "L",
      "extra large": "XL",
    };
    return map[named[1].toLowerCase()];
  }
  const letter = joined.match(/\b(XL|S|M|L)\b/);
  return letter?.[1];
}

function allToolResults(messages: Anthropic.MessageParam[]): string[] {
  return collectToolResults(messages, 0);
}

function toolResultsThisTurn(messages: Anthropic.MessageParam[]): string[] {
  return collectToolResults(messages, lastUserTextIndex(messages));
}

function collectToolResults(messages: Anthropic.MessageParam[], fromIndex: number): string[] {
  const out: string[] = [];
  for (let i = Math.max(0, fromIndex); i < messages.length; i++) {
    const message = messages[i]!;
    if (message.role !== "user" || typeof message.content === "string") continue;
    for (const block of message.content) {
      if (block.type !== "tool_result") continue;
      const content = block.content;
      if (typeof content === "string") {
        out.push(content);
      } else if (Array.isArray(content)) {
        for (const part of content) {
          if (part.type === "text") out.push(part.text);
        }
      }
    }
  }
  return out;
}
