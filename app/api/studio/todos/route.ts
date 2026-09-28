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

  const { id, text, priority } = (body ?? {}) as {
    id?: unknown;
    text?: unknown;
    priority?: unknown;
  };
  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Expected `text`." }, { status: 400 });
  }

  // An unrecognised priority falls back to the default rather than failing
  // the write: losing the to-do would be the worse outcome.
  const todo = await createTodo({ id: typeof id === "string" ? id : undefined, text, priority });
  return Response.json({ todo }, { status: 201 });
}

/** Clears everything already ticked off. */
export async function DELETE() {
  return Response.json({ cleared: await clearDoneTodos() });
}
