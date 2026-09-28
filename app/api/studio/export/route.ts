import { listIdeas } from "@/lib/studio/store";

/** Downloads everything as one JSON file, so a copy can live off this server. */
export async function GET() {
  const ideas = await listIdeas();
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(`${JSON.stringify({ version: 1, ideas }, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="content-studio-${stamp}.json"`,
    },
  });
}
