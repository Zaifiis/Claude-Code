import type { NextRequest } from "next/server";

import { clearDoneTodos, createTodo, readAll } from "@/lib/studio/store";

export async function GET() {
  return Response.json({ todos: (await readAll()).todos });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const { id, text } = (body ?? {}) as { id?: unknown; text?: unknown };
  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Expected `text`." }, { status: 400 });
  }

  const todo = await createTodo({ id: typeof id === "string" ? id : undefined, text });
  return Response.json({ todo }, { status: 201 });
}

/** Clears everything already ticked off. */
export async function DELETE() {
  return Response.json({ cleared: await clearDoneTodos() });
}
