/**
 * Where the ideas actually live.
 *
 * Locally that is a JSON file on disk. On Netlify the filesystem is read-only,
 * so it is a Netlify Blobs store instead — same data, same shape, chosen at
 * runtime. Nothing above this file knows which one is in use.
 *
 * Server only.
 */

import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/** The store's contents plus a token identifying the version that was read. */
export interface Snapshot {
  data: unknown;
  /** Opaque version marker, or null when the store is empty. */
  version: string | null;
}

export interface StoreBackend {
  read(): Promise<Snapshot>;
  /**
   * Writes `data`, but only if the store is still at `version`. Returns false
   * when something else wrote first, so the caller can re-read and re-apply.
   */
  write(data: unknown, version: string | null): Promise<boolean>;
  /**
   * Keeps a copy of the version about to be replaced. Best effort: a backup
   * that fails must never stop the save it was protecting.
   */
  snapshot(data: unknown): Promise<void>;
  /** Backups, newest first. */
  history(): Promise<Array<{ id: string; savedAt: string }>>;
  /** Reads one backup back. */
  restore(id: string): Promise<unknown>;
}

// --- a JSON file on disk ---------------------------------------------------

const DATA_FILE = process.env.STUDIO_DATA_FILE
  ? path.resolve(process.env.STUDIO_DATA_FILE)
  : path.join(process.cwd(), "data", "studio.json");

const fileBackend: StoreBackend = {
  async read() {
    let text: string;
    try {
      text = await readFile(DATA_FILE, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { data: null, version: null };
      throw error;
    }

    try {
      return { data: JSON.parse(text), version: null };
    } catch {
      // A corrupt file should not take the dashboard down: keep the bad copy
      // to one side and start clean rather than throwing on every request.
      await rename(DATA_FILE, `${DATA_FILE}.corrupt-${Date.now()}`).catch(() => {});
      return { data: null, version: null };
    }
  },

  // One local process holds the write lock, and the rename below is atomic,
  // so there is no version to check against.
  async write(data) {
    try {
      await mkdir(path.dirname(DATA_FILE), { recursive: true });
      const temp = `${DATA_FILE}.${process.pid}.tmp`;
      await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
      await rename(temp, DATA_FILE);
      return true;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
        // A serverless host, where saving to disk can never work. Say so
        // plainly: the alternative is a write that looks fine and is gone on
        // the next request.
        throw new Error(
          `Cannot save ideas to ${DATA_FILE}: the filesystem is read-only. ` +
            "On a host like Netlify the data belongs in Netlify Blobs — set " +
            "STUDIO_STORAGE=blobs as a runtime environment variable.",
          { cause: error },
        );
      }
      throw error;
    }
  },

  async snapshot(data) {
    if (data === null || data === undefined) return;
    try {
      const dir = path.join(path.dirname(DATA_FILE), "backups");
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, `studio-${stamp()}.json`),
        `${JSON.stringify(data, null, 2)}\n`,
        "utf8",
      );
      await pruneFileBackups(dir);
    } catch {
      // A backup that cannot be written must not block the save itself.
    }
  },

  async history() {
    try {
      const dir = path.join(path.dirname(DATA_FILE), "backups");
      const names = await readdir(dir);
      return names
        .filter((name) => name.startsWith("studio-") && name.endsWith(".json"))
        .sort()
        .reverse()
        .map((name) => ({ id: name, savedAt: savedAtFrom(name) }));
    } catch {
      return [];
    }
  },

  async restore(id) {
    const dir = path.join(path.dirname(DATA_FILE), "backups");
    const safe = path.basename(id);
    return JSON.parse(await readFile(path.join(dir, safe), "utf8"));
  },
};

/** A sortable, filename-safe timestamp. */
function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function savedAtFrom(name: string): string {
  const raw = name.replace(/^studio-/, "").replace(/\.json$/, "");
  const iso = raw.replace(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
    "$1-$2-$3T$4:$5:$6.$7Z",
  );
  return Number.isNaN(Date.parse(iso)) ? raw : iso;
}

async function pruneFileBackups(dir: string): Promise<void> {
  const names = (await readdir(dir))
    .filter((name) => name.startsWith("studio-") && name.endsWith(".json"))
    .sort()
    .reverse();
  await Promise.all(names.slice(KEEP_BACKUPS).map((name) => rm(path.join(dir, name)).catch(() => {})));
}

// --- Netlify Blobs ---------------------------------------------------------

const STORE_NAME = "content-studio";
const BLOB_KEY = "ideas";
const BACKUP_PREFIX = "backups/";
/** How many previous versions to keep. */
const KEEP_BACKUPS = 30;

type BlobStore = Awaited<ReturnType<typeof openBlobStore>>;
let blobStore: BlobStore | null = null;

/**
 * Strong consistency means an edit made on your phone is visible on your
 * laptop the moment it lands. Not every deploy environment can serve it, so
 * `withConsistencyFallback` below drops to eventual consistency if this
 * environment says no — safe here, because every write is conditional and a
 * stale read simply loses the race and retries.
 */
let strongConsistency = true;

async function openBlobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore(
    strongConsistency
      ? { name: STORE_NAME, consistency: "strong" }
      : { name: STORE_NAME },
  );
}

async function blobs(): Promise<BlobStore> {
  blobStore ??= await openBlobStore();
  return blobStore;
}

function isConsistencyError(error: unknown): boolean {
  return error instanceof Error && error.name === "BlobsConsistencyError";
}

async function withConsistencyFallback<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!strongConsistency || !isConsistencyError(error)) throw error;
    strongConsistency = false;
    blobStore = null;
    return run();
  }
}

const blobsBackend: StoreBackend = {
  async read() {
    const entry = await withConsistencyFallback(async () =>
      (await blobs()).getWithMetadata(BLOB_KEY, { type: "json" }),
    );
    return entry ? { data: entry.data, version: entry.etag ?? null } : { data: null, version: null };
  },

  /**
   * A conditional write, so two devices editing at once cannot silently
   * overwrite one another — the loser is told to re-read and try again.
   */
  async write(data, version) {
    const result = await withConsistencyFallback(async () => {
      const store = await blobs();
      return version === null
        ? store.setJSON(BLOB_KEY, data, { onlyIfNew: true })
        : store.setJSON(BLOB_KEY, data, { onlyIfMatch: version });
    });
    return result.modified;
  },

  async snapshot(data) {
    if (data === null || data === undefined) return;
    try {
      const store = await blobs();
      await store.setJSON(`${BACKUP_PREFIX}${stamp()}`, data);

      const { blobs: kept } = await store.list({ prefix: BACKUP_PREFIX });
      const stale = kept
        .map((entry) => entry.key)
        .sort()
        .reverse()
        .slice(KEEP_BACKUPS);
      await Promise.all(stale.map((key) => store.delete(key).catch(() => {})));
    } catch {
      // A backup that cannot be written must not block the save itself.
    }
  },

  async history() {
    try {
      const { blobs: kept } = await (await blobs()).list({ prefix: BACKUP_PREFIX });
      return kept
        .map((entry) => entry.key)
        .sort()
        .reverse()
        .map((key) => ({ id: key, savedAt: savedAtFrom(`studio-${key.slice(BACKUP_PREFIX.length)}.json`) }));
    } catch {
      return [];
    }
  },

  async restore(id) {
    if (!id.startsWith(BACKUP_PREFIX)) throw new Error("Not a backup key.");
    return (await blobs()).get(id, { type: "json" });
  },
};

// --- picking one -----------------------------------------------------------

/**
 * Whether to keep the data in Netlify Blobs.
 *
 * `NETLIFY_BLOBS_CONTEXT` is what the Blobs client itself reads for its
 * credentials, so its presence is the one signal that actually means "Blobs
 * will work here". It is checked first because variables declared in
 * `netlify.toml` never reach the function runtime — only the build — so
 * neither `STUDIO_STORAGE` nor `NETLIFY` can be relied on from there.
 *
 * Setting `STUDIO_STORAGE` to "file" or "blobs" as a real environment variable
 * still overrides the detection.
 */
function blobsEnabled(): boolean {
  const choice = process.env.STUDIO_STORAGE?.trim().toLowerCase();
  if (choice === "blobs") return true;
  if (choice === "file") return false;

  return Boolean(process.env.NETLIFY_BLOBS_CONTEXT) || process.env.NETLIFY === "true";
}

export function storeBackend(): StoreBackend {
  return blobsEnabled() ? blobsBackend : fileBackend;
}

/** Where the data is being kept, for the setup notes and for diagnostics. */
export function storeDescription(): string {
  return blobsEnabled() ? `Netlify Blobs (store "${STORE_NAME}")` : `file: ${DATA_FILE}`;
}
