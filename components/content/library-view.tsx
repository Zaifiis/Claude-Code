"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Eye, Heart, MessageCircle, Share2, Bookmark, Users, Library } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Thumbnail } from "@/components/ui/thumbnail";
import { FormatBadge } from "@/components/ui/badges";
import { ContentActionsMenu } from "./content-actions";
import { PLATFORMS, FORMATS, PLATFORM_MAP } from "@/lib/domain/constants";
import { formatDate, formatNumber } from "@/lib/utils";
import type { ContentRecord } from "@/lib/db/types";

export function LibraryView({ items }: { items: ContentRecord[] }) {
  const [q, setQ] = React.useState("");
  const [platform, setPlatform] = React.useState("all");
  const [format, setFormat] = React.useState("all");

  const filtered = React.useMemo(() => {
    let list = items.slice();
    const query = q.trim().toLowerCase();
    if (query) list = list.filter((c) => c.title.toLowerCase().includes(query));
    if (platform !== "all") list = list.filter((c) => c.platform === platform);
    if (format !== "all") list = list.filter((c) => c.format === format);
    return list.sort((a, b) => ((a.published_at ?? "") < (b.published_at ?? "") ? 1 : -1));
  }, [items, q, platform, format]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search published content…" className="pl-9" />
        </div>
        <Select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-auto min-w-[130px]">
          <option value="all">All platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </Select>
        <Select value={format} onChange={(e) => setFormat(e.target.value)} className="w-auto min-w-[130px]">
          <option value="all">All formats</option>
          {FORMATS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Library />}
          title={items.length === 0 ? "Nothing published yet." : "No published content matches."}
          description={
            items.length === 0
              ? "As you move content to Posted, it lands here with its performance."
              : "Try another filter."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <LibraryCard key={c.id} content={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryCard({ content }: { content: ContentRecord }) {
  const preview = content.thumbnail_url ?? content.references.find((r) => r.thumbnail_url)?.thumbnail_url ?? null;
  const platform = PLATFORM_MAP[content.platform];
  const m = content.metrics;
  const metrics = [
    { icon: Eye, value: m?.views ?? 0 },
    { icon: Heart, value: m?.likes ?? 0 },
    { icon: MessageCircle, value: m?.comments ?? 0 },
    { icon: Share2, value: m?.shares ?? 0 },
    { icon: Bookmark, value: m?.saves ?? 0 },
    { icon: Users, value: m?.leads ?? 0 },
  ];

  return (
    <div className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-xs transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">
      <Link href={`/content/${content.id}`} className="relative block aspect-[16/9] overflow-hidden bg-surface-2">
        <Thumbnail src={preview} platform={content.platform} imgClassName="transition-transform duration-200 group-hover:scale-[1.03]" />
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          <PlatformIcon platform={content.platform} className="size-3" />
          {platform?.label}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/content/${content.id}`} className="line-clamp-2 flex-1 text-[14px] font-semibold leading-snug text-fg hover:text-accent">
            {content.title}
          </Link>
          <ContentActionsMenu content={content} />
        </div>
        <div className="flex items-center gap-2">
          <FormatBadge format={content.format} />
          <span className="text-[11px] text-faint">{formatDate(content.published_at, { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <div className="mt-auto grid grid-cols-6 gap-1 border-t border-border pt-2.5">
          {metrics.map((mm, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5" title={String(mm.value)}>
              <mm.icon className="size-3.5 text-faint" />
              <span className="text-[11px] font-medium tabular-nums text-muted">{formatNumber(mm.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
