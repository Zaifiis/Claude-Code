/**
 * Content Studio — the personal idea/script dashboard.
 *
 * One idea is one card. Active ideas live in a single ranked list ordered by
 * `rank`; publishing an idea archives it, which is what takes it out of that
 * list.
 */

export const PLATFORMS = [
  "Instagram",
  "LinkedIn",
  "TikTok",
  "Facebook",
  "YouTube",
] as const;

export type Platform = (typeof PLATFORMS)[number];

/** Pipeline stages, in the order work actually moves through them. */
export const STATUSES = [
  "Idea",
  "Planned",
  "Scripting",
  "Ready to record",
  "Recording",
  "Editing",
  "Review",
  "Scheduled",
  "Published",
] as const;

export type Status = (typeof STATUSES)[number];

/** The stage that archives a card and pulls it out of the ranked list. */
export const DONE_STATUS: Status = "Published";

export interface Idea {
  id: string;
  title: string;
  platform: Platform;
  /** Content pillar / topic. Doubles as the tag used for filtering. */
  pillar: string;
  /** Position in the make-next order. Lower is sooner; 0 is next up. */
  rank: number;
  status: Status;
  /** Candidate titles for the finished video or post. */
  titleOptions: string[];
  thumbnailIdea: string;
  hook: string;
  /** Markdown: headings, bullets, bold, italic. */
  script: string;
  caption: string;
  /** `YYYY-MM-DD`, or empty when undated. */
  targetDate: string;
  /** Who is making it, when more than one person is involved. */
  owner: string;
  notes: string;
  /** Written after the post goes live. */
  performanceNote: string;
  /** True once published: the card moves to the done archive. */
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** Fields a client is allowed to write. `rank` and `archived` are derived. */
export type IdeaDraft = Omit<
  Idea,
  "id" | "rank" | "archived" | "createdAt" | "updatedAt" | "publishedAt"
>;

export type IdeaPatch = Partial<IdeaDraft>;

export function isPlatform(value: unknown): value is Platform {
  return PLATFORMS.includes(value as Platform);
}

export function isStatus(value: unknown): value is Status {
  return STATUSES.includes(value as Status);
}

export const PLATFORM_SHORT: Record<Platform, string> = {
  Instagram: "IG",
  LinkedIn: "LI",
  TikTok: "TT",
  Facebook: "FB",
  YouTube: "YT",
};
