/**
 * An optional single-password gate for Content Studio.
 *
 * Set `STUDIO_PASSWORD` and the studio asks for it once per device; leave it
 * unset and the studio is open, which is what you want on your own laptop.
 * There are no accounts and no database — the signed cookie is derived from
 * the password itself, so changing the password signs every device out.
 */

export const SESSION_COOKIE = "studio_session";

/** How long a device stays signed in. */
const SESSION_DAYS = 30;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

const encoder = new TextEncoder();

/** The configured password, or null when the studio is meant to be open. */
export function studioPassword(): string | null {
  const password = process.env.STUDIO_PASSWORD?.trim();
  return password ? password : null;
}

function base64url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64url");
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

/** Compares without leaking how much of the value matched. */
function equals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** True when `attempt` is the configured password. */
export async function passwordMatches(attempt: string): Promise<boolean> {
  const password = studioPassword();
  if (!password) return true;

  // Hash both sides first so the comparison is over equal-length digests
  // whatever the attempt's length.
  const [a, b] = await Promise.all([sign(attempt, "studio-login"), sign(password, "studio-login")]);
  return equals(a, b);
}

/** Builds the cookie value for a device that has just signed in. */
export async function createSession(): Promise<string> {
  const password = studioPassword();
  if (!password) return "";

  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  return `${expiresAt}.${await sign(String(expiresAt), password)}`;
}

/** True when the cookie is intact, unexpired, and signed with this password. */
export async function sessionIsValid(cookie: string | undefined): Promise<boolean> {
  const password = studioPassword();
  if (!password) return true;
  if (!cookie) return false;

  const separator = cookie.indexOf(".");
  if (separator < 1) return false;

  const expiresAt = cookie.slice(0, separator);
  const signature = cookie.slice(separator + 1);

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  return equals(signature, await sign(expiresAt, password));
}
