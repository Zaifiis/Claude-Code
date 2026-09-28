import type { NextRequest } from "next/server";

import { deleteTodo, patchTodo } from "@/lib/studio/store";
import type { TodoPatch } from "@/types/studio";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/studio/todos/[id]">) {
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

  const todo = await patchTodo(id, body as TodoPatch);
  if (!todo) return Response.json({ error: "No such to-do." }, { status: 404 });

  return Response.json({ todo });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/studio/todos/[id]">) {
  const { id } = await ctx.params;
  if (!(await deleteTodo(id))) return Response.json({ error: "No such to-do." }, { status: 404 });

  return new Response(null, { status: 204 });
}
