"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContentStatus } from "@/types/db";

export async function updateContentItem(
  id: string,
  fields: { post_text?: string; title?: string; status?: ContentStatus }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("content_items").update(fields).eq("id", id);
  if (error) throw error;
  revalidatePath("/queue");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function approveItem(id: string, post_text: string, title: string) {
  await updateContentItem(id, { post_text, title, status: "Ready" });
}

export async function rejectItem(id: string) {
  await updateContentItem(id, { status: "Rejected" });
}

export async function revertToPending(id: string) {
  await updateContentItem(id, { status: "Pending" });
}
