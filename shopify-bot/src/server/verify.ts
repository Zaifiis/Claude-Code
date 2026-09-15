import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Request authentication.
 *
 * Both checks below are the only thing standing between your backend and
 * anyone on the internet who knows the URL. The widget runs in a customer's
 * browser, so nothing it sends can be trusted — the shop it claims to be
 * included. Shopify signs both request types, and these verify the signature.
 */

/** Constant-time compare that also tolerates length mismatches. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * App Proxy requests.
 *
 * Shopify appends shop, path_prefix, timestamp, logged_in_customer_id and a
 * `signature` built from every other query parameter, sorted by key and
 * concatenated without separators.
 */
export function verifyAppProxySignature(
  query: URLSearchParams,
  apiSecret: string,
): { valid: boolean; shop?: string; loggedInCustomerId?: string } {
  const signature = query.get("signature");
  if (!signature) return { valid: false };

  const params: string[] = [];
  const keys = [...new Set([...query.keys()])].filter((key) => key !== "signature").sort();
  for (const key of keys) {
    // Repeated keys are joined with commas, per Shopify's scheme.
    params.push(`${key}=${query.getAll(key).join(",")}`);
  }

  const digest = createHmac("sha256", apiSecret).update(params.join("")).digest("hex");
  if (!safeEqual(digest, signature)) return { valid: false };

  const shop = query.get("shop") ?? undefined;
  const loggedInCustomerId = query.get("logged_in_customer_id") || undefined;
  return { valid: true, ...(shop ? { shop } : {}), ...(loggedInCustomerId ? { loggedInCustomerId } : {}) };
}

/**
 * Webhook requests.
 *
 * Base64 HMAC of the RAW body — parse the JSON only after this passes. Hashing
 * a re-serialised body silently fails, because key order and whitespace change.
 */
export function verifyWebhookHmac(rawBody: Buffer, headerHmac: string, apiSecret: string): boolean {
  if (!headerHmac) return false;
  const digest = createHmac("sha256", apiSecret).update(rawBody).digest("base64");
  return safeEqual(digest, headerHmac);
}

/**
 * Reject stale signed requests, so a captured URL cannot be replayed forever.
 * Shopify's timestamp is in seconds.
 */
export function isFresh(timestamp: string | null, maxAgeSeconds = 300): boolean {
  if (!timestamp) return false;
  const seconds = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(seconds)) return false;
  return Math.abs(Date.now() / 1000 - seconds) <= maxAgeSeconds;
}
