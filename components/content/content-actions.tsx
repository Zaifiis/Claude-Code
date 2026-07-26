"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  SquarePen,
  Copy,
  Recycle,
  Archive,
  ArchiveRestore,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { Dropdown, MenuItem, MenuSeparator } from "@/components/ui/dropdown";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm";
import {
  PLATFORMS,
  FORMATS,
  type PlatformKey,
  type FormatKey,
  type StatusKey,
} from "@/lib/domain/constants";
import {
  duplicateContentAction,
  archiveContentAction,
  deleteContentAction,
  repurposeContentAction,
} from "@/lib/actions/content";

export interface ContentActionTarget {
  id: string;
  title: string;
  status: StatusKey;
  archived: number;
  platform: PlatformKey;
  format: FormatKey;
}

export function ContentActionsMenu({
  content,
  trigger,
  align = "end",
}: {
  content: ContentActionTarget;
  trigger?: React.ReactNode;
  align?: "start" | "end";
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [, start] = React.useTransition();
  const [repurposeOpen, setRepurposeOpen] = React.useState(false);

  const onDuplicate = () =>
    start(async () => {
      const res = await duplicateContentAction(content.id);
      if (res.ok) toast.success("Duplicated", { action: { label: "Open", onClick: () => router.push(`/content/${res.id}`) } });
      else toast.error(res.error);
    });

  const onArchive = () =>
    start(async () => {
      await archiveContentAction(content.id, content.archived === 0);
      toast.success(content.archived ? "Restored" : "Archived");
    });

  const onDelete = async () => {
    const ok = await confirm({
      title: "Delete content?",
      description: `“${content.title}” will be permanently removed. Consider archiving instead — archived items can be restored.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    start(async () => {
      await deleteContentAction(content.id);
      toast.success("Deleted");
    });
  };

  return (
    <>
      <Dropdown
        align={align}
        trigger={
          trigger ?? (
            <button
              className="rounded-[var(--radius-sm)] p-1.5 text-faint hover:bg-surface-2 hover:text-fg transition-colors"
              aria-label="Content actions"
            >
              <MoreHorizontal className="size-4" />
            </button>
          )
        }
      >
        <MenuItem icon={SquarePen} onClick={() => router.push(`/content/${content.id}`)}>
          Open editor
        </MenuItem>
        <MenuItem icon={Copy} onClick={onDuplicate}>
          Duplicate
        </MenuItem>
        <MenuItem icon={Recycle} onClick={() => setRepurposeOpen(true)}>
          Repurpose…
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={content.archived ? ArchiveRestore : Archive} onClick={onArchive}>
          {content.archived ? "Restore" : "Archive"}
        </MenuItem>
        <MenuItem icon={Trash2} destructive onClick={onDelete}>
          Delete
        </MenuItem>
      </Dropdown>
      <RepurposeDialog
        content={content}
        open={repurposeOpen}
        onClose={() => setRepurposeOpen(false)}
      />
    </>
  );
}

export function RepurposeDialog({
  content,
  open,
  onClose,
}: {
  content: ContentActionTarget;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  // Default to a platform different from the original, so repurposing nudges
  // toward a fresh channel.
  const [platform, setPlatform] = React.useState<PlatformKey>(
    content.platform === "linkedin" ? "instagram" : "linkedin",
  );
  const [format, setFormat] = React.useState<FormatKey>("text_post");
  const [pending, start] = React.useTransition();

  const submit = () =>
    start(async () => {
      const res = await repurposeContentAction(content.id, platform, format);
      if (res.ok) {
        toast.success("New linked content created");
        onClose();
        router.push(`/content/${res.id}`);
      } else toast.error(res.error);
    });

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <DialogHeader
        title="Repurpose content"
        description="Create a new linked piece from this one — script, hook, references and tags come along."
        onClose={onClose}
      />
      <div className="space-y-4 px-5 pb-2">
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 py-2 text-[13px]">
          <span className="truncate font-medium text-fg">{content.title}</span>
          <ArrowRight className="size-3.5 shrink-0 text-faint" />
          <span className="shrink-0 text-muted">new draft</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>New platform</Label>
            <Select value={platform} onChange={(e) => setPlatform(e.target.value as PlatformKey)}>
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>New format</Label>
            <Select value={format} onChange={(e) => setFormat(e.target.value as FormatKey)}>
              {FORMATS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2 border-t border-border px-5 py-3.5">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={submit} loading={pending}>
          Create linked draft
        </Button>
      </div>
    </Dialog>
  );
}
