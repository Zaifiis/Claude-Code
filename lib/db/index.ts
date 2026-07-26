import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seedDatabase } from "./seed";
import { SCHEMA_SQL } from "./schema";

export type DB = Database.Database;

// Single connection reused across hot reloads in dev (Next re-evaluates modules).
const globalForDb = globalThis as unknown as { __contentOsDb?: DB };

export const LOCAL_USER_ID = "local-user";

/**
 * Resolve the directory the SQLite file lives in. Configurable via DATA_DIR so
 * deployments (e.g. Hostinger VPS / Node.js app) can point it at a persistent,
 * writable location outside the app folder that survives redeploys.
 */
function resolveDataDir(): string {
  const configured = process.env.DATA_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), "data");
}

function createDb(): DB {
  const dataDir = resolveDataDir();
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, "content-os.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(SCHEMA_SQL);

  // Seed on first run (empty user table).
  const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number };
  if (userCount.c === 0) {
    seedDatabase(db);
  }

  return db;
}

export function getDb(): DB {
  if (!globalForDb.__contentOsDb) {
    globalForDb.__contentOsDb = createDb();
  }
  return globalForDb.__contentOsDb;
}
