import type { NextRequest } from "next/server";

import { listBackups, restoreBackup } from "@/lib/studio/store";

/** The versions kept before each save, newest first. */
export async function GET() {
  return Response.json({ backups: await listBackups() });
}

/** Puts one back. The version being replaced is itself backed up first. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const id = (body as { id?: unknown })?.id;
  if (typeof id !== "string" || !id) {
    return Response.json({ error: "Expected an `id`." }, { status: 400 });
  }

  try {
    return Response.json({ ideas: await restoreBackup(id) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
