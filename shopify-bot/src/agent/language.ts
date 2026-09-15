import type { ReplyLanguage } from "../types.js";

/**
 * Cheap deterministic language detection.
 *
 * The router model does this properly as part of its single call. These
 * heuristics are the fallback when the router fails or is unavailable, and they
 * back the offline mock provider. Getting this wrong is very visible — replying
 * in English to an Urdu-script message reads as a broken bot.
 */

const URDU_SCRIPT = /[؀-ۿ]/;

/**
 * Roman Urdu markers. Chosen to be words that essentially never appear in
 * English shopping questions, so a single hit is a strong signal.
 */
const ROMAN_URDU_MARKERS = [
  "hai", "hain", "kya", "kia", "koi", "kitne", "kitna", "kitni", "chahiye",
  "milega", "milegi", "mein", "mujhe", "aap", "apka", "apki", "acha", "achha",
  "bhej", "bhai", "baji", "yeh", "ye", "wala", "wali", "karo", "kar", "dedo",
  "hoga", "hogi", "nahi", "nahin", "han", "haan", "ji", "assalam", "salam",
  "din", "paisay", "paise", "rupay", "hazar", "hazaar", "sasta", "mehnga",
  "dikhao", "bata", "batao", "lena", "kal", "tak", "wapas", "theek", "thik",
  "soch", "raha", "rahi", "rahe", "hun", "hoon", "abhi", "zara", "thora",
  "bohat", "bahut", "zyada", "sirf", "lekin", "magar", "phir", "bilkul",
  "kaun", "konsa", "konsi", "kaise", "kaisa", "ghalat", "sahi",
  // Short spellings people actually type on a phone. Roman Urdu has no fixed
  // orthography, so the long forms alone miss a lot of real messages.
  "ma", "mai", "tw", "hu", "larka", "larki", "lrka", "lrki", "banda",
  "krna", "krni", "kro", "krte", "dekhna", "lena", "dena", "bhi", "sath",
  // NOTE: do not add words that are also ordinary English shopping words
  // ("order", "size", "free"). One false hit flips the whole reply language,
  // and replying in Roman Urdu to an English customer is very visible.
];

export function detectLanguage(text: string): ReplyLanguage {
  if (URDU_SCRIPT.test(text)) return "urdu";

  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
  const hits = words.filter((w) => ROMAN_URDU_MARKERS.includes(w)).length;
  return hits > 0 ? "roman_urdu" : "english";
}

/**
 * Pull a price ceiling out of phrasings like "under 5000", "5k tak",
 * "5 hazar se kam", "below Rs 3,500".
 */
export function extractPriceCap(text: string): number | undefined {
  const lower = text.toLowerCase();

  const thousands = lower.match(/(\d+(?:\.\d+)?)\s*(k|hazar|hazaar|thousand)\b/);
  if (thousands?.[1]) {
    return Math.round(parseFloat(thousands[1]) * 1000);
  }

  const capWords = /(under|below|less than|upto|up to|max|maximum|tak|se kam|ke andar)/;
  if (capWords.test(lower)) {
    const num = lower.match(/(\d[\d,]{2,})/);
    if (num?.[1]) return parseInt(num[1].replace(/,/g, ""), 10);
  }

  return undefined;
}
