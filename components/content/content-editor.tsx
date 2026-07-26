"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Cloud,
  CloudOff,
  Plus,
  X,
  ExternalLink,
  Paperclip,
  BarChart3,
  Recycle,
  Copy as CopyIcon,
  Archive,
  Trash2,
  Link2,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { StatusPicker } from "./status-picker";
import { RepurposeDialog } from "./content-actions";
import { ReferenceEmbed } from "@/components/references/reference-embed";
import { PlatformBadge } from "@/components/ui/badges";
import { useConfirm } from "@/components/ui/confirm";
import {
  PLATFORMS,
  FORMATS,
  PRIORITIES,
  type StatusKey,
} from "@/lib/domain/constants";
import {
  updateContentAction,
  setStatusAction,
  setScheduleAction,
  setContentTagsAction,
  addReferenceToContentAction,
  unlinkReferenceAction,
  addAttachmentAction,
  deleteAttachmentAction,
  upsertMetricsAction,
  duplicateContentAction,
  archiveContentAction,
  deleteContentAction,
} from "@/lib/actions/content";
import { cn, countWords, toDateInputValue, formatDate } from "@/lib/utils";
import type { ContentRecord } from "@/lib/db/types";

type SaveState = "idle" | "saving" | "saved" | "error";

const EDITABLE_KEYS = [
  "title",
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
type EditableKey = (typeof EDITABLE_KEYS)[number];
type Form = Record<EditableKey, string>;

function toForm(r: ContentRecord): Form {
  return {
    title: r.title,
    hook: r.hook,
    script: r.script,
    cta: r.cta,
    notes: r.notes,
    angle: r.angle,
    category: r.category,
    content_pillar: r.content_pillar,
    platform: r.platform,
    format: r.format,
    priority: r.priority,
    thumbnail_url: r.thumbnail_url ?? "",
  };
}

export function ContentEditor({ record, allTags }: { record: ContentRecord; allTags: string[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [form, setForm] = React.useState<Form>(() => toForm(record));
  const [tags, setTags] = React.useState<string[]>(record.tags);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [repurposeOpen, setRepurposeOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs let async callbacks (debounced flush, Cmd/Ctrl+S) read the latest form
  // and the last-saved snapshot without stale closures.
  const formRef = React.useRef<Form | null>(null);
  const savedRef = React.useRef<Form | null>(null);
  React.useEffect(() => {
    formRef.current = form;
    if (savedRef.current === null) savedRef.current = form;
  });

  const set = (key: EditableKey, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaveState("saving");
  };

  const flush = React.useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    const current = savedRef.current!;
    const latest = formRef.current!;
    const patch: Record<string, string> = {};
    for (const k of EDITABLE_KEYS) {
      if (latest[k] !== current[k]) patch[k] = latest[k];
    }
    if (Object.keys(patch).length === 0) return;
    setSaveState("saving");
    try {
      await updateContentAction(record.id, patch);
      savedRef.current = latest;
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [record.id]);

  // debounced autosave (the "saving" hint is set eagerly in `set`)
  React.useEffect(() => {
    const baseline = savedRef.current ?? form;
    const changed = EDITABLE_KEYS.some((k) => form[k] !== baseline[k]);
    if (!changed) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flush();
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [form, flush]);

  // Cmd/Ctrl+S to save now
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void flush();
        toast.success("Saved");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flush]);

  const onStatus = (s: StatusKey) => {
    setStatusAction(record.id, s).then(() => {
      toast.success("Status updated");
      router.refresh();
    });
  };
  const onSchedule = (iso: string | null) => {
    setScheduleAction(record.id, iso).then(() => router.refresh());
  };
  const onTags = (next: string[]) => {
    setTags(next);
    setContentTagsAction(record.id, next);
  };

  const onDuplicate = () =>
    duplicateContentAction(record.id).then((res) => {
      if (res.ok) {
        toast.success("Duplicated");
        router.push(`/content/${res.id}`);
      }
    });
  const onArchive = () =>
    archiveContentAction(record.id, record.archived === 0).then(() => {
      toast.success(record.archived ? "Restored" : "Archived");
      router.refresh();
    });
  const onDelete = async () => {
    const ok = await confirm({
      title: "Delete content?",
      description: "This permanently removes the content and its links. Consider archiving instead.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await deleteContentAction(record.id);
    toast.success("Deleted");
    router.push("/ideas");
  };

  const words = countWords(form.script);
  const chars = form.script.length;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6">
      {/* top bar */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <SaveIndicator state={saveState} />
        </div>
      </div>

      {record.repurposed_from && record.repurposedFromTitle && (
        <Link
          href={`/content/${record.repurposed_from}`}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-[12px] text-muted hover:text-fg"
        >
          <GitBranch className="size-3.5" /> Repurposed from “{record.repurposedFromTitle}”
        </Link>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* main */}
        <div className="min-w-0 space-y-5">
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Untitled content"
            className="w-full bg-transparent text-[26px] font-semibold tracking-tight text-fg placeholder:text-faint focus:outline-none"
          />

          <Field label="Hook" hint="The first line that earns attention.">
            <Textarea
              rows={2}
              value={form.hook}
              onChange={(e) => set("hook", e.target.value)}
              placeholder="Open with the result, the fear, or the pattern interrupt…"
            />
          </Field>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">Script</Label>
              <div className="flex items-center gap-3">
                <span className="text-[11px] tabular-nums text-faint">
                  {words} words · {chars} chars
                </span>
                <CopyButton text={form.script} />
              </div>
            </div>
            <Textarea
              value={form.script}
              onChange={(e) => set("script", e.target.value)}
              placeholder="Write the full script here. One idea per line keeps pacing tight."
              className="min-h-[340px] font-[450] leading-[1.7]"
            />
          </div>

          <Field label="Call to action">
            <Textarea
              rows={2}
              value={form.cta}
              onChange={(e) => set("cta", e.target.value)}
              placeholder="What should they do next?"
            />
          </Field>

          <Field label="Notes" hint="Reminders, storyboard, to-dos — just for you.">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything you want to remember…"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Angle">
              <Input value={form.angle} onChange={(e) => set("angle", e.target.value)} placeholder="e.g. Contrarian" />
            </Field>
            <Field label="Category">
              <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Tutorial" />
            </Field>
            <Field label="Content pillar">
              <Input value={form.content_pillar} onChange={(e) => set("content_pillar", e.target.value)} placeholder="e.g. Automation" />
            </Field>
          </div>

          <Field label="Tags">
            <TagInput value={tags} onChange={onTags} suggestions={allTags} />
          </Field>
        </div>

        {/* sidebar */}
        <aside className="space-y-5">
          <SidebarSection title="Status">
            <StatusPicker status={record.status} onChange={onStatus} />
          </SidebarSection>

          <SidebarSection title="Properties">
            <div className="space-y-3">
              <div>
                <Label>Platform</Label>
                <Select value={form.platform} onChange={(e) => set("platform", e.target.value)}>
                  {PLATFORMS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Format</Label>
                <Select value={form.format} onChange={(e) => set("format", e.target.value)}>
                  {FORMATS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                  {PRIORITIES.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </SidebarSection>

          <SidebarSection title="Schedule">
            <Input
              type="datetime-local"
              value={toDateInputValue(record.scheduled_at)}
              onChange={(e) => onSchedule(e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
            {record.published_at && (
              <p className="mt-2 text-[12px] text-muted">
                Published {formatDate(record.published_at, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </SidebarSection>

          <ReferencesPanel record={record} />
          <AttachmentsPanel record={record} />
          {(record.status === "posted" || record.metrics) && <MetricsPanel record={record} />}

          <SidebarSection title="Actions">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRepurposeOpen(true)}>
                <Recycle className="size-3.5" /> Repurpose
              </Button>
              <Button variant="secondary" size="sm" onClick={onDuplicate}>
                <CopyIcon className="size-3.5" /> Duplicate
              </Button>
              <Button variant="secondary" size="sm" onClick={onArchive}>
                <Archive className="size-3.5" /> {record.archived ? "Restore" : "Archive"}
              </Button>
              <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={onDelete}>
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          </SidebarSection>

          <p className="px-1 text-[11px] text-faint">
            Created {formatDate(record.created_at)} · Updated {formatDate(record.updated_at)}
          </p>
        </aside>
      </div>

      <RepurposeDialog
        content={{
          id: record.id,
          title: record.title,
          status: record.status,
          archived: record.archived,
          platform: record.platform,
          format: record.format,
        }}
        open={repurposeOpen}
        onClose={() => setRepurposeOpen(false)}
      />
    </div>
  );
}

/* --------------------------- small helpers ----------------------------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <Label className="mb-0">{label}</Label>
        {hint && <span className="text-[11px] text-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3.5 shadow-xs">
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-faint">{title}</h3>
      {children}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const map = {
    idle: { icon: Cloud, text: "All changes saved", cls: "text-faint" },
    saving: { icon: Loader2, text: "Saving…", cls: "text-muted" },
    saved: { icon: Check, text: "Saved", cls: "text-success" },
    error: { icon: CloudOff, text: "Save failed", cls: "text-danger" },
  }[state];
  const Icon = map.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", map.cls)}>
      <Icon className={cn("size-3.5", state === "saving" && "animate-spin")} />
      {map.text}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    if (!text) {
      toast.error("Nothing to copy yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Script copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-fg"
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy Script"}
    </button>
  );
}

/* --------------------------- references panel --------------------------- */

function ReferencesPanel({ record }: { record: ContentRecord }) {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [pending, start] = React.useTransition();

  const add = () =>
    start(async () => {
      if (!url.trim()) return;
      const res = await addReferenceToContentAction(record.id, url);
      if (res.ok) {
        toast.success("Reference added");
        setUrl("");
        router.refresh();
      } else toast.error(res.error);
    });

  const unlink = (refId: string) =>
    start(async () => {
      await unlinkReferenceAction(
        record.id,
        record.references.filter((r) => r.id !== refId).map((r) => r.id),
      );
      toast.success("Reference removed");
      router.refresh();
    });

  return (
    <SidebarSection title={`References (${record.references.length})`}>
      <div className="space-y-2.5">
        {record.references.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-[var(--radius-sm)] border border-border">
            <ReferenceEmbed data={r} />
            <div className="flex items-center gap-2 p-2">
              <PlatformBadge platform={r.platform} showLabel={false} />
              <span className="min-w-0 flex-1 truncate text-[12px] text-fg">{r.title}</span>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-faint hover:text-fg"
                aria-label="Open original"
              >
                <ExternalLink className="size-3.5" />
              </a>
              <button onClick={() => unlink(r.id)} className="text-faint hover:text-danger" aria-label="Remove reference">
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {record.references.length === 0 && (
          <p className="flex items-center gap-1.5 text-[12px] text-faint">
            <Link2 className="size-3.5" /> No references linked yet.
          </p>
        )}
        <div className="flex gap-1.5">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Paste a URL…"
            className="h-8 text-[13px]"
          />
          <Button size="icon-sm" variant="secondary" onClick={add} loading={pending} aria-label="Add reference">
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </SidebarSection>
  );
}

/* -------------------------- attachments panel --------------------------- */

function AttachmentsPanel({ record }: { record: ContentRecord }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [pending, start] = React.useTransition();

  const add = () =>
    start(async () => {
      const res = await addAttachmentAction(record.id, name, url);
      if (res.ok) {
        setName("");
        setUrl("");
        setAdding(false);
        toast.success("Attachment added");
        router.refresh();
      } else toast.error(res.error);
    });

  const remove = (id: string) =>
    start(async () => {
      await deleteAttachmentAction(id);
      router.refresh();
    });

  return (
    <SidebarSection title={`Attachments (${record.attachments.length})`}>
      <div className="space-y-2">
        {record.attachments.map((a) => (
          <div key={a.id} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface-2 px-2.5 py-1.5">
            <Paperclip className="size-3.5 shrink-0 text-faint" />
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-[12.5px] text-fg hover:text-accent">
              {a.name}
            </a>
            <button onClick={() => remove(a.id)} className="text-faint hover:text-danger" aria-label="Remove attachment">
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {record.attachments.length === 0 && !adding && (
          <p className="text-[12px] text-faint">Link briefs, assets or docs.</p>
        )}
        {adding ? (
          <div className="space-y-1.5">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Label (optional)" className="h-8 text-[13px]" />
            <div className="flex gap-1.5">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="h-8 text-[13px]" />
              <Button size="icon-sm" variant="secondary" onClick={add} loading={pending} disabled={!url.trim()} aria-label="Save attachment">
                <Check className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" /> Add attachment
          </Button>
        )}
      </div>
    </SidebarSection>
  );
}

/* ----------------------------- metrics panel ---------------------------- */

type MetricKey = "views" | "likes" | "comments" | "shares" | "saves" | "leads";
const METRIC_FIELDS: { key: MetricKey; label: string }[] = [
  { key: "views", label: "Views" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
  { key: "saves", label: "Saves" },
  { key: "leads", label: "Leads" },
];

function MetricsPanel({ record }: { record: ContentRecord }) {
  const router = useRouter();
  const [vals, setVals] = React.useState({
    views: record.metrics?.views ?? 0,
    likes: record.metrics?.likes ?? 0,
    comments: record.metrics?.comments ?? 0,
    shares: record.metrics?.shares ?? 0,
    saves: record.metrics?.saves ?? 0,
    leads: record.metrics?.leads ?? 0,
  });
  const [pending, start] = React.useTransition();

  const save = () =>
    start(async () => {
      const res = await upsertMetricsAction(record.id, vals);
      if (res.ok) {
        toast.success("Metrics saved");
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <SidebarSection title="Performance">
      <div className="grid grid-cols-2 gap-2">
        {METRIC_FIELDS.map((m) => (
          <div key={m.key}>
            <Label>{m.label}</Label>
            <Input
              type="number"
              min={0}
              value={vals[m.key]}
              onChange={(e) => setVals((v) => ({ ...v, [m.key]: Math.max(0, Number(e.target.value) || 0) }))}
              className="h-8 text-[13px]"
            />
          </div>
        ))}
      </div>
      <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={save} loading={pending}>
        <BarChart3 className="size-3.5" /> Save metrics
      </Button>
      <p className="mt-2 text-[11px] text-faint">Enter numbers manually — API sync can be added later.</p>
    </SidebarSection>
  );
}
