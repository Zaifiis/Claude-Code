"use server";

import * as q from "@/lib/db/queries";
import type { SearchResults } from "@/lib/db/queries";
import type { PlatformKey, StatusKey } from "@/lib/domain/constants";

export async function searchAction(query: string): Promise<SearchResults> {
  return q.search(query);
}

export interface SchedulableItem {
  id: string;
  title: string;
  platform: PlatformKey;
  status: StatusKey;
  scheduled_at: string | null;
}

/** Content items that make sense to schedule (not yet posted). */
export async function schedulableContentAction(): Promise<SchedulableItem[]> {
  return q
    .listContent({ archived: false })
    .filter((c) => c.status !== "posted")
    .map((c) => ({
      id: c.id,
      title: c.title,
      platform: c.platform,
      status: c.status,
      scheduled_at: c.scheduled_at,
    }));
}
