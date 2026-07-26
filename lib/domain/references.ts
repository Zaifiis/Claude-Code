/**
 * Reference URL parsing + safe embedding.
 *
 * Security: we NEVER iframe an arbitrary user-provided URL. We only produce an
 * embed URL for a small allow-list of providers whose embed endpoints we
 * construct ourselves from a parsed video/post id. Everything else falls back
 * to a rich "open original" card.
 */
import type { PlatformKey } from "./constants";

export type EmbedKind = "youtube" | "none";

export interface ParsedReference {
  platform: PlatformKey;
  /** The canonical original URL (kept verbatim for "Open Original"). */
  url: string;
  /** Host label, e.g. "youtube.com". */
  host: string;
  /** A safe, self-constructed embed URL, when embedding is supported. */
  embedUrl: string | null;
  embedKind: EmbedKind;
  /** Best-effort thumbnail (only when we can derive it safely). */
  thumbnailUrl: string | null;
  /** True when the URL is a syntactically valid http(s) URL. */
  valid: boolean;
}

function safeUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

function stripWww(host: string): string {
  return host.replace(/^www\./, "").toLowerCase();
}

/** Extract a YouTube video id from any common YouTube URL shape. */
export function parseYouTubeId(u: URL): string | null {
  const host = stripWww(u.hostname);
  const isYt =
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtu.be";
  if (!isYt) return null;

  let id: string | null = null;
  if (host === "youtu.be") {
    id = u.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (u.pathname.startsWith("/watch")) {
    id = u.searchParams.get("v");
  } else if (u.pathname.startsWith("/shorts/")) {
    id = u.pathname.split("/")[2] ?? null;
  } else if (u.pathname.startsWith("/embed/")) {
    id = u.pathname.split("/")[2] ?? null;
  } else if (u.pathname.startsWith("/live/")) {
    id = u.pathname.split("/")[2] ?? null;
  }
  if (id && /^[a-zA-Z0-9_-]{6,20}$/.test(id)) return id;
  return null;
}

export function detectPlatform(u: URL): PlatformKey {
  const host = stripWww(u.hostname);
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be" || host === "music.youtube.com") {
    return u.pathname.startsWith("/shorts/") ? "youtube_shorts" : "youtube";
  }
  if (host === "instagram.com" || host === "instagr.am") return "instagram";
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
  if (host === "linkedin.com" || host.endsWith(".linkedin.com") || host === "lnkd.in") return "linkedin";
  if (host === "x.com" || host === "twitter.com" || host === "t.co") return "x";
  if (host === "facebook.com" || host === "fb.com" || host === "fb.watch") return "facebook";
  return "other";
}

/**
 * Parse a raw reference URL into everything the UI needs to render it safely.
 */
export function parseReference(raw: string): ParsedReference {
  const u = safeUrl(raw);
  if (!u) {
    return {
      platform: "other",
      url: raw.trim(),
      host: "",
      embedUrl: null,
      embedKind: "none",
      thumbnailUrl: null,
      valid: false,
    };
  }

  const platform = detectPlatform(u);
  const ytId = parseYouTubeId(u);

  if (ytId) {
    return {
      platform,
      url: u.toString(),
      host: stripWww(u.hostname),
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}`,
      embedKind: "youtube",
      thumbnailUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      valid: true,
    };
  }

  return {
    platform,
    url: u.toString(),
    host: stripWww(u.hostname),
    embedUrl: null,
    embedKind: "none",
    thumbnailUrl: null,
    valid: true,
  };
}

/** Derive a reasonable default title from a URL when the user hasn't set one. */
export function titleFromUrl(raw: string): string {
  const u = safeUrl(raw);
  if (!u) return raw.trim().slice(0, 80) || "Untitled reference";
  const host = stripWww(u.hostname);
  const seg = u.pathname.split("/").filter(Boolean).slice(-1)[0] ?? "";
  const cleaned = decodeURIComponent(seg).replace(/[-_]+/g, " ").replace(/\.\w+$/, "").trim();
  if (cleaned && cleaned.length > 2 && !/^[0-9a-f]{16,}$/i.test(cleaned)) {
    return cleaned.slice(0, 90);
  }
  return host || "Untitled reference";
}
