"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function togglePlatform(id: string, enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("platforms").update({ enabled }).eq("id", id);
  if (error) throw error;
  revalidatePath("/platforms");
  revalidatePath("/");
}

export async function savePlatformSettings(
  platformId: string,
  fields: { brand_voice_prompt: string; posting_cadence_cron: string; publish_cadence_cron: string }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .upsert({ platform_id: platformId, ...fields, updated_at: new Date().toISOString() });
  if (error) throw error;
  revalidatePath("/platforms");
}
