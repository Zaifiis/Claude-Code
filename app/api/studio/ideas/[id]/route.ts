import type { NextRequest } from "next/server";

import { deleteIdea, patchIdea } from "@/lib/studio/store";
import type { IdeaPatch } from "@/types/studio";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/studio/ideas/[id]">) {
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Expected a JSON object." }, { status: 400 });
  }

  const idea = await patchIdea(id, body as IdeaPatch);
  if (!idea) return Response.json({ error: "No such idea." }, { status: 404 });

  return Response.json({ idea });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/studio/ideas/[id]">) {
  const { id } = await ctx.params;
  const deleted = await deleteIdea(id);
  if (!deleted) return Response.json({ error: "No such idea." }, { status: 404 });

  return new Response(null, { status: 204 });
}
