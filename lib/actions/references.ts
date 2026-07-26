"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as q from "@/lib/db/queries";

function revalidateAll() {
  revalidatePath("/", "layout");
}

const createSchema = z.object({
  url: z.string().min(1, "Paste a URL or link"),
  title: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
});

export async function createReferenceAction(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const id = q.createReference(parsed.data);
  revalidateAll();
  return { ok: true, id };
}

export async function updateReferenceAction(
  id: string,
  patch: { title?: string; notes?: string; url?: string },
): Promise<{ ok: true }> {
  q.updateReference(id, patch);
  revalidateAll();
  return { ok: true };
}

export async function setReferenceTagsAction(id: string, names: string[]): Promise<{ ok: true }> {
  q.setReferenceTags(id, names);
  revalidateAll();
  return { ok: true };
}

export async function archiveReferenceAction(id: string, archived: boolean): Promise<{ ok: true }> {
  q.setReferenceArchived(id, archived);
  revalidateAll();
  return { ok: true };
}

export async function deleteReferenceAction(id: string): Promise<{ ok: true }> {
  q.deleteReference(id);
  revalidateAll();
  return { ok: true };
}

export async function convertReferenceAction(
  id: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const newId = q.convertReferenceToContent(id);
  if (!newId) return { ok: false, error: "Reference not found" };
  revalidateAll();
  return { ok: true, id: newId };
}
