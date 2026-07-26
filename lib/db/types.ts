import type {
  PlatformKey,
  FormatKey,
  StatusKey,
  PriorityKey,
} from "@/lib/domain/constants";

export interface ContentItemRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  hook: string;
  script: string;
  cta: string;
  notes: string;
  angle: string;
  category: string;
  content_pillar: string;
  platform: PlatformKey;
  format: FormatKey;
  status: StatusKey;
  priority: PriorityKey;
  thumbnail_url: string | null;
  archived: number;
  repurposed_from: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferenceRow {
  id: string;
  user_id: string;
  url: string;
  platform: PlatformKey;
  title: string;
  thumbnail_url: string | null;
  embed_url: string | null;
  notes: string;
  archived: number;
  created_at: string;
}

export interface AttachmentRow {
  id: string;
  content_id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface MetricsRow {
  content_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  leads: number;
  updated_at: string;
}

/** A reference decorated with its tag names and how many items cite it. */
export interface ReferenceView extends ReferenceRow {
  tags: string[];
  usedCount: number;
}

/** A content item decorated with related tags/references/attachments/metrics. */
export interface ContentRecord extends ContentItemRow {
  tags: string[];
  references: ReferenceRow[];
  attachments: AttachmentRow[];
  metrics: MetricsRow | null;
  repurposedCount: number;
  repurposedFromTitle: string | null;
}

export type Metrics = Omit<MetricsRow, "content_id" | "updated_at">;
