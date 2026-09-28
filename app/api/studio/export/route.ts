import { readAll } from "@/lib/studio/store";

/**
 * Downloads everything as one JSON file, so a copy can live off this server.
 *
 * Normally this sits behind the same password as the rest of the studio. A
 * backup job cannot sign in, so setting `STUDIO_BACKUP_TOKEN` also allows
 * `?token=…`, which the proxy accepts for this one route.
 */
export async function GET() {
  const data = await readAll();
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(`${JSON.stringify({ version: 2, ...data }, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="content-studio-${stamp}.json"`,
    },
  });
}
