"use client";

import * as React from "react";
import { Search, LayoutGrid, List, Bookmark, X } from "lucide-react";
import { ReferenceCard } from "./reference-card";
import { Input, Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { QuickAddButton } from "@/components/shell/quick-actions";
import { PLATFORMS } from "@/lib/domain/constants";
import type { ReferenceView as Ref } from "@/lib/db/types";

export function ReferencesView({
  references,
  allTags,
  initialQuery,
  initialUsed,
}: {
  references: Ref[];
  allTags: string[];
  initialQuery?: string;
  initialUsed?: string;
}) {
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [q, setQ] = React.useState(initialQuery ?? "");
  const [platform, setPlatform] = React.useState("all");
  const [tag, setTag] = React.useState("all");
  const [used, setUsed] = React.useState(initialUsed === "unused" || initialUsed === "used" ? initialUsed : "all");
  const [sort, setSort] = React.useState<"newest" | "oldest">("newest");

  const filtered = React.useMemo(() => {
    let list = references.slice();
    const query = q.trim().toLowerCase();
    if (query) list = list.filter((r) => [r.title, r.url, r.notes, ...r.tags].join(" ").toLowerCase().includes(query));
    if (platform !== "all") list = list.filter((r) => r.platform === platform);
    if (tag !== "all") list = list.filter((r) => r.tags.includes(tag));
    if (used === "used") list = list.filter((r) => r.usedCount > 0);
    if (used === "unused") list = list.filter((r) => r.usedCount === 0);
    list.sort((a, b) => (sort === "newest" ? (a.created_at < b.created_at ? 1 : -1) : a.created_at > b.created_at ? 1 : -1));
    return list;
  }, [references, q, platform, tag, used, sort]);

  const activeFilters = (platform !== "all" ? 1 : 0) + (tag !== "all" ? 1 : 0) + (used !== "all" ? 1 : 0);
  const clear = () => {
    setPlatform("all");
    setTag("all");
    setUsed("all");
    setQ("");
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search references…" className="pl-9" />
          </div>
          <Select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest")} className="w-[130px]">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </Select>
          <Segmented
            ariaLabel="View"
            value={view}
            onChange={setView}
            options={[
              { value: "grid", icon: LayoutGrid },
              { value: "list", icon: List },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-auto min-w-[130px]">
            <option value="all">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
          <Select value={used} onChange={(e) => setUsed(e.target.value)} className="w-auto min-w-[120px]">
            <option value="all">Used & unused</option>
            <option value="used">Used</option>
            <option value="unused">Unused</option>
          </Select>
          {allTags.length > 0 && (
            <Select value={tag} onChange={(e) => setTag(e.target.value)} className="w-auto min-w-[110px]">
              <option value="all">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </Select>
          )}
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <X className="size-3.5" /> Clear ({activeFilters})
            </Button>
          )}
          <span className="ml-auto text-[12px] text-faint">
            {filtered.length} {filtered.length === 1 ? "reference" : "references"}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bookmark />}
          title={references.length === 0 ? "No references saved." : "No references match your filters."}
          description={
            references.length === 0
              ? "Save a video or article the moment it inspires you — build a library you'll actually revisit."
              : "Try a different platform or clear your filters."
          }
          action={
            references.length === 0 ? (
              <QuickAddButton tab="reference" variant="primary">
                Paste a video or article
              </QuickAddButton>
            ) : (
              <Button variant="secondary" onClick={clear}>
                Clear filters
              </Button>
            )
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => (
            <ReferenceCard key={r.id} reference={r} allTags={allTags} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <ReferenceCard key={r.id} reference={r} allTags={allTags} variant="list" />
          ))}
        </div>
      )}
    </div>
  );
}
