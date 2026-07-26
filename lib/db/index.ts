import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seedDatabase } from "./seed";

export type DB = Database.Database;

// Single connection reused across hot reloads in dev (Next re-evaluates modules).
const globalForDb = globalThis as unknown as { __contentOsDb?: DB };

export const LOCAL_USER_ID = "local-user";

function createDb(): DB {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, "content-os.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = fs.readFileSync(path.join(process.cwd(), "lib/db/schema.sql"), "utf8");
  db.exec(schema);

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
