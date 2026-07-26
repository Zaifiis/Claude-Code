"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  ExternalLink,
  Sparkles,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Link2,
} from "lucide-react";
import { ReferenceEmbed } from "./reference-embed";
import { PlatformBadge, TagChip } from "@/components/ui/badges";
import { Dropdown, MenuItem, MenuSeparator } from "@/components/ui/dropdown";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { useConfirm } from "@/components/ui/confirm";
import { cn, relativeTime } from "@/lib/utils";
import type { ReferenceView } from "@/lib/db/types";
import {
  convertReferenceAction,
  archiveReferenceAction,
  deleteReferenceAction,
  updateReferenceAction,
  setReferenceTagsAction,
} from "@/lib/actions/references";

export function ReferenceCard({
  reference,
  allTags = [],
  variant = "grid",
}: {
  reference: ReferenceView;
  allTags?: string[];
  variant?: "grid" | "list";
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, start] = React.useTransition();
  const [editing, setEditing] = React.useState(false);

  const onConvert = () =>
    start(async () => {
      const res = await convertReferenceAction(reference.id);
      if (res.ok) {
        toast.success("Converted to a content idea");
        router.push(`/content/${res.id}`);
      } else toast.error(res.error);
    });

  const onArchive = () =>
    start(async () => {
      await archiveReferenceAction(reference.id, reference.archived === 0);
      toast.success(reference.archived ? "Reference restored" : "Reference archived");
    });

  const onDelete = async () => {
    const ok = await confirm({
      title: "Delete reference?",
      description: "This permanently removes the reference. Prefer archiving to keep it recoverable.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    start(async () => {
      await deleteReferenceAction(reference.id);
      toast.success("Reference deleted");
    });
  };

  const menu = (
    <Dropdown
      trigger={
        <button
          className="rounded-[var(--radius-sm)] p-1.5 text-faint hover:bg-surface-2 hover:text-fg transition-colors"
          aria-label="Reference actions"
        >
          <MoreHorizontal className="size-4" />
        </button>
      }
    >
      <MenuItem icon={Sparkles} onClick={onConvert} disabled={pending}>
        Convert to idea
      </MenuItem>
      <MenuItem icon={Pencil} onClick={() => setEditing(true)}>
        Edit notes & tags
      </MenuItem>
      <MenuItem
        icon={ExternalLink}
        onClick={() => window.open(reference.url, "_blank", "noopener,noreferrer")}
      >
        Open original
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={reference.archived ? ArchiveRestore : Archive} onClick={onArchive}>
        {reference.archived ? "Restore" : "Archive"}
      </MenuItem>
      <MenuItem icon={Trash2} destructive onClick={onDelete}>
        Delete
      </MenuItem>
    </Dropdown>
  );

  const editDialog = (
    <EditReferenceDialog
      reference={reference}
      allTags={allTags}
      open={editing}
      onClose={() => setEditing(false)}
    />
  );

  if (variant === "list") {
    return (
      <>
        <div className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-2.5 shadow-xs transition-colors hover:border-border-strong">
          <div className="w-28 shrink-0 sm:w-36">
            <ReferenceEmbed data={reference} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-fg">{reference.title}</p>
              {reference.usedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-accent">
                  <Link2 className="size-3" />
                  {reference.usedCount}
                </span>
              )}
            </div>
            {reference.notes && <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">{reference.notes}</p>}
            <div className="mt-1.5 flex items-center gap-2">
              <PlatformBadge platform={reference.platform} />
              <span className="text-[11px] text-faint">{relativeTime(reference.created_at)}</span>
            </div>
          </div>
          {menu}
        </div>
        {editDialog}
      </>
    );
  }

  return (
    <>
      <div className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">
        <div className="p-1.5 pb-0">
          <ReferenceEmbed data={reference} />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-[13.5px] font-medium leading-snug text-fg">{reference.title}</p>
            {menu}
          </div>
          {reference.notes && <p className="line-clamp-2 text-[12.5px] text-muted">{reference.notes}</p>}
          {reference.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reference.tags.slice(0, 4).map((t) => (
                <TagChip key={t} label={t} />
              ))}
            </div>
          )}
          <div className="mt-auto flex items-center justify-between pt-1">
            <PlatformBadge platform={reference.platform} />
            <div className="flex items-center gap-2">
              {reference.usedCount > 0 ? (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-accent"
                  title={`Used in ${reference.usedCount} content ${reference.usedCount === 1 ? "item" : "items"}`}
                >
                  <Link2 className="size-3" />
                  {reference.usedCount}
                </span>
              ) : (
                <span className="text-[11px] text-faint">Unused</span>
              )}
              <a
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[var(--radius-sm)] p-1.5 text-faint hover:bg-surface-2 hover:text-fg transition-colors"
                aria-label="Open original"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
      {editDialog}
    </>
  );
}

function EditReferenceDialog({
  reference,
  allTags,
  open,
  onClose,
}: {
  reference: ReferenceView;
  allTags: string[];
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = React.useState(reference.title);
  const [notes, setNotes] = React.useState(reference.notes);
  const [tags, setTags] = React.useState<string[]>(reference.tags);
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setTitle(reference.title);
      setNotes(reference.notes);
      setTags(reference.tags);
    }
  }, [open, reference]);

  const save = () =>
    start(async () => {
      await updateReferenceAction(reference.id, { title, notes });
      await setReferenceTagsAction(reference.id, tags);
      toast.success("Reference updated");
      onClose();
    });

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <DialogHeader title="Edit reference" onClose={onClose} />
      <div className="space-y-4 px-5 pb-2">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What's worth remembering about this?" />
        </div>
        <div>
          <Label>Tags</Label>
          <TagInput value={tags} onChange={setTags} suggestions={allTags} />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2 border-t border-border px-5 py-3.5">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} loading={pending}>
          Save changes
        </Button>
      </div>
    </Dialog>
  );
}
