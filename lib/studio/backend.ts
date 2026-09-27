/**
 * Where the ideas actually live.
 *
 * Locally that is a JSON file on disk. On Netlify the filesystem is read-only,
 * so it is a Netlify Blobs store instead — same data, same shape, chosen at
 * runtime. Nothing above this file knows which one is in use.
 *
 * Server only.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
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
    await mkdir(path.dirname(DATA_FILE), { recursive: true });
    const temp = `${DATA_FILE}.${process.pid}.tmp`;
    await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await rename(temp, DATA_FILE);
    return true;
  },
};

// --- Netlify Blobs ---------------------------------------------------------

const STORE_NAME = "content-studio";
const BLOB_KEY = "ideas";

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
};

// --- picking one -----------------------------------------------------------

/**
 * Netlify sets `NETLIFY=true` in its build and function runtimes. Setting
 * `STUDIO_STORAGE` to "file" or "blobs" overrides the guess.
 */
function blobsEnabled(): boolean {
  const choice = process.env.STUDIO_STORAGE?.trim().toLowerCase();
  if (choice === "blobs") return true;
  if (choice === "file") return false;
  return process.env.NETLIFY === "true";
}

export function storeBackend(): StoreBackend {
  return blobsEnabled() ? blobsBackend : fileBackend;
}

/** Where the data is being kept, for the setup notes and for diagnostics. */
export function storeDescription(): string {
  return blobsEnabled() ? `Netlify Blobs (store "${STORE_NAME}")` : DATA_FILE;
}
