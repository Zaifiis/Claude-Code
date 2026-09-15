import type { ReplyLanguage } from "../types.js";

/**
 * Post-hoc checks on a generated reply.
 *
 * These do not rewrite the reply — they surface warnings so the eval runner can
 * score them and so regressions show up in the conversation log. The prompt is
 * the primary control; this is the tripwire that tells you the prompt slipped.
 */

export const BANNED_PHRASES = [
  "as an ai",
  "as a language model",
  "i'm here to help you today",
  "i am here to help you today",
  "certainly!",
  "great question",
  "i hope this helps",
  "thank you for reaching out",
  "absolutely!",
  "feel free to ask",
  "let me know if you need anything else",
];

const URDU_SCRIPT = /[؀-ۿ]/;
const LATIN_LETTERS = /[a-zA-Z]{3,}/;

export interface GuardrailWarning {
  code: "banned_phrase" | "too_long" | "mixed_script" | "wrong_language" | "empty";
  detail: string;
}

export function checkReply(
  reply: string,
  expectedLanguage: ReplyLanguage,
): GuardrailWarning[] {
  const warnings: GuardrailWarning[] = [];
  const trimmed = reply.trim();

  if (trimmed.length === 0) {
    warnings.push({ code: "empty", detail: "Reply was empty." });
    return warnings;
  }

  const lower = trimmed.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      warnings.push({ code: "banned_phrase", detail: phrase });
    }
  }

  // Chat cadence: a reply that runs past a few lines reads as a brochure.
  // Lines that are just a product name or a URL are cheap, so count words too.
  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  const words = trimmed.split(/\s+/).length;
  if (lines.length > 6 || words > 90) {
    warnings.push({
      code: "too_long",
      detail: `${lines.length} lines / ${words} words`,
    });
  }

  const hasUrdu = URDU_SCRIPT.test(trimmed);
  // Ignore URLs when looking for Latin text — a cart link is not a language.
  const withoutUrls = trimmed.replace(/https?:\/\/\S+/g, " ");
  const hasLatin = LATIN_LETTERS.test(withoutUrls);

  if (hasUrdu && hasLatin) {
    warnings.push({ code: "mixed_script", detail: "Urdu script and Latin text in one reply." });
  }

  if (expectedLanguage === "urdu" && !hasUrdu) {
    warnings.push({ code: "wrong_language", detail: "Expected Urdu script, got none." });
  }
  if (expectedLanguage !== "urdu" && hasUrdu) {
    warnings.push({
      code: "wrong_language",
      detail: `Expected ${expectedLanguage}, got Urdu script.`,
    });
  }

  return warnings;
}
