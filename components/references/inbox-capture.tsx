"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Link as LinkIcon, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/ui/badges";
import { parseReference } from "@/lib/domain/references";
import { createReferenceAction } from "@/lib/actions/references";
import { createContentAction } from "@/lib/actions/content";

export function InboxCapture() {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [pending, start] = React.useTransition();
  const trimmed = value.trim();
  const parsed = trimmed ? parseReference(trimmed) : null;
  const isUrl = parsed?.valid ?? false;

  const save = () =>
    start(async () => {
      if (!trimmed) return;
      if (isUrl) {
        const res = await createReferenceAction({ url: trimmed });
        if (res.ok) toast.success("Reference saved to inbox");
        else toast.error(res.error);
      } else {
        const res = await createContentAction({ title: trimmed, status: "inbox" });
        if (res.ok) toast.success("Idea captured");
        else toast.error(res.error);
      }
      setValue("");
      router.refresh();
    });

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="mt-1 hidden size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-accent-soft text-accent sm:flex">
          <Sparkles className="size-4.5" />
        </span>
        <div className="flex-1">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
            }}
            rows={2}
            autoFocus
            placeholder="Paste a video, post, article or idea…"
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-fg placeholder:text-faint focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-h-6 text-[12px] text-muted">
              {trimmed &&
                (isUrl ? (
                  <span className="inline-flex items-center gap-1.5">
                    <LinkIcon className="size-3.5 text-faint" /> Saves as reference ·{" "}
                    <PlatformBadge platform={parsed!.platform} />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Lightbulb className="size-3.5 text-faint" /> Saves as a content idea
                  </span>
                ))}
            </div>
            <Button variant="primary" size="sm" onClick={save} loading={pending} disabled={!trimmed}>
              Capture <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
