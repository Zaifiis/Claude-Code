import type { NextRequest } from "next/server";

import { reorderIdeas } from "@/lib/studio/store";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const orderedIds = (body as { orderedIds?: unknown })?.orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string")) {
    return Response.json({ error: "Expected `orderedIds` to be an array of ids." }, { status: 400 });
  }

  return Response.json({ ideas: await reorderIdeas(orderedIds as string[]) });
}
