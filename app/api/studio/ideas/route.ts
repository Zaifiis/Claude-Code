import type { NextRequest } from "next/server";

import { createIdea, listIdeas } from "@/lib/studio/store";
import type { IdeaPatch } from "@/types/studio";

export async function GET() {
  return Response.json({ ideas: await listIdeas() });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Expected a JSON object." }, { status: 400 });
  }

  // The store validates and coerces every field, so the raw body is safe to pass.
  const idea = await createIdea(body as IdeaPatch & { id?: string });
  return Response.json({ idea }, { status: 201 });
}
