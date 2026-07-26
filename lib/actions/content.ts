"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as q from "@/lib/db/queries";
import type {
  PlatformKey,
  FormatKey,
  StatusKey,
  PriorityKey,
} from "@/lib/domain/constants";
import type { Metrics } from "@/lib/db/types";

/** Revalidate every route under the app shell (single-user local tool). */
function revalidateAll() {
  revalidatePath("/", "layout");
}

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  hook: z.string().max(2000).optional(),
  description: z.string().max(2000).optional(),
  platform: z.string().optional(),
  format: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().max(5000).optional(),
});

export async function createContentAction(input: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const id = q.createContent({
    title: d.title,
    hook: d.hook,
    description: d.description,
    platform: d.platform as PlatformKey | undefined,
    format: d.format as FormatKey | undefined,
    status: d.status as StatusKey | undefined,
    priority: d.priority as PriorityKey | undefined,
    notes: d.notes,
  });
  revalidateAll();
  return { ok: true, id };
}

export async function updateContentAction(id: string, patch: q.ContentPatch): Promise<{ ok: true }> {
  q.updateContent(id, patch);
  revalidateAll();
  return { ok: true };
}

export async function setStatusAction(id: string, status: StatusKey): Promise<{ ok: true }> {
  q.setStatus(id, status);
  revalidateAll();
  return { ok: true };
}

export async function setScheduleAction(id: string, iso: string | null): Promise<{ ok: true }> {
  q.setSchedule(id, iso);
  revalidateAll();
  return { ok: true };
}

export async function setPublishedAction(id: string, iso: string | null): Promise<{ ok: true }> {
  q.setPublishedAt(id, iso);
  revalidateAll();
  return { ok: true };
}

export async function archiveContentAction(id: string, archived: boolean): Promise<{ ok: true }> {
  q.setArchived(id, archived);
  revalidateAll();
  return { ok: true };
}

export async function deleteContentAction(id: string): Promise<{ ok: true }> {
  q.deleteContent(id);
  revalidateAll();
  return { ok: true };
}

export async function duplicateContentAction(id: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const newId = q.duplicateContent(id);
  if (!newId) return { ok: false, error: "Content not found" };
  revalidateAll();
  return { ok: true, id: newId };
}

export async function repurposeContentAction(
  id: string,
  platform: PlatformKey,
  format: FormatKey,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const newId = q.repurposeContent(id, { platform, format });
  if (!newId) return { ok: false, error: "Content not found" };
  revalidateAll();
  return { ok: true, id: newId };
}

export async function setContentTagsAction(id: string, names: string[]): Promise<{ ok: true }> {
  q.setContentTags(id, names);
  revalidateAll();
  return { ok: true };
}

export async function setContentReferencesAction(id: string, refIds: string[]): Promise<{ ok: true }> {
  q.setContentReferences(id, refIds);
  revalidateAll();
  return { ok: true };
}

export async function addReferenceToContentAction(
  contentId: string,
  url: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!url.trim()) return { ok: false, error: "URL is required" };
  const refId = q.createReference({ url });
  q.linkReference(contentId, refId);
  revalidateAll();
  return { ok: true, id: refId };
}

export async function unlinkReferenceAction(contentId: string, refIds: string[]): Promise<{ ok: true }> {
  q.setContentReferences(contentId, refIds);
  revalidateAll();
  return { ok: true };
}

export async function addAttachmentAction(
  contentId: string,
  name: string,
  url: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!url.trim()) return { ok: false, error: "URL is required" };
  q.addAttachment(contentId, name, url);
  revalidateAll();
  return { ok: true };
}

export async function deleteAttachmentAction(attachmentId: string): Promise<{ ok: true }> {
  q.deleteAttachment(attachmentId);
  revalidateAll();
  return { ok: true };
}

const metricsSchema = z.object({
  views: z.coerce.number().int().min(0),
  likes: z.coerce.number().int().min(0),
  comments: z.coerce.number().int().min(0),
  shares: z.coerce.number().int().min(0),
  saves: z.coerce.number().int().min(0),
  leads: z.coerce.number().int().min(0),
});

export async function upsertMetricsAction(
  contentId: string,
  metrics: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = metricsSchema.safeParse(metrics);
  if (!parsed.success) return { ok: false, error: "Metrics must be non-negative numbers" };
  q.upsertMetrics(contentId, parsed.data as Metrics);
  revalidateAll();
  return { ok: true };
}
