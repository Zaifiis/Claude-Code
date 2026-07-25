import { createClient } from "@/lib/supabase/server";
import type { ContentItem, Platform, PlatformSettings } from "@/types/db";

export async function getPlatforms(): Promise<Platform[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platforms")
    .select("*")
    .order("display_name");
  if (error) throw error;
  return data ?? [];
}

export async function getPlatformSettings(): Promise<PlatformSettings[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("platform_settings").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function getContentItems(filter?: {
  status?: ContentItem["status"][];
}): Promise<ContentItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("content_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter?.status?.length) {
    query = query.in("status", filter.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
