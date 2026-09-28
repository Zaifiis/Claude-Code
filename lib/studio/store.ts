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

import { storeBackend } from "@/lib/studio/backend";
import {
  applyOrder,
  normaliseRanks,
  syncArchiveState,
  UNRANKED,
} from "@/lib/studio/ranking";
import {
  CHANNELS,
  DONE_STATUS,
  type Idea,
  type IdeaPatch,
  type Inspiration,
  isChannel,
  isPlatform,
  isStatus,
  LEGACY_STATUS,
  PLATFORMS,
  type StudioData,
  type Todo,
  type TodoPatch,
} from "@/types/studio";

/** How many times a write retries when another device wrote first. */
const MAX_WRITE_ATTEMPTS = 5;

/** Generous caps that keep one runaway paste from bloating the whole file. */
const LIMITS = {
  title: 300,
  pillar: 120,
  owner: 120,
  shortText: 2_000,
  caption: 20_000,
  script: 400_000,
  titleOptions: 24,
  listRows: 40,
  url: 2_000,
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

/** A list of short text rows: title options, hooks, shot ideas. */
function textList(value: unknown, max: number, limit: number = LIMITS.listRows): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, limit)
    .map((row) => str(row, max))
    .filter((row) => row.trim().length > 0);
}

/**
 * Inspiration rows. A row is kept when it has a link or a note, so a
 * half-filled row a user is still typing into is never thrown away.
 */
function inspirationList(value: unknown): Inspiration[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, LIMITS.listRows)
    .map((row) => {
      const raw = (typeof row === "object" && row !== null ? row : {}) as Record<string, unknown>;
      return { url: str(raw.url, LIMITS.url).trim(), note: str(raw.note, LIMITS.title) };
    })
    .filter((row) => row.url !== "" || row.note.trim() !== "");
}

/** Reads a stage, translating the older nine-stage pipeline onto the five. */
function status(value: unknown): Idea["status"] {
  if (isStatus(value)) return value;
  if (typeof value === "string" && value in LEGACY_STATUS) return LEGACY_STATUS[value];
  return "Idea";
}

/** Fills in every field so a hand-edited or older file still loads cleanly. */
function coerceIdea(value: unknown, fallbackId?: string): Idea | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id.trim().slice(0, 64)
      : (fallbackId ?? null);
  if (!id) return null;

  const stage = status(raw.status);
  const now = new Date().toISOString();
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : now;

  return {
    id,
    title: str(raw.title, LIMITS.title),
    // Ideas written before channels existed land on the first one.
    channel: isChannel(raw.channel) ? raw.channel : CHANNELS[0],
    platform: isPlatform(raw.platform) ? raw.platform : PLATFORMS[0],
    pillar: str(raw.pillar, LIMITS.pillar),
    rank: typeof raw.rank === "number" && Number.isFinite(raw.rank) ? raw.rank : UNRANKED,
    status: stage,
    titleOptions: textList(raw.titleOptions, LIMITS.title, LIMITS.titleOptions),
    thumbnailIdea: str(raw.thumbnailIdea, LIMITS.shortText),
    // `hook` was a single line before hooks became a list.
    hooks: Array.isArray(raw.hooks)
      ? textList(raw.hooks, LIMITS.shortText)
      : textList([raw.hook], LIMITS.shortText),
    script: str(raw.script, LIMITS.script),
    inspiration: inspirationList(raw.inspiration),
    shotIdeas: textList(raw.shotIdeas, LIMITS.shortText),
    caption: str(raw.caption, LIMITS.caption),
    targetDate: isoDate(raw.targetDate),
    owner: str(raw.owner, LIMITS.owner),
    notes: str(raw.notes, LIMITS.shortText),
    performanceNote: str(raw.performanceNote, LIMITS.shortText),
    archived: typeof raw.archived === "boolean" ? raw.archived : stage === DONE_STATUS,
    createdAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt,
    publishedAt: typeof raw.publishedAt === "string" ? raw.publishedAt : null,
  };
}

/** Applies only the fields a client is allowed to write. */
function applyPatch(idea: Idea, patch: IdeaPatch): Idea {
  const next = { ...idea };
  if ("title" in patch) next.title = str(patch.title, LIMITS.title);
  if ("channel" in patch && isChannel(patch.channel)) next.channel = patch.channel;
  if ("platform" in patch && isPlatform(patch.platform)) next.platform = patch.platform;
  if ("pillar" in patch) next.pillar = str(patch.pillar, LIMITS.pillar);
  if ("status" in patch && isStatus(patch.status)) next.status = patch.status;
  if ("titleOptions" in patch) {
    next.titleOptions = textList(patch.titleOptions, LIMITS.title, LIMITS.titleOptions);
  }
  if ("thumbnailIdea" in patch) next.thumbnailIdea = str(patch.thumbnailIdea, LIMITS.shortText);
  if ("hooks" in patch) next.hooks = textList(patch.hooks, LIMITS.shortText);
  if ("script" in patch) next.script = str(patch.script, LIMITS.script);
  if ("inspiration" in patch) next.inspiration = inspirationList(patch.inspiration);
  if ("shotIdeas" in patch) next.shotIdeas = textList(patch.shotIdeas, LIMITS.shortText);
  if ("caption" in patch) next.caption = str(patch.caption, LIMITS.caption);
  if ("targetDate" in patch) next.targetDate = isoDate(patch.targetDate);
  if ("owner" in patch) next.owner = str(patch.owner, LIMITS.owner);
  if ("notes" in patch) next.notes = str(patch.notes, LIMITS.shortText);
  if ("performanceNote" in patch) {
    next.performanceNote = str(patch.performanceNote, LIMITS.shortText);
  }
  return next;
}

// --- reading and writing ---------------------------------------------------

/**
 * Turns stored data into ideas.
 *
 * Throws rather than returning an empty list when the data is there but not
 * understood. Returning empty would look like "no ideas yet", and the next
 * save would then write that emptiness over everything — the one way this
 * app could lose all your scripts at once.
 */
function parse(data: unknown): StudioData {
  if (data === null || data === undefined) return { ideas: [], todos: [] };

  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { ideas?: unknown })?.ideas)
      ? (data as { ideas: unknown[] }).ideas
      : null;

  if (list === null) {
    throw new Error(
      "The ideas store holds data in a shape this app does not recognise. " +
        "Refusing to continue rather than risk overwriting it.",
    );
  }

  const rawTodos = (data as { todos?: unknown })?.todos;

  return {
    // An idea missing its id is given one instead of being dropped, so a
    // malformed row can never quietly disappear.
    ideas: normaliseRanks(
      list
        .map((row, index) => coerceIdea(row, `recovered-${index}-${Date.now()}`))
        .filter((idea): idea is Idea => idea !== null),
    ),
    todos: Array.isArray(rawTodos)
      ? rawTodos
          .map((row, index) => coerceTodo(row, `recovered-todo-${index}-${Date.now()}`))
          .filter((todo): todo is Todo => todo !== null)
      : [],
  };
}

function coerceTodo(value: unknown, fallbackId: string): Todo | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const now = new Date().toISOString();

  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim().slice(0, 64) : fallbackId,
    text: str(raw.text, LIMITS.shortText),
    done: raw.done === true,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    doneAt: typeof raw.doneAt === "string" ? raw.doneAt : null,
  };
}

async function load(): Promise<StudioData> {
  return parse((await storeBackend().read()).data);
}

/**
 * Read, transform, write — under the in-process lock so one server cannot
 * interleave its own writes, and retrying when a *different* one got there
 * first, which is how two devices can safely edit the same store.
 */
async function mutate<T>(
  fn: (data: StudioData) => { data: StudioData; result: T },
  options: { mayRemoveIdeas?: number; mayRemoveTodos?: number } = {},
): Promise<T> {
  return withLock(async () => {
    const backend = storeBackend();

    for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
      const snapshot = await backend.read();
      const before = parse(snapshot.data);
      const { data, result } = fn(before);

      // Nothing but an explicit delete is allowed to reduce a count. A bug
      // anywhere upstream therefore cannot quietly throw work away.
      guardCount("ideas", before.ideas.length, data.ideas.length, options.mayRemoveIdeas ?? 0);
      guardCount("to-dos", before.todos.length, data.todos.length, options.mayRemoveTodos ?? 0);

      const next: StudioData = { ideas: normaliseRanks(data.ideas), todos: data.todos };
      // Keep the version being replaced, so any bad state can be undone.
      await backend.snapshot(snapshot.data);
      const written = await backend.write({ version: 2, ...next }, snapshot.version);
      if (written) return result;
    }

    throw new Error("Could not save: the ideas store kept changing underneath this write.");
  });
}

function guardCount(what: string, before: number, after: number, allowed: number): void {
  if (after >= before - allowed) return;
  throw new Error(
    `Refusing to save: this would drop ${before - after} ${what} ` +
      `when at most ${allowed} should be removed.`,
  );
}

// --- public API ------------------------------------------------------------

export function listIdeas(): Promise<Idea[]> {
  return withLock(async () => (await load()).ideas);
}

/** Ideas and to-dos together, for the first paint and for export. */
export function readAll(): Promise<StudioData> {
  return withLock(load);
}

export function createIdea(input: IdeaPatch & { id?: string }): Promise<Idea> {
  return mutate(({ ideas, todos }) => {
    const now = new Date().toISOString();
    const requested = typeof input.id === "string" ? input.id.trim().slice(0, 64) : "";
    const id = requested && !ideas.some((idea) => idea.id === requested) ? requested : randomUUID();

    const base: Idea = {
      id,
      title: "",
      channel: CHANNELS[0],
      platform: PLATFORMS[0],
      pillar: "",
      // New ideas land at the bottom of the ranked list, ready to be dragged up.
      rank: UNRANKED - 1,
      status: "Idea",
      titleOptions: [],
      thumbnailIdea: "",
      hooks: [],
      script: "",
      inspiration: [],
      shotIdeas: [],
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
    return { data: { ideas: [...ideas, created], todos }, result: created };
  });
}

export function patchIdea(id: string, patch: IdeaPatch): Promise<Idea | null> {
  return mutate(({ ideas, todos }) => {
    const current = ideas.find((idea) => idea.id === id);
    if (!current) return { data: { ideas, todos }, result: null };

    const updated = syncArchiveState(
      { ...applyPatch(current, patch), updatedAt: new Date().toISOString() },
      current.archived,
    );

    return {
      data: { ideas: ideas.map((idea) => (idea.id === id ? updated : idea)), todos },
      result: updated,
    };
  });
}

export function deleteIdea(id: string): Promise<boolean> {
  return mutate(
    ({ ideas, todos }) => ({
      data: { ideas: ideas.filter((idea) => idea.id !== id), todos },
      result: ideas.some((idea) => idea.id === id),
    }),
    { mayRemoveIdeas: 1 },
  );
}

// --- to-dos ----------------------------------------------------------------

export function createTodo(input: { id?: string; text: string }): Promise<Todo> {
  return mutate(({ ideas, todos }) => {
    const requested = typeof input.id === "string" ? input.id.trim().slice(0, 64) : "";
    const id = requested && !todos.some((todo) => todo.id === requested) ? requested : randomUUID();

    const created: Todo = {
      id,
      text: str(input.text, LIMITS.shortText),
      done: false,
      createdAt: new Date().toISOString(),
      doneAt: null,
    };

    return { data: { ideas, todos: [...todos, created] }, result: created };
  });
}

export function patchTodo(id: string, patch: TodoPatch): Promise<Todo | null> {
  return mutate(({ ideas, todos }) => {
    const current = todos.find((todo) => todo.id === id);
    if (!current) return { data: { ideas, todos }, result: null };

    const done = "done" in patch ? patch.done === true : current.done;
    const updated: Todo = {
      ...current,
      text: "text" in patch ? str(patch.text, LIMITS.shortText) : current.text,
      done,
      // Ticking stamps the time; un-ticking clears it.
      doneAt: done ? (current.doneAt ?? new Date().toISOString()) : null,
    };

    return {
      data: { ideas, todos: todos.map((todo) => (todo.id === id ? updated : todo)) },
      result: updated,
    };
  });
}

export function deleteTodo(id: string): Promise<boolean> {
  return mutate(
    ({ ideas, todos }) => ({
      data: { ideas, todos: todos.filter((todo) => todo.id !== id) },
      result: todos.some((todo) => todo.id === id),
    }),
    { mayRemoveTodos: 1 },
  );
}

/** Clears every finished to-do at once. */
export function clearDoneTodos(): Promise<number> {
  return mutate(
    ({ ideas, todos }) => {
      const remaining = todos.filter((todo) => !todo.done);
      return {
        data: { ideas, todos: remaining },
        result: todos.length - remaining.length,
      };
    },
    { mayRemoveTodos: Number.MAX_SAFE_INTEGER },
  );
}

/**
 * Reorders the active list. `orderedIds` is the new make-next order; any active
 * idea the client did not list keeps its relative place after the ones it did.
 */
export function reorderIdeas(orderedIds: string[]): Promise<Idea[]> {
  return mutate(({ ideas, todos }) => {
    const reordered = applyOrder(ideas, orderedIds);
    return { data: { ideas: reordered, todos }, result: reordered };
  });
}

/** Previous versions of the whole store, newest first. */
export function listBackups(): Promise<Array<{ id: string; savedAt: string }>> {
  return withLock(() => storeBackend().history());
}

/** Puts a previous version back, keeping the current one as a backup first. */
export function restoreBackup(id: string): Promise<StudioData> {
  return withLock(async () => {
    const backend = storeBackend();
    const restored = parse(await backend.restore(id));
    const next: StudioData = { ideas: normaliseRanks(restored.ideas), todos: restored.todos };

    const current = await backend.read();
    await backend.snapshot(current.data);
    await backend.write({ version: 2, ...next }, current.version);
    return next;
  });
}

/**
 * Merges an exported file back in: ideas and to-dos already here are updated,
 * new ones are added, and nothing is ever removed. That makes importing safe
 * to do twice, and safe to use for moving a laptop's data up to the server.
 */
export function importData(incoming: unknown): Promise<{ ideas: number; todos: number }> {
  const parsed = parse(incoming);

  return mutate(({ ideas, todos }) => {
    const ideaById = new Map(ideas.map((idea) => [idea.id, idea]));
    let addedIdeas = 0;
    for (const idea of parsed.ideas) {
      if (!ideaById.has(idea.id)) addedIdeas += 1;
      // Incoming ranks are meaningless next to the current order, so the
      // merged idea goes to the bottom unless it is already here.
      ideaById.set(idea.id, { ...idea, rank: ideaById.get(idea.id)?.rank ?? UNRANKED - 1 });
    }

    const todoById = new Map(todos.map((todo) => [todo.id, todo]));
    let addedTodos = 0;
    for (const todo of parsed.todos) {
      if (!todoById.has(todo.id)) addedTodos += 1;
      todoById.set(todo.id, todo);
    }

    return {
      data: { ideas: [...ideaById.values()], todos: [...todoById.values()] },
      result: { ideas: addedIdeas, todos: addedTodos },
    };
  });
}
