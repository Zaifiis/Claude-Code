import "server-only";
import { randomUUID } from "node:crypto";
import { getDb, LOCAL_USER_ID, type DB } from "./index";
import type {
  ContentItemRow,
  ContentRecord,
  ReferenceRow,
  ReferenceView,
  AttachmentRow,
  MetricsRow,
  Metrics,
} from "./types";
import type {
  PlatformKey,
  FormatKey,
  StatusKey,
  PriorityKey,
} from "@/lib/domain/constants";
import { parseReference, titleFromUrl } from "@/lib/domain/references";

const now = () => new Date().toISOString();
const id = () => randomUUID();

/* --------------------------------- tags --------------------------------- */

export function listTags(): string[] {
  const db = getDb();
  return (db.prepare("SELECT name FROM tags ORDER BY name").all() as { name: string }[]).map(
    (r) => r.name,
  );
}

function ensureTagIds(db: DB, names: string[]): string[] {
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const insert = db.prepare("INSERT OR IGNORE INTO tags (id, name, created_at) VALUES (?, ?, ?)");
  const select = db.prepare("SELECT id FROM tags WHERE name = ?");
  const ids: string[] = [];
  for (const name of clean) {
    insert.run(id(), name, now());
    const row = select.get(name) as { id: string } | undefined;
    if (row) ids.push(row.id);
  }
  return ids;
}

/* ------------------------------ hydration ------------------------------- */

function contentTags(db: DB, contentId: string): string[] {
  return (
    db
      .prepare(
        `SELECT t.name FROM content_tags ct JOIN tags t ON t.id = ct.tag_id
         WHERE ct.content_id = ? ORDER BY t.name`,
      )
      .all(contentId) as { name: string }[]
  ).map((r) => r.name);
}

function contentReferences(db: DB, contentId: string): ReferenceRow[] {
  return db
    .prepare(
      `SELECT r.* FROM content_references cr JOIN refs r ON r.id = cr.reference_id
       WHERE cr.content_id = ? ORDER BY r.created_at DESC`,
    )
    .all(contentId) as ReferenceRow[];
}

function contentAttachments(db: DB, contentId: string): AttachmentRow[] {
  return db
    .prepare("SELECT * FROM attachments WHERE content_id = ? ORDER BY created_at")
    .all(contentId) as AttachmentRow[];
}

function hydrate(db: DB, row: ContentItemRow): ContentRecord {
  const metrics =
    (db.prepare("SELECT * FROM performance_metrics WHERE content_id = ?").get(row.id) as
      | MetricsRow
      | undefined) ?? null;
  const repurposedCount = (
    db.prepare("SELECT COUNT(*) AS c FROM content_items WHERE repurposed_from = ?").get(row.id) as {
      c: number;
    }
  ).c;
  const repurposedFromTitle = row.repurposed_from
    ? ((
        db.prepare("SELECT title FROM content_items WHERE id = ?").get(row.repurposed_from) as
          | { title: string }
          | undefined
      )?.title ?? null)
    : null;
  return {
    ...row,
    tags: contentTags(db, row.id),
    references: contentReferences(db, row.id),
    attachments: contentAttachments(db, row.id),
    metrics,
    repurposedCount,
    repurposedFromTitle,
  };
}

/* ------------------------------- content -------------------------------- */

export interface ContentFilter {
  archived?: boolean;
  statuses?: StatusKey[];
  platforms?: PlatformKey[];
  formats?: FormatKey[];
  priorities?: PriorityKey[];
  search?: string;
}

export function listContent(filter: ContentFilter = {}): ContentRecord[] {
  const db = getDb();
  const where: string[] = ["user_id = ?"];
  const params: unknown[] = [LOCAL_USER_ID];

  where.push("archived = ?");
  params.push(filter.archived ? 1 : 0);

  const inClause = (col: string, vals?: string[]) => {
    if (vals && vals.length) {
      where.push(`${col} IN (${vals.map(() => "?").join(",")})`);
      params.push(...vals);
    }
  };
  inClause("status", filter.statuses);
  inClause("platform", filter.platforms);
  inClause("format", filter.formats);
  inClause("priority", filter.priorities);

  const rows = db
    .prepare(`SELECT * FROM content_items WHERE ${where.join(" AND ")} ORDER BY updated_at DESC`)
    .all(...params) as ContentItemRow[];

  let records = rows.map((r) => hydrate(db, r));

  if (filter.search?.trim()) {
    const q = filter.search.trim().toLowerCase();
    records = records.filter((r) =>
      [r.title, r.hook, r.script, r.notes, r.description, r.cta, ...r.tags]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  return records;
}

export function getContent(contentId: string): ContentRecord | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM content_items WHERE id = ?").get(contentId) as
    | ContentItemRow
    | undefined;
  return row ? hydrate(db, row) : null;
}

export interface CreateContentInput {
  title: string;
  hook?: string;
  description?: string;
  platform?: PlatformKey;
  format?: FormatKey;
  status?: StatusKey;
  priority?: PriorityKey;
  script?: string;
  notes?: string;
}

export function createContent(input: CreateContentInput): string {
  const db = getDb();
  const cid = id();
  const ts = now();
  db.prepare(
    `INSERT INTO content_items
      (id, user_id, title, description, hook, script, notes, platform, format, status, priority, created_at, updated_at)
     VALUES (@id, @user_id, @title, @description, @hook, @script, @notes, @platform, @format, @status, @priority, @created_at, @updated_at)`,
  ).run({
    id: cid,
    user_id: LOCAL_USER_ID,
    title: input.title.trim() || "Untitled",
    description: input.description ?? "",
    hook: input.hook ?? "",
    script: input.script ?? "",
    notes: input.notes ?? "",
    platform: input.platform ?? "other",
    format: input.format ?? "other",
    status: input.status ?? "idea",
    priority: input.priority ?? "medium",
    created_at: ts,
    updated_at: ts,
  });
  return cid;
}

const EDITABLE_FIELDS = [
  "title",
  "description",
  "hook",
  "script",
  "cta",
  "notes",
  "angle",
  "category",
  "content_pillar",
  "platform",
  "format",
  "priority",
  "thumbnail_url",
] as const;

export type ContentPatch = Partial<Record<(typeof EDITABLE_FIELDS)[number], string | null>>;

export function updateContent(contentId: string, patch: ContentPatch): void {
  const db = getDb();
  const sets: string[] = [];
  const params: Record<string, unknown> = { id: contentId, updated_at: now() };
  for (const field of EDITABLE_FIELDS) {
    if (field in patch) {
      sets.push(`${field} = @${field}`);
      params[field] = patch[field];
    }
  }
  if (!sets.length) return;
  sets.push("updated_at = @updated_at");
  db.prepare(`UPDATE content_items SET ${sets.join(", ")} WHERE id = @id`).run(params);
}

/**
 * Change status. Automatically maintains scheduled_at / published_at so the
 * calendar and library stay consistent with the pipeline.
 */
export function setStatus(contentId: string, status: StatusKey): void {
  const db = getDb();
  const row = db.prepare("SELECT * FROM content_items WHERE id = ?").get(contentId) as
    | ContentItemRow
    | undefined;
  if (!row) return;
  const params: Record<string, unknown> = {
    id: contentId,
    status,
    updated_at: now(),
    published_at: row.published_at,
    scheduled_at: row.scheduled_at,
  };
  if (status === "posted" && !row.published_at) {
    params.published_at = now();
  }
  if (status === "scheduled" && !row.scheduled_at) {
    // default to tomorrow 9am if scheduled with no date yet
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    params.scheduled_at = d.toISOString();
  }
  db.prepare(
    "UPDATE content_items SET status = @status, published_at = @published_at, scheduled_at = @scheduled_at, updated_at = @updated_at WHERE id = @id",
  ).run(params);
}

export function setSchedule(contentId: string, scheduledAt: string | null): void {
  const db = getDb();
  const row = db.prepare("SELECT status FROM content_items WHERE id = ?").get(contentId) as
    | { status: StatusKey }
    | undefined;
  if (!row) return;
  const bumpStatus =
    scheduledAt && (row.status === "idea" || row.status === "inbox" || row.status === "ready_to_post");
  db.prepare(
    `UPDATE content_items SET scheduled_at = ?, status = ?, updated_at = ? WHERE id = ?`,
  ).run(scheduledAt, bumpStatus ? "scheduled" : row.status, now(), contentId);
}

export function setPublishedAt(contentId: string, publishedAt: string | null): void {
  getDb()
    .prepare("UPDATE content_items SET published_at = ?, updated_at = ? WHERE id = ?")
    .run(publishedAt, now(), contentId);
}

export function setArchived(contentId: string, archived: boolean): void {
  getDb()
    .prepare("UPDATE content_items SET archived = ?, updated_at = ? WHERE id = ?")
    .run(archived ? 1 : 0, now(), contentId);
}

export function deleteContent(contentId: string): void {
  getDb().prepare("DELETE FROM content_items WHERE id = ?").run(contentId);
}

export function setContentTags(contentId: string, names: string[]): void {
  const db = getDb();
  const tagIds = ensureTagIds(db, names);
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM content_tags WHERE content_id = ?").run(contentId);
    const ins = db.prepare("INSERT OR IGNORE INTO content_tags (content_id, tag_id) VALUES (?, ?)");
    for (const tid of tagIds) ins.run(contentId, tid);
    db.prepare("UPDATE content_items SET updated_at = ? WHERE id = ?").run(now(), contentId);
  });
  tx();
}

export function setContentReferences(contentId: string, referenceIds: string[]): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM content_references WHERE content_id = ?").run(contentId);
    const ins = db.prepare(
      "INSERT OR IGNORE INTO content_references (content_id, reference_id) VALUES (?, ?)",
    );
    for (const rid of referenceIds) ins.run(contentId, rid);
    db.prepare("UPDATE content_items SET updated_at = ? WHERE id = ?").run(now(), contentId);
  });
  tx();
}

export function linkReference(contentId: string, referenceId: string): void {
  getDb()
    .prepare("INSERT OR IGNORE INTO content_references (content_id, reference_id) VALUES (?, ?)")
    .run(contentId, referenceId);
}

/* --------------------------- duplicate / repurpose ---------------------- */

function cloneRelations(db: DB, fromId: string, toId: string) {
  const tags = db
    .prepare("SELECT tag_id FROM content_tags WHERE content_id = ?")
    .all(fromId) as { tag_id: string }[];
  const insTag = db.prepare("INSERT OR IGNORE INTO content_tags (content_id, tag_id) VALUES (?, ?)");
  for (const t of tags) insTag.run(toId, t.tag_id);

  const refs = db
    .prepare("SELECT reference_id FROM content_references WHERE content_id = ?")
    .all(fromId) as { reference_id: string }[];
  const insRef = db.prepare(
    "INSERT OR IGNORE INTO content_references (content_id, reference_id) VALUES (?, ?)",
  );
  for (const r of refs) insRef.run(toId, r.reference_id);
}

export function duplicateContent(contentId: string): string | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM content_items WHERE id = ?").get(contentId) as
    | ContentItemRow
    | undefined;
  if (!row) return null;
  const newId = id();
  const ts = now();
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO content_items
        (id, user_id, title, description, hook, script, cta, notes, angle, category, content_pillar,
         platform, format, status, priority, thumbnail_url, archived, repurposed_from, scheduled_at, published_at, created_at, updated_at)
       VALUES
        (@id, @user_id, @title, @description, @hook, @script, @cta, @notes, @angle, @category, @content_pillar,
         @platform, @format, @status, @priority, @thumbnail_url, 0, NULL, NULL, NULL, @created_at, @updated_at)`,
    ).run({
      ...row,
      id: newId,
      title: `${row.title} (copy)`,
      status: "idea",
      created_at: ts,
      updated_at: ts,
    });
    cloneRelations(db, contentId, newId);
  });
  tx();
  return newId;
}

export function repurposeContent(
  contentId: string,
  opts: { platform: PlatformKey; format: FormatKey },
): string | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM content_items WHERE id = ?").get(contentId) as
    | ContentItemRow
    | undefined;
  if (!row) return null;
  const newId = id();
  const ts = now();
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO content_items
        (id, user_id, title, description, hook, script, cta, notes, angle, category, content_pillar,
         platform, format, status, priority, thumbnail_url, archived, repurposed_from, scheduled_at, published_at, created_at, updated_at)
       VALUES
        (@id, @user_id, @title, @description, @hook, @script, @cta, @notes, @angle, @category, @content_pillar,
         @platform, @format, 'idea', @priority, @thumbnail_url, 0, @repurposed_from, NULL, NULL, @created_at, @updated_at)`,
    ).run({
      ...row,
      id: newId,
      title: row.title,
      platform: opts.platform,
      format: opts.format,
      priority: row.priority,
      repurposed_from: contentId,
      created_at: ts,
      updated_at: ts,
    });
    cloneRelations(db, contentId, newId);
  });
  tx();
  return newId;
}

/* ----------------------------- attachments ------------------------------ */

export function addAttachment(contentId: string, name: string, url: string): void {
  getDb()
    .prepare("INSERT INTO attachments (id, content_id, name, url, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id(), contentId, name.trim() || url, url, now());
}

export function deleteAttachment(attachmentId: string): void {
  getDb().prepare("DELETE FROM attachments WHERE id = ?").run(attachmentId);
}

/* ------------------------------- metrics -------------------------------- */

export function upsertMetrics(contentId: string, metrics: Metrics): void {
  getDb()
    .prepare(
      `INSERT INTO performance_metrics (content_id, views, likes, comments, shares, saves, leads, updated_at)
       VALUES (@content_id, @views, @likes, @comments, @shares, @saves, @leads, @updated_at)
       ON CONFLICT(content_id) DO UPDATE SET
         views=@views, likes=@likes, comments=@comments, shares=@shares, saves=@saves, leads=@leads, updated_at=@updated_at`,
    )
    .run({ content_id: contentId, ...metrics, updated_at: now() });
}

/* ------------------------------ references ------------------------------ */

function refTags(db: DB, refId: string): string[] {
  return (
    db
      .prepare(
        `SELECT t.name FROM reference_tags rt JOIN tags t ON t.id = rt.tag_id
         WHERE rt.reference_id = ? ORDER BY t.name`,
      )
      .all(refId) as { name: string }[]
  ).map((r) => r.name);
}

function hydrateRef(db: DB, row: ReferenceRow): ReferenceView {
  const usedCount = (
    db.prepare("SELECT COUNT(*) AS c FROM content_references WHERE reference_id = ?").get(row.id) as {
      c: number;
    }
  ).c;
  return { ...row, tags: refTags(db, row.id), usedCount };
}

export interface ReferenceFilter {
  archived?: boolean;
  platforms?: PlatformKey[];
  used?: "used" | "unused";
  search?: string;
}

export function listReferences(filter: ReferenceFilter = {}): ReferenceView[] {
  const db = getDb();
  const where: string[] = ["user_id = ?", "archived = ?"];
  const params: unknown[] = [LOCAL_USER_ID, filter.archived ? 1 : 0];
  if (filter.platforms?.length) {
    where.push(`platform IN (${filter.platforms.map(() => "?").join(",")})`);
    params.push(...filter.platforms);
  }
  const rows = db
    .prepare(`SELECT * FROM refs WHERE ${where.join(" AND ")} ORDER BY created_at DESC`)
    .all(...params) as ReferenceRow[];
  let views = rows.map((r) => hydrateRef(db, r));
  if (filter.used === "used") views = views.filter((v) => v.usedCount > 0);
  if (filter.used === "unused") views = views.filter((v) => v.usedCount === 0);
  if (filter.search?.trim()) {
    const q = filter.search.trim().toLowerCase();
    views = views.filter((v) =>
      [v.title, v.url, v.notes, ...v.tags].join(" ").toLowerCase().includes(q),
    );
  }
  return views;
}

export function getReference(refId: string): ReferenceView | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM refs WHERE id = ?").get(refId) as ReferenceRow | undefined;
  return row ? hydrateRef(db, row) : null;
}

export function createReference(input: { url: string; title?: string; notes?: string }): string {
  const db = getDb();
  const parsed = parseReference(input.url);
  const rid = id();
  db.prepare(
    `INSERT INTO refs (id, user_id, url, platform, title, thumbnail_url, embed_url, notes, created_at)
     VALUES (@id, @user_id, @url, @platform, @title, @thumbnail_url, @embed_url, @notes, @created_at)`,
  ).run({
    id: rid,
    user_id: LOCAL_USER_ID,
    url: parsed.url || input.url.trim(),
    platform: parsed.platform,
    title: (input.title?.trim() || titleFromUrl(input.url)).slice(0, 200),
    thumbnail_url: parsed.thumbnailUrl,
    embed_url: parsed.embedUrl,
    notes: input.notes ?? "",
    created_at: now(),
  });
  return rid;
}

export function updateReference(
  refId: string,
  patch: { title?: string; notes?: string; url?: string },
): void {
  const db = getDb();
  const sets: string[] = [];
  const params: Record<string, unknown> = { id: refId };
  if (patch.title !== undefined) {
    sets.push("title = @title");
    params.title = patch.title;
  }
  if (patch.notes !== undefined) {
    sets.push("notes = @notes");
    params.notes = patch.notes;
  }
  if (patch.url !== undefined) {
    const parsed = parseReference(patch.url);
    sets.push("url = @url", "platform = @platform", "thumbnail_url = @thumb", "embed_url = @embed");
    params.url = parsed.url || patch.url;
    params.platform = parsed.platform;
    params.thumb = parsed.thumbnailUrl;
    params.embed = parsed.embedUrl;
  }
  if (!sets.length) return;
  db.prepare(`UPDATE refs SET ${sets.join(", ")} WHERE id = @id`).run(params);
}

export function setReferenceArchived(refId: string, archived: boolean): void {
  getDb().prepare("UPDATE refs SET archived = ? WHERE id = ?").run(archived ? 1 : 0, refId);
}

export function deleteReference(refId: string): void {
  getDb().prepare("DELETE FROM refs WHERE id = ?").run(refId);
}

export function setReferenceTags(refId: string, names: string[]): void {
  const db = getDb();
  const tagIds = ensureTagIds(db, names);
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM reference_tags WHERE reference_id = ?").run(refId);
    const ins = db.prepare(
      "INSERT OR IGNORE INTO reference_tags (reference_id, tag_id) VALUES (?, ?)",
    );
    for (const tid of tagIds) ins.run(refId, tid);
  });
  tx();
}

/** Convert a reference into a new content idea, keeping the link + notes. */
export function convertReferenceToContent(refId: string): string | null {
  const db = getDb();
  const ref = db.prepare("SELECT * FROM refs WHERE id = ?").get(refId) as ReferenceRow | undefined;
  if (!ref) return null;
  const cid = createContent({
    title: ref.title || titleFromUrl(ref.url),
    platform: ref.platform,
    status: "idea",
    notes: ref.notes,
  });
  linkReference(cid, refId);
  return cid;
}

/* ----------------------------- dashboard -------------------------------- */

export interface DashboardStats {
  totalIdeas: number;
  readyToPost: number;
  inProduction: number;
  postedThisMonth: number;
  savedReferences: number;
}

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const one = (sql: string, ...p: unknown[]) =>
    (db.prepare(sql).get(...p) as { c: number }).c;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  return {
    totalIdeas: one(
      "SELECT COUNT(*) AS c FROM content_items WHERE user_id = ? AND archived = 0",
      LOCAL_USER_ID,
    ),
    readyToPost: one(
      "SELECT COUNT(*) AS c FROM content_items WHERE user_id = ? AND archived = 0 AND status IN ('ready_to_post','scheduled')",
      LOCAL_USER_ID,
    ),
    inProduction: one(
      "SELECT COUNT(*) AS c FROM content_items WHERE user_id = ? AND archived = 0 AND status IN ('research','scripting','ready_to_record','recording','editing')",
      LOCAL_USER_ID,
    ),
    postedThisMonth: one(
      "SELECT COUNT(*) AS c FROM content_items WHERE user_id = ? AND status = 'posted' AND published_at >= ?",
      LOCAL_USER_ID,
      monthStart.toISOString(),
    ),
    savedReferences: one(
      "SELECT COUNT(*) AS c FROM refs WHERE user_id = ? AND archived = 0",
      LOCAL_USER_ID,
    ),
  };
}

export interface Momentum {
  scriptsReadyToRecord: number;
  scheduledThisWeek: number;
  unconvertedReferences: number;
  staleIdeas: number;
}

export function getMomentum(): Momentum {
  const db = getDb();
  const one = (sql: string, ...p: unknown[]) => (db.prepare(sql).get(...p) as { c: number }).c;
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return {
    scriptsReadyToRecord: one(
      "SELECT COUNT(*) AS c FROM content_items WHERE user_id = ? AND archived = 0 AND status = 'ready_to_record'",
      LOCAL_USER_ID,
    ),
    scheduledThisWeek: one(
      "SELECT COUNT(*) AS c FROM content_items WHERE user_id = ? AND archived = 0 AND status = 'scheduled' AND scheduled_at <= ?",
      LOCAL_USER_ID,
      weekEnd.toISOString(),
    ),
    unconvertedReferences: one(
      `SELECT COUNT(*) AS c FROM refs r WHERE r.user_id = ? AND r.archived = 0
       AND NOT EXISTS (SELECT 1 FROM content_references cr WHERE cr.reference_id = r.id)`,
      LOCAL_USER_ID,
    ),
    staleIdeas: one(
      `SELECT COUNT(*) AS c FROM content_items WHERE user_id = ? AND archived = 0
       AND status IN ('inbox','idea','research') AND updated_at < ?`,
      LOCAL_USER_ID,
      thirtyDaysAgo.toISOString(),
    ),
  };
}

/* ------------------------------ analytics ------------------------------- */

export interface AnalyticsData {
  totals: Metrics & { posts: number };
  byPlatform: { platform: PlatformKey; posts: number; views: number }[];
  postsOverTime: { month: string; posts: number }[];
  viewsOverTime: { month: string; views: number }[];
  topContent: { id: string; title: string; platform: PlatformKey; views: number }[];
  byFormat: { format: FormatKey; posts: number }[];
}

export function getAnalytics(): AnalyticsData {
  const db = getDb();
  const posted = db
    .prepare(
      `SELECT ci.id, ci.title, ci.platform, ci.format, ci.published_at,
              COALESCE(m.views,0) AS views, COALESCE(m.likes,0) AS likes,
              COALESCE(m.comments,0) AS comments, COALESCE(m.shares,0) AS shares,
              COALESCE(m.saves,0) AS saves, COALESCE(m.leads,0) AS leads
       FROM content_items ci
       LEFT JOIN performance_metrics m ON m.content_id = ci.id
       WHERE ci.user_id = ? AND ci.status = 'posted'`,
    )
    .all(LOCAL_USER_ID) as {
    id: string;
    title: string;
    platform: PlatformKey;
    format: FormatKey;
    published_at: string | null;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    leads: number;
  }[];

  const totals = posted.reduce(
    (acc, p) => {
      acc.views += p.views;
      acc.likes += p.likes;
      acc.comments += p.comments;
      acc.shares += p.shares;
      acc.saves += p.saves;
      acc.leads += p.leads;
      return acc;
    },
    { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, leads: 0, posts: posted.length },
  );

  const byPlatformMap = new Map<PlatformKey, { posts: number; views: number }>();
  const byFormatMap = new Map<FormatKey, number>();
  for (const p of posted) {
    const bp = byPlatformMap.get(p.platform) ?? { posts: 0, views: 0 };
    bp.posts += 1;
    bp.views += p.views;
    byPlatformMap.set(p.platform, bp);
    byFormatMap.set(p.format, (byFormatMap.get(p.format) ?? 0) + 1);
  }

  // Last 6 months buckets
  const months: string[] = [];
  const base = new Date();
  base.setDate(1);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const postsByMonth = new Map(months.map((m) => [m, 0]));
  const viewsByMonth = new Map(months.map((m) => [m, 0]));
  for (const p of posted) {
    if (!p.published_at) continue;
    const key = p.published_at.slice(0, 7);
    if (postsByMonth.has(key)) {
      postsByMonth.set(key, (postsByMonth.get(key) ?? 0) + 1);
      viewsByMonth.set(key, (viewsByMonth.get(key) ?? 0) + p.views);
    }
  }

  return {
    totals,
    byPlatform: [...byPlatformMap.entries()]
      .map(([platform, v]) => ({ platform, ...v }))
      .sort((a, b) => b.views - a.views),
    postsOverTime: months.map((m) => ({ month: m, posts: postsByMonth.get(m) ?? 0 })),
    viewsOverTime: months.map((m) => ({ month: m, views: viewsByMonth.get(m) ?? 0 })),
    topContent: [...posted]
      .sort((a, b) => b.views - a.views)
      .slice(0, 6)
      .map((p) => ({ id: p.id, title: p.title, platform: p.platform, views: p.views })),
    byFormat: [...byFormatMap.entries()]
      .map(([format, posts]) => ({ format, posts }))
      .sort((a, b) => b.posts - a.posts),
  };
}

/* -------------------------- global search ------------------------------- */

export interface SearchResults {
  content: { id: string; title: string; hook: string; platform: PlatformKey; status: StatusKey }[];
  references: { id: string; title: string; url: string; platform: PlatformKey }[];
  scripts: { id: string; title: string; snippet: string }[];
}

export function search(query: string): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) return { content: [], references: [], scripts: [] };
  const db = getDb();

  const contentRows = db
    .prepare(
      "SELECT id, title, hook, script, notes, platform, status FROM content_items WHERE user_id = ? AND archived = 0",
    )
    .all(LOCAL_USER_ID) as (Pick<
    ContentItemRow,
    "id" | "title" | "hook" | "script" | "notes" | "platform" | "status"
  >)[];

  const content = contentRows
    .filter((r) => `${r.title} ${r.hook} ${r.notes}`.toLowerCase().includes(q))
    .slice(0, 6)
    .map((r) => ({ id: r.id, title: r.title, hook: r.hook, platform: r.platform, status: r.status }));

  const scripts = contentRows
    .filter((r) => r.script && r.script.toLowerCase().includes(q))
    .slice(0, 5)
    .map((r) => {
      const idx = r.script.toLowerCase().indexOf(q);
      const start = Math.max(0, idx - 30);
      return {
        id: r.id,
        title: r.title,
        snippet: `…${r.script.slice(start, start + 90).trim()}…`,
      };
    });

  const references = (
    db
      .prepare(
        "SELECT id, title, url, platform, notes FROM refs WHERE user_id = ? AND archived = 0",
      )
      .all(LOCAL_USER_ID) as (Pick<ReferenceRow, "id" | "title" | "url" | "platform" | "notes">)[]
  )
    .filter((r) => `${r.title} ${r.url} ${r.notes}`.toLowerCase().includes(q))
    .slice(0, 6)
    .map((r) => ({ id: r.id, title: r.title, url: r.url, platform: r.platform }));

  return { content, references, scripts };
}
