import type Anthropic from "@anthropic-ai/sdk";

/**
 * Gendered address terms.
 *
 * The persona prompt tells the bot not to guess between bhai and baji, and the
 * model mostly obeys — but "mostly" is not good enough for a word the customer
 * reads in the first sentence and immediately notices is wrong. A prompt rule
 * is a suggestion; this is the enforcement.
 *
 * Once the customer reveals their own gender, the term is allowed through,
 * because using it correctly is warm and is half the point of casual register.
 */

/** Words that tell us the customer's gender, from their own message. */
const MALE_SIGNALS = [
  "larka", "larke", "lrka", "ladka", "mard", "bhai hu", "bhai hoon",
  "i am a man", "i'm a man", "im a man", "i am male", "male hu",
];

const FEMALE_SIGNALS = [
  "larki", "lrki", "ladki", "aurat", "baji hu", "baji hoon", "behen",
  "i am a woman", "i'm a woman", "im a woman", "i am female", "female hu",
];

export type KnownGender = "male" | "female" | "unknown";

/**
 * What the customer has told us about themselves — never inferred from a name,
 * a writing style, or the products they ask about.
 */
export function detectCustomerGender(
  history: Anthropic.MessageParam[],
  latestMessage: string,
): KnownGender {
  const texts: string[] = [latestMessage];

  for (const message of history) {
    if (message.role !== "user") continue;
    if (typeof message.content === "string") {
      texts.push(message.content);
    } else {
      for (const block of message.content) {
        if (block.type === "text") texts.push(block.text);
      }
    }
  }

  const haystack = texts.join(" ").toLowerCase();

  // A customer calling themselves bhai/baji is the most common reveal.
  if (MALE_SIGNALS.some((signal) => haystack.includes(signal))) return "male";
  if (FEMALE_SIGNALS.some((signal) => haystack.includes(signal))) return "female";
  return "unknown";
}

/**
 * Strip a gendered address term the bot had no business using, leaving a
 * sentence that still reads naturally.
 *
 * "Baji, kya dhoond rahi hain?"   -> "Kya dhoond rahi hain?"
 * "Ji baji, batayein"             -> "Ji, batayein"
 * "theek hai bhai"                -> "theek hai"
 */
export function neutraliseAddress(reply: string, gender: KnownGender): string {
  if (gender !== "unknown") return reply;
  if (!/\b(baji|bhai|behen|behan)\b/i.test(reply)) return reply;

  let out = reply;

  // "Ji baji," -> "Ji,"  (keep the warm particle, drop the guess)
  out = out.replace(/\b(ji)\s+(baji|bhai|behen|behan)\b/gi, "$1");

  // Leading address: "Baji, ..." / "Bhai! ..." -> "..."
  out = out.replace(/(^|[\n.!?]\s*)(baji|bhai|behen|behan)\s*[,!—-]?\s*/gi, "$1");

  // Trailing or mid-sentence: ", baji" / " bhai."
  out = out.replace(/\s*,\s*(baji|bhai|behen|behan)\b/gi, "");
  out = out.replace(/\s+\b(baji|bhai|behen|behan)\b/gi, "");

  // Tidy what the removals left behind.
  out = out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/^\s*[,.!]\s*/g, "")
    .trim();

  // Recapitalise if we removed the first word of a sentence.
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_m, prefix: string, letter: string) =>
    `${prefix}${letter.toUpperCase()}`,
  );

  return out;
}
