/**
 * Content Studio — the personal idea/script dashboard.
 *
 * One idea is one card. Cards move through five stages, and each stage has its
 * own colour so the list can be read at a glance. Active ideas keep a single
 * ranked make-next order; posting a card archives it into the Posted list.
 */

/**
 * The three brands. A channel is not a platform: Unfiltered goes out on both
 * Instagram and TikTok, and the Agency page posts to LinkedIn and Instagram.
 */
export const CHANNELS = ["Zaifiis_Unfiltered", "Zaifiis.tech", "Agency"] as const;

export type Channel = (typeof CHANNELS)[number];

/** Short labels, because the tabs have no room for the full names. */
export const CHANNEL_SHORT: Record<Channel, string> = {
  Zaifiis_Unfiltered: "Unfiltered",
  "Zaifiis.tech": ".tech",
  Agency: "Agency",
};

/** What each channel is for, shown where there is room to say it. */
export const CHANNEL_PURPOSE: Record<Channel, string> = {
  Zaifiis_Unfiltered: "Builds you",
  "Zaifiis.tech": "Builds authority",
  Agency: "Sells",
};

export function isChannel(value: unknown): value is Channel {
  return CHANNELS.includes(value as Channel);
}

export const PLATFORMS = [
  "Instagram",
  "LinkedIn",
  "TikTok",
  "Facebook",
  "YouTube",
] as const;

export type Platform = (typeof PLATFORMS)[number];

/** The five stages, in the order work moves through them. */
export const STATUSES = ["Idea", "Scripted", "Recorded", "Edited", "Posted"] as const;

export type Status = (typeof STATUSES)[number];

/** The stage that archives a card and takes it out of the ranked order. */
export const DONE_STATUS: Status = "Posted";

/**
 * One colour per stage. These are class name fragments rather than raw values
 * so Tailwind can see them, and every colour is a token that re-resolves in
 * dark mode.
 */
export const STATUS_COLOR: Record<Status, { dot: string; text: string; soft: string; ring: string }> = {
  Idea: {
    dot: "bg-st-blue",
    text: "text-st-blue",
    soft: "bg-st-blue-soft",
    ring: "ring-st-blue",
  },
  Scripted: {
    dot: "bg-st-indigo",
    text: "text-st-indigo",
    soft: "bg-st-indigo-soft",
    ring: "ring-st-indigo",
  },
  Recorded: {
    dot: "bg-st-orange",
    text: "text-st-orange",
    soft: "bg-st-orange-soft",
    ring: "ring-st-orange",
  },
  Edited: {
    dot: "bg-st-teal",
    text: "text-st-teal",
    soft: "bg-st-teal-soft",
    ring: "ring-st-teal",
  },
  Posted: {
    dot: "bg-st-green",
    text: "text-st-green",
    soft: "bg-st-green-soft",
    ring: "ring-st-green",
  },
};

/** A reference for a video: a link to someone else's reel, with a note. */
export interface Inspiration {
  url: string;
  note: string;
}

export interface Idea {
  id: string;
  title: string;
  /** Which of the three brands this belongs to. */
  channel: Channel;
  platform: Platform;
  /** Content pillar / topic. */
  pillar: string;
  /** Position in the make-next order. Lower is sooner; 0 is next up. */
  rank: number;
  status: Status;
  /** Candidate titles for the finished post. */
  titleOptions: string[];
  thumbnailIdea: string;
  /** Opening lines to choose between. */
  hooks: string[];
  /** Markdown: headings, bullets, bold, italic. */
  script: string;
  /** Reels and posts worth stealing from. */
  inspiration: Inspiration[];
  /** Shots to get when recording. */
  shotIdeas: string[];
  caption: string;
  /** `YYYY-MM-DD`, or empty when undated. */
  targetDate: string;
  owner: string;
  notes: string;
  /** Written after the post goes live. */
  performanceNote: string;
  /** True once posted: the card leaves the ranked order. */
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

/**
 * Maps the nine-stage pipeline this app used to have onto the five it has now,
 * so a data file written by the older version still opens.
 */
export const LEGACY_STATUS: Record<string, Status> = {
  Idea: "Idea",
  Planned: "Idea",
  Scripting: "Idea",
  "Ready to record": "Scripted",
  Recording: "Scripted",
  Editing: "Recorded",
  Review: "Edited",
  Scheduled: "Edited",
  Published: "Posted",
};

export const PLATFORM_SHORT: Record<Platform, string> = {
  Instagram: "IG",
  LinkedIn: "LI",
  TikTok: "TT",
  Facebook: "FB",
  YouTube: "YT",
};
