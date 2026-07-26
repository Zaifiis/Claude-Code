/**
 * Domain constants for Content OS.
 * Single source of truth for platforms, formats, pipeline statuses and
 * priorities — including the colours used for their badges/dots.
 */

export type PlatformKey =
  | "instagram"
  | "youtube"
  | "youtube_shorts"
  | "linkedin"
  | "tiktok"
  | "x"
  | "facebook"
  | "other";

export type FormatKey =
  | "reel"
  | "short"
  | "long_form"
  | "carousel"
  | "text_post"
  | "thread"
  | "case_study"
  | "tutorial"
  | "tool_breakdown"
  | "story"
  | "opinion"
  | "other";

export type StatusKey =
  | "inbox"
  | "idea"
  | "research"
  | "scripting"
  | "ready_to_record"
  | "recording"
  | "editing"
  | "ready_to_post"
  | "scheduled"
  | "posted";

export type PriorityKey = "low" | "medium" | "high" | "urgent";

export interface Option<K extends string> {
  key: K;
  label: string;
  color?: string;
}

export const PLATFORMS: Option<PlatformKey>[] = [
  { key: "instagram", label: "Instagram", color: "#e1306c" },
  { key: "youtube", label: "YouTube", color: "#ff0033" },
  { key: "youtube_shorts", label: "YouTube Shorts", color: "#ff0033" },
  { key: "linkedin", label: "LinkedIn", color: "#0a66c2" },
  { key: "tiktok", label: "TikTok", color: "#111114" },
  { key: "x", label: "X", color: "#111114" },
  { key: "facebook", label: "Facebook", color: "#1877f2" },
  { key: "other", label: "Other", color: "#8b8d98" },
];

export const FORMATS: Option<FormatKey>[] = [
  { key: "reel", label: "Reel" },
  { key: "short", label: "Short" },
  { key: "long_form", label: "Long-form video" },
  { key: "carousel", label: "Carousel" },
  { key: "text_post", label: "Text post" },
  { key: "thread", label: "Thread" },
  { key: "case_study", label: "Case study" },
  { key: "tutorial", label: "Tutorial" },
  { key: "tool_breakdown", label: "Tool breakdown" },
  { key: "story", label: "Story" },
  { key: "opinion", label: "Opinion" },
  { key: "other", label: "Other" },
];

/** Pipeline columns, in workflow order. `status` on a content item is one of these. */
export const STATUSES: Option<StatusKey>[] = [
  { key: "inbox", label: "Inbox", color: "#8b8d98" },
  { key: "idea", label: "Idea", color: "#7d7bff" },
  { key: "research", label: "Research", color: "#0ea5e9" },
  { key: "scripting", label: "Scripting", color: "#8b5cf6" },
  { key: "ready_to_record", label: "Ready to Record", color: "#14b8a6" },
  { key: "recording", label: "Recording", color: "#f59e0b" },
  { key: "editing", label: "Editing", color: "#ec4899" },
  { key: "ready_to_post", label: "Ready to Post", color: "#22c55e" },
  { key: "scheduled", label: "Scheduled", color: "#3b82f6" },
  { key: "posted", label: "Posted", color: "#1a8a52" },
];

export const PRIORITIES: Option<PriorityKey>[] = [
  { key: "low", label: "Low", color: "#8b8d98" },
  { key: "medium", label: "Medium", color: "#3b82f6" },
  { key: "high", label: "High", color: "#f59e0b" },
  { key: "urgent", label: "Urgent", color: "#ef4444" },
];

/** Fast lookup maps. */
const toMap = <K extends string>(opts: Option<K>[]) =>
  Object.fromEntries(opts.map((o) => [o.key, o])) as Record<K, Option<K>>;

export const PLATFORM_MAP = toMap(PLATFORMS);
export const FORMAT_MAP = toMap(FORMATS);
export const STATUS_MAP = toMap(STATUSES);
export const PRIORITY_MAP = toMap(PRIORITIES);

export const STATUS_ORDER: StatusKey[] = STATUSES.map((s) => s.key);
export const PRIORITY_ORDER: Record<PriorityKey, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function labelFor<K extends string>(
  map: Record<K, Option<K>>,
  key: string | null | undefined,
  fallback = "—",
): string {
  if (!key) return fallback;
  return (map as Record<string, Option<K>>)[key]?.label ?? key;
}

/** Statuses considered "in production" for dashboard stats. */
export const IN_PRODUCTION_STATUSES: StatusKey[] = [
  "research",
  "scripting",
  "ready_to_record",
  "recording",
  "editing",
];

export const READY_STATUSES: StatusKey[] = ["ready_to_post", "scheduled"];
