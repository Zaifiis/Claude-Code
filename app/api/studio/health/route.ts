import { storeDescription } from "@/lib/studio/backend";
import { listIdeas } from "@/lib/studio/store";

/**
 * Says where the ideas are being kept and whether that store can actually be
 * read. Useful when a deploy saves nothing: it turns "it disappeared" into a
 * specific answer. It reports no idea content, only a count.
 */
export async function GET() {
  const storage = storeDescription();

  try {
    const ideas = await listIdeas();
    return Response.json({ ok: true, storage, ideas: ideas.length });
  } catch (error) {
    return Response.json(
      { ok: false, storage, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
