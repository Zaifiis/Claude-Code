export type ContentStatus = "Pending" | "Ready" | "Posted" | "Rejected";

export interface Platform {
  id: string;
  slug: string;
  display_name: string;
  enabled: boolean;
  created_at: string;
}

export interface PlatformSettings {
  platform_id: string;
  brand_voice_prompt: string;
  posting_cadence_cron: string;
  publish_cadence_cron: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  platform_id: string;
  name: string | null;
  industry: string | null;
  problem: string | null;
  automation_solution: string | null;
  tools_stack: string | null;
  business_result: string | null;
  title: string | null;
  post_text: string | null;
  image_url: string | null;
  headline: string | null;
  visual_metaphor: string | null;
  hero_object: string | null;
  composition: string | null;
  text_position: string | null;
  status: ContentStatus;
  scheduled_for: string | null;
  posted_at: string | null;
  created_at: string;
}
