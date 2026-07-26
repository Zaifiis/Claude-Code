"use client";

import * as React from "react";
import Link from "next/link";
import { Search, PenLine, ArrowRight, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/misc";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { StatusBadge } from "@/components/ui/badges";
import { QuickAddButton } from "@/components/shell/quick-actions";
import { countWords } from "@/lib/utils";
import { relativeTime } from "@/lib/utils";
import type { ContentRecord } from "@/lib/db/types";

type Filter = "all" | "drafting" | "written";

export function ScriptsView({ items }: { items: ContentRecord[] }) {
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  const filtered = React.useMemo(() => {
    let list = items.slice();
    if (filter === "written") list = list.filter((c) => countWords(c.script) > 0);
    if (filter === "drafting") list = list.filter((c) => countWords(c.script) === 0);
    const query = q.trim().toLowerCase();
    if (query) list = list.filter((c) => `${c.title} ${c.script} ${c.hook}`.toLowerCase().includes(query));
    return list.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  }, [items, q, filter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search scripts…" className="pl-9" />
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "written", label: "Written" },
            { value: "drafting", label: "Needs script" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<PenLine />}
          title={items.length === 0 ? "No scripts yet." : "No scripts match."}
          description={
            items.length === 0
              ? "Start a script from any idea, or create one directly."
              : "Try a different search or filter."
          }
          action={
            items.length === 0 ? (
              <QuickAddButton tab="script" variant="primary">
                Start a script
              </QuickAddButton>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          {filtered.map((c, i) => {
            const words = countWords(c.script);
            return (
              <Link
                key={c.id}
                href={`/content/${c.id}`}
                className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <PlatformIcon platform={c.platform} className="size-4 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-fg">{c.title}</p>
                  <p className="truncate text-[12px] text-muted">
                    {c.hook || (words ? c.script.slice(0, 90) : "No script written yet")}
                  </p>
                </div>
                <div className="hidden items-center gap-3 sm:flex">
                  <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-faint">
                    <FileText className="size-3" />
                    {words} words
                  </span>
                  <StatusBadge status={c.status} />
                  <span className="w-14 text-right text-[11px] text-faint">{relativeTime(c.updated_at)}</span>
                </div>
                <ArrowRight className="size-4 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
