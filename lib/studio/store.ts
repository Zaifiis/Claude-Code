/**
 * File-backed store for Content Studio.
 *
 * Everything lives in one JSON file so the dashboard needs no database and
 * nothing is lost between sessions. Writes are serialised through an in-process
 * lock and land atomically (temp file + rename) so a crash mid-save can never
 * leave a half-written file behind.
 *
 * Server only — never import this from a Client Component.
 */

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  applyOrder,
  normaliseRanks,
  syncArchiveState,
  UNRANKED,
} from "@/lib/studio/ranking";
import {
  DONE_STATUS,
  type Idea,
  type IdeaPatch,
  isPlatform,
  isStatus,
  PLATFORMS,
} from "@/types/studio";

const DATA_FILE = process.env.STUDIO_DATA_FILE
  ? path.resolve(process.env.STUDIO_DATA_FILE)
  : path.join(process.cwd(), "data", "studio.json");

/** Generous caps that keep one runaway paste from bloating the whole file. */
const LIMITS = {
  title: 300,
  pillar: 120,
  owner: 120,
  shortText: 2_000,
  caption: 20_000,
  script: 400_000,
  titleOptions: 24,
} as const;

// --- serialisation ---------------------------------------------------------

let writeQueue: Promise<unknown> = Promise.resolve();

/** Runs `fn` after every previously queued mutation has settled. */
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

// --- coercion --------------------------------------------------------------

function str(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  // Normalise newlines so word counts and diffs stay stable across platforms.
  return value.replace(/\r\n?/g, "\n").slice(0, max);
}

function isoDate(value: unknown): string {
  const raw = typeof value === "string" ? value.trim().slice(0, 10) : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const [y, m, d] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const roundTrips =
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d;
  return roundTrips ? raw : "";
}

function titleOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, LIMITS.titleOptions)
    .map((option) => str(option, LIMITS.title))
    .filter((option) => option.trim().length > 0);
}

/** Fills in every field so a hand-edited or older file still loads cleanly. */
function coerceIdea(value: unknown): Idea | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim().slice(0, 64) : null;
  if (!id) return null;

  const status = isStatus(raw.status) ? raw.status : "Idea";
  const now = new Date().toISOString();
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : now;

  return {
    id,
    title: str(raw.title, LIMITS.title),
    platform: isPlatform(raw.platform) ? raw.platform : PLATFORMS[0],
    pillar: str(raw.pillar, LIMITS.pillar),
    rank: typeof raw.rank === "number" && Number.isFinite(raw.rank) ? raw.rank : UNRANKED,
    status,
    titleOptions: titleOptions(raw.titleOptions),
    thumbnailIdea: str(raw.thumbnailIdea, LIMITS.shortText),
    hook: str(raw.hook, LIMITS.shortText),
    script: str(raw.script, LIMITS.script),
    caption: str(raw.caption, LIMITS.caption),
    targetDate: isoDate(raw.targetDate),
    owner: str(raw.owner, LIMITS.owner),
    notes: str(raw.notes, LIMITS.shortText),
    performanceNote: str(raw.performanceNote, LIMITS.shortText),
    archived: typeof raw.archived === "boolean" ? raw.archived : status === DONE_STATUS,
    createdAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt,
    publishedAt: typeof raw.publishedAt === "string" ? raw.publishedAt : null,
  };
}

/** Applies only the fields a client is allowed to write. */
function applyPatch(idea: Idea, patch: IdeaPatch): Idea {
  const next = { ...idea };
  if ("title" in patch) next.title = str(patch.title, LIMITS.title);
  if ("platform" in patch && isPlatform(patch.platform)) next.platform = patch.platform;
  if ("pillar" in patch) next.pillar = str(patch.pillar, LIMITS.pillar);
  if ("status" in patch && isStatus(patch.status)) next.status = patch.status;
  if ("titleOptions" in patch) next.titleOptions = titleOptions(patch.titleOptions);
  if ("thumbnailIdea" in patch) next.thumbnailIdea = str(patch.thumbnailIdea, LIMITS.shortText);
  if ("hook" in patch) next.hook = str(patch.hook, LIMITS.shortText);
  if ("script" in patch) next.script = str(patch.script, LIMITS.script);
  if ("caption" in patch) next.caption = str(patch.caption, LIMITS.caption);
  if ("targetDate" in patch) next.targetDate = isoDate(patch.targetDate);
  if ("owner" in patch) next.owner = str(patch.owner, LIMITS.owner);
  if ("notes" in patch) next.notes = str(patch.notes, LIMITS.shortText);
  if ("performanceNote" in patch) {
    next.performanceNote = str(patch.performanceNote, LIMITS.shortText);
  }
  return next;
}

// --- disk ------------------------------------------------------------------

async function load(): Promise<Idea[]> {
  let text: string;
  try {
    text = await readFile(DATA_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // A corrupt file should not take the dashboard down; keep the bad copy and
    // start clean rather than throwing on every request.
    await rename(DATA_FILE, `${DATA_FILE}.corrupt-${Date.now()}`).catch(() => {});
    return [];
  }

  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { ideas?: unknown })?.ideas)
      ? (parsed as { ideas: unknown[] }).ideas
      : [];

  return normaliseRanks(list.map(coerceIdea).filter((idea): idea is Idea => idea !== null));
}

async function save(ideas: Idea[]): Promise<void> {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify({ version: 1, ideas }, null, 2)}\n`, "utf8");
  await rename(temp, DATA_FILE);
}

/** Read, transform, write — all under the lock so writes can't interleave. */
async function mutate<T>(fn: (ideas: Idea[]) => { ideas: Idea[]; result: T }): Promise<T> {
  return withLock(async () => {
    const { ideas, result } = fn(await load());
    await save(normaliseRanks(ideas));
    return result;
  });
}

// --- public API ------------------------------------------------------------

export function listIdeas(): Promise<Idea[]> {
  return withLock(load);
}

export function createIdea(input: IdeaPatch & { id?: string }): Promise<Idea> {
  return mutate((ideas) => {
    const now = new Date().toISOString();
    const requested = typeof input.id === "string" ? input.id.trim().slice(0, 64) : "";
    const id = requested && !ideas.some((idea) => idea.id === requested) ? requested : randomUUID();

    const base: Idea = {
      id,
      title: "",
      platform: PLATFORMS[0],
      pillar: "",
      // New ideas land at the bottom of the ranked list, ready to be dragged up.
      rank: UNRANKED - 1,
      status: "Idea",
      titleOptions: [],
      thumbnailIdea: "",
      hook: "",
      script: "",
      caption: "",
      targetDate: "",
      owner: "",
      notes: "",
      performanceNote: "",
      archived: false,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    };

    const created = syncArchiveState(applyPatch(base, input), false);
    return { ideas: [...ideas, created], result: created };
  });
}

export function patchIdea(id: string, patch: IdeaPatch): Promise<Idea | null> {
  return mutate((ideas) => {
    const current = ideas.find((idea) => idea.id === id);
    if (!current) return { ideas, result: null };

    const updated = syncArchiveState(
      { ...applyPatch(current, patch), updatedAt: new Date().toISOString() },
      current.archived,
    );

    return {
      ideas: ideas.map((idea) => (idea.id === id ? updated : idea)),
      result: updated,
    };
  });
}

export function deleteIdea(id: string): Promise<boolean> {
  return mutate((ideas) => ({
    ideas: ideas.filter((idea) => idea.id !== id),
    result: ideas.some((idea) => idea.id === id),
  }));
}

/**
 * Reorders the active list. `orderedIds` is the new make-next order; any active
 * idea the client did not list keeps its relative place after the ones it did.
 */
export function reorderIdeas(orderedIds: string[]): Promise<Idea[]> {
  return mutate((ideas) => {
    const reordered = applyOrder(ideas, orderedIds);
    return { ideas: reordered, result: reordered };
  });
}
