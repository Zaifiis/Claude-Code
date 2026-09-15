import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Load .env into process.env.
 *
 * Node does not do this on its own — `process.env` only ever holds what the
 * shell exported. Without this, every key in .env is invisible and the app
 * silently falls back to the offline mock, which looks exactly like a wrong
 * key. Import this before anything that reads configuration.
 *
 * Hand-rolled rather than pulling in dotenv: it is twenty lines, and one fewer
 * dependency in the path of every script.
 */

function parse(contents: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (!key) continue;

    let value = line.slice(eq + 1).trim();

    // Strip matching quotes — people paste keys with and without them.
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

/** Package root, so the file is found however the script was launched. */
function packageRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

let loaded = false;

export function loadEnv(): { path: string | null; keys: string[] } {
  if (loaded) return { path: null, keys: [] };
  loaded = true;

  const candidates = [join(process.cwd(), ".env"), join(packageRoot(), ".env")];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) return { path: null, keys: [] };

  const values = parse(readFileSync(path, "utf8"));
  const keys: string[] = [];

  for (const [key, value] of Object.entries(values)) {
    // A real exported environment variable wins over the file, so CI and
    // production overrides are not clobbered by a stale local .env.
    if (process.env[key] === undefined) {
      process.env[key] = value;
      keys.push(key);
    }
  }

  return { path, keys };
}

/**
 * Why the bot is running on the mock, in words a human can act on.
 * Returns null when a real provider key is present.
 */
export function explainMissingKeys(): string | null {
  const hasModelKey =
    process.env["ANTHROPIC_API_KEY"] ||
    process.env["ANTHROPIC_AUTH_TOKEN"] ||
    process.env["OPENAI_API_KEY"];

  if (hasModelKey) return null;

  const candidates = [join(process.cwd(), ".env"), join(packageRoot(), ".env")];
  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) {
    // The Notepad trap: "Save as" defaults to .txt, producing .env.txt, which
    // looks right in Explorer because it hides known extensions.
    const stray = candidates
      .map((candidate) => `${candidate}.txt`)
      .find((candidate) => existsSync(candidate));

    if (stray) {
      return (
        `Found ${stray} but no .env — Notepad appended .txt.\n` +
        `Rename it:  ren .env.txt .env`
      );
    }

    return (
      "No .env file found. Create one in the shopify-bot folder containing:\n" +
      "  OPENAI_API_KEY=sk-..."
    );
  }

  return (
    `${found} exists but has no model key in it.\n` +
    "It needs a line like:  OPENAI_API_KEY=sk-..."
  );
}
