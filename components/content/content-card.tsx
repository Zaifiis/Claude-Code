"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, Link2, Clock } from "lucide-react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { StatusBadge, PriorityBadge, FormatBadge, TagChip } from "@/components/ui/badges";
import { Thumbnail } from "@/components/ui/thumbnail";
import { ContentActionsMenu } from "./content-actions";
import { formatDate, relativeTime, ageBucket } from "@/lib/utils";
import { PLATFORM_MAP } from "@/lib/domain/constants";
import type { ContentRecord } from "@/lib/db/types";

function previewUrl(content: ContentRecord): string | null {
  if (content.thumbnail_url) return content.thumbnail_url;
  const ref = content.references.find((r) => r.thumbnail_url);
  return ref?.thumbnail_url ?? null;
}

export function ContentCard({
  content,
  variant = "grid",
  showStatus = true,
  showPreview = true,
}: {
  content: ContentRecord;
  variant?: "grid" | "compact";
  showStatus?: boolean;
  showPreview?: boolean;
}) {
  const preview = showPreview ? previewUrl(content) : null;
  const platform = PLATFORM_MAP[content.platform];
  const age = ageBucket(content.updated_at);

  if (variant === "compact") {
    return (
      <div className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 shadow-xs transition-colors hover:border-border-strong">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
          style={{ backgroundColor: `${platform?.color}1a`, color: platform?.color }}
        >
          <PlatformIcon platform={content.platform} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/content/${content.id}`} className="block truncate text-[13.5px] font-medium text-fg hover:text-accent">
            {content.title}
          </Link>
          {content.hook && <p className="truncate text-[12px] text-muted">{content.hook}</p>}
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          <FormatBadge format={content.format} />
          {showStatus && <StatusBadge status={content.status} />}
          <PriorityBadge priority={content.priority} />
        </div>
        <ContentActionsMenu content={content} />
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">
      <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <div className="rounded-[var(--radius-sm)] bg-surface/90 backdrop-blur-sm">
          <ContentActionsMenu content={content} />
        </div>
      </div>

      {preview ? (
        <Link href={`/content/${content.id}`} className="relative block aspect-[16/9] overflow-hidden bg-surface-2">
          <Thumbnail src={preview} platform={content.platform} imgClassName="transition-transform duration-200 group-hover:scale-[1.03]" />
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <PlatformIcon platform={content.platform} className="size-3" />
            {platform?.label}
          </span>
        </Link>
      ) : null}

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-start gap-2">
          {!preview && (
            <span
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-xs)]"
              style={{ backgroundColor: `${platform?.color}1a`, color: platform?.color }}
            >
              <PlatformIcon platform={content.platform} className="size-3.5" />
            </span>
          )}
          <Link
            href={`/content/${content.id}`}
            className="line-clamp-2 flex-1 pr-6 text-[14.5px] font-semibold leading-snug text-fg hover:text-accent"
          >
            {content.title}
          </Link>
        </div>

        {content.hook && <p className="line-clamp-2 text-[12.5px] leading-relaxed text-muted">{content.hook}</p>}

        {content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.tags.slice(0, 3).map((t) => (
              <TagChip key={t} label={t} />
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <FormatBadge format={content.format} />
          {showStatus && <StatusBadge status={content.status} />}
          <PriorityBadge priority={content.priority} />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-faint">
          <span className="inline-flex items-center gap-1">
            {content.scheduled_at ? (
              <>
                <CalendarClock className="size-3" />
                {formatDate(content.scheduled_at, { month: "short", day: "numeric" })}
              </>
            ) : (
              <>
                <Clock className="size-3" />
                {relativeTime(content.updated_at)}
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-2">
            {content.references.length > 0 && (
              <span className="inline-flex items-center gap-0.5" title={`${content.references.length} references`}>
                <Link2 className="size-3" />
                {content.references.length}
              </span>
            )}
            {age === "stale" && <span className="text-warning">stale</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
