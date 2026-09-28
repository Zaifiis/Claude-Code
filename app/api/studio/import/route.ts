import type { NextRequest } from "next/server";

import { importData } from "@/lib/studio/store";

/**
 * Merges an exported file back in. Nothing is ever removed, so importing the
 * same file twice is harmless and a partial file cannot delete anything.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "That file is not valid JSON." }, { status: 400 });
  }

  try {
    const added = await importData(body);
    return Response.json({ added });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
