"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lightbulb, PenLine, Bookmark, CalendarClock } from "lucide-react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { PlatformBadge } from "@/components/ui/badges";
import { PLATFORMS, FORMATS, PRIORITIES } from "@/lib/domain/constants";
import { parseReference } from "@/lib/domain/references";
import { createContentAction, setScheduleAction } from "@/lib/actions/content";
import { createReferenceAction } from "@/lib/actions/references";
import { schedulableContentAction, type SchedulableItem } from "@/lib/actions/lookup";
import { toDateInputValue } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type QuickAddTab = "idea" | "script" | "reference" | "schedule";

const TABS: { key: QuickAddTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "idea", label: "New Idea", icon: Lightbulb },
  { key: "script", label: "New Script", icon: PenLine },
  { key: "reference", label: "Save Reference", icon: Bookmark },
  { key: "schedule", label: "Schedule", icon: CalendarClock },
];

export function QuickAddModal({
  open,
  tab,
  onClose,
}: {
  open: boolean;
  tab: QuickAddTab;
  onClose: () => void;
}) {
  const [active, setActive] = React.useState<QuickAddTab>(tab);
  React.useEffect(() => {
    if (open) setActive(tab);
  }, [open, tab]);

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg" labelledBy="quick-add-title">
      <DialogHeader
        id="quick-add-title"
        title="Quick add"
        description="Capture now, organise later."
        onClose={onClose}
      />
      <div className="flex gap-1 px-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-t-[var(--radius-sm)] border-b-2 px-2.5 py-2 text-[13px] font-medium transition-colors",
              active === t.key
                ? "border-accent text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}
      </div>
      <div className="border-t border-border">
        {active === "idea" && <IdeaForm mode="idea" onClose={onClose} />}
        {active === "script" && <IdeaForm mode="script" onClose={onClose} />}
        {active === "reference" && <ReferenceForm onClose={onClose} />}
        {active === "schedule" && <ScheduleForm open={open && active === "schedule"} onClose={onClose} />}
      </div>
    </Dialog>
  );
}

function IdeaForm({ mode, onClose }: { mode: "idea" | "script"; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [platform, setPlatform] = React.useState("other");
  const [format, setFormat] = React.useState("other");
  const [priority, setPriority] = React.useState("medium");
  const [pending, start] = React.useTransition();

  const submit = (openEditor: boolean) =>
    start(async () => {
      const res = await createContentAction({
        title,
        platform,
        format,
        priority,
        status: mode === "script" ? "scripting" : "idea",
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onClose();
      if (openEditor || mode === "script") {
        router.push(`/content/${res.id}`);
      } else {
        toast.success("Idea captured", {
          action: { label: "Open", onClick: () => router.push(`/content/${res.id}`) },
        });
      }
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      className="space-y-4 p-5"
    >
      <div>
        <Label htmlFor="qa-title">Title{mode === "script" ? " (you'll write the script next)" : ""}</Label>
        <Input
          id="qa-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={mode === "script" ? "e.g. How I automate lead follow-up" : "What's the idea?"}
        />
        <p className="mt-1.5 text-[11px] text-faint">Only a title is required — everything else is optional.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label>Platform</Label>
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Format</Label>
          <Select value={format} onChange={(e) => setFormat(e.target.value)}>
            {FORMATS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {PRIORITIES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        {mode === "idea" && (
          <Button type="button" variant="secondary" loading={pending} onClick={() => submit(true)}>
            Create & open
          </Button>
        )}
        <Button type="submit" variant="primary" loading={pending} disabled={!title.trim()}>
          {mode === "script" ? "Start script" : "Create idea"}
        </Button>
      </div>
    </form>
  );
}

function ReferenceForm({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [pending, start] = React.useTransition();
  const parsed = url.trim() ? parseReference(url) : null;

  const submit = () =>
    start(async () => {
      const res = await createReferenceAction({ url, notes });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Reference saved");
      onClose();
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4 p-5"
    >
      <div>
        <Label htmlFor="qa-url">Paste a video, post or article URL</Label>
        <Input
          id="qa-url"
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=…"
          inputMode="url"
        />
        {parsed && parsed.valid && (
          <div className="mt-2 flex items-center gap-2 text-[12px] text-muted">
            Detected: <PlatformBadge platform={parsed.platform} />
            {parsed.embedKind === "youtube" && <span className="text-success">· embeddable preview</span>}
          </div>
        )}
        {parsed && !parsed.valid && url.trim() && (
          <p className="mt-2 text-[12px] text-warning">That doesn&apos;t look like a URL — it&apos;ll still be saved as a note.</p>
        )}
      </div>
      <div>
        <Label>Notes (optional)</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why is this worth keeping?" />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={pending} disabled={!url.trim()}>
          Save reference
        </Button>
      </div>
    </form>
  );
}

function ScheduleForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = React.useState<SchedulableItem[] | null>(null);
  const [contentId, setContentId] = React.useState("");
  const [when, setWhen] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return toDateInputValue(d.toISOString());
  });
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (!open) return;
    schedulableContentAction().then((list) => {
      setItems(list);
      setContentId((prev) => prev || list[0]?.id || "");
    });
  }, [open]);

  const submit = () =>
    start(async () => {
      if (!contentId || !when) return;
      await setScheduleAction(contentId, new Date(when).toISOString());
      toast.success("Content scheduled");
      onClose();
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4 p-5"
    >
      {items && items.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-muted">
          Nothing to schedule yet — create an idea first.
        </p>
      ) : (
        <>
          <div>
            <Label>Content</Label>
            <Select value={contentId} onChange={(e) => setContentId(e.target.value)} disabled={!items}>
              {!items && <option>Loading…</option>}
              {items?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Publish date & time</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={pending} disabled={!contentId || !when}>
              Schedule
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
