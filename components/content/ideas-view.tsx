"use client";

import * as React from "react";
import { Search, LayoutGrid, List, SlidersHorizontal, X, Lightbulb } from "lucide-react";
import { ContentCard } from "./content-card";
import { Input, Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { QuickAddButton } from "@/components/shell/quick-actions";
import {
  PLATFORMS,
  STATUSES,
  FORMATS,
  PRIORITIES,
  PRIORITY_ORDER,
} from "@/lib/domain/constants";
import { ageBucket, type AgeBucket } from "@/lib/utils";
import type { ContentRecord } from "@/lib/db/types";

type Sort = "updated" | "newest" | "oldest" | "priority" | "publish";

const SORTS: { value: Sort; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "priority", label: "Priority" },
  { value: "publish", label: "Publish date" },
];

const AGES: { value: AgeBucket | "all"; label: string }[] = [
  { value: "all", label: "Any age" },
  { value: "fresh", label: "Fresh (<7d)" },
  { value: "week", label: "7+ days" },
  { value: "month", label: "30+ days" },
  { value: "stale", label: "Stale (60+d)" },
];

export function IdeasView({
  items,
  allTags,
  initialStatus,
  initialAge,
  emptyHint,
}: {
  items: ContentRecord[];
  allTags: string[];
  initialStatus?: string;
  initialAge?: string;
  emptyHint?: string;
}) {
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [q, setQ] = React.useState("");
  const [platform, setPlatform] = React.useState("all");
  const [status, setStatus] = React.useState(initialStatus ?? "all");
  const [format, setFormat] = React.useState("all");
  const [priority, setPriority] = React.useState("all");
  const [tag, setTag] = React.useState("all");
  const [age, setAge] = React.useState<AgeBucket | "all">((initialAge as AgeBucket) ?? "all");
  const [sort, setSort] = React.useState<Sort>("updated");

  const filtered = React.useMemo(() => {
    let list = items.slice();
    const query = q.trim().toLowerCase();
    if (query)
      list = list.filter((c) =>
        [c.title, c.hook, c.script, c.notes, ...c.tags].join(" ").toLowerCase().includes(query),
      );
    if (platform !== "all") list = list.filter((c) => c.platform === platform);
    if (status !== "all") list = list.filter((c) => c.status === status);
    if (format !== "all") list = list.filter((c) => c.format === format);
    if (priority !== "all") list = list.filter((c) => c.priority === priority);
    if (tag !== "all") list = list.filter((c) => c.tags.includes(tag));
    if (age !== "all") list = list.filter((c) => ageBucket(c.updated_at) === age);

    list.sort((a, b) => {
      switch (sort) {
        case "newest":
          return a.created_at < b.created_at ? 1 : -1;
        case "oldest":
          return a.created_at > b.created_at ? 1 : -1;
        case "priority":
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case "publish": {
          const av = a.scheduled_at ?? "9999";
          const bv = b.scheduled_at ?? "9999";
          return av < bv ? -1 : av > bv ? 1 : 0;
        }
        default:
          return a.updated_at < b.updated_at ? 1 : -1;
      }
    });
    return list;
  }, [items, q, platform, status, format, priority, tag, age, sort]);

  const activeFilters =
    (platform !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (format !== "all" ? 1 : 0) +
    (priority !== "all" ? 1 : 0) +
    (tag !== "all" ? 1 : 0) +
    (age !== "all" ? 1 : 0);

  const clearAll = () => {
    setPlatform("all");
    setStatus("all");
    setFormat("all");
    setPriority("all");
    setTag("all");
    setAge("all");
    setQ("");
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ideas…" className="pl-9" />
          </div>
          <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-[168px]">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
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
          <span className="hidden items-center gap-1.5 text-[12px] font-medium text-faint sm:inline-flex">
            <SlidersHorizontal className="size-3.5" /> Filters
          </span>
          <FilterSelect value={platform} onChange={setPlatform} allLabel="All platforms" options={PLATFORMS} />
          <FilterSelect value={status} onChange={setStatus} allLabel="All statuses" options={STATUSES} />
          <FilterSelect value={format} onChange={setFormat} allLabel="All formats" options={FORMATS} />
          <FilterSelect value={priority} onChange={setPriority} allLabel="Any priority" options={PRIORITIES} />
          <Select value={age} onChange={(e) => setAge(e.target.value as AgeBucket | "all")} className="w-auto min-w-[120px]">
            {AGES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
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
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="size-3.5" /> Clear ({activeFilters})
            </Button>
          )}
          <span className="ml-auto text-[12px] text-faint">
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Lightbulb />}
          title={items.length === 0 ? "No ideas yet." : "No ideas match your filters."}
          description={
            items.length === 0
              ? (emptyHint ?? "Capture something the moment inspiration strikes — you can organise it later.")
              : "Try loosening a filter or clearing them all."
          }
          action={
            items.length === 0 ? (
              <QuickAddButton tab="idea" variant="primary">
                Capture your first idea
              </QuickAddButton>
            ) : (
              <Button variant="secondary" onClick={clearAll}>
                Clear filters
              </Button>
            )
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => (
            <ContentCard key={c.id} content={c} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <ContentCard key={c.id} content={c} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: { key: string; label: string }[];
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="w-auto min-w-[120px]">
      <option value="all">{allLabel}</option>
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
