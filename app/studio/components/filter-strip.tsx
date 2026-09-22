"use client";

import type { Filters } from "@/lib/studio/filters";
import { PLATFORMS, type Status, STATUSES } from "@/types/studio";

import { Chip, cx } from "./ui";

/**
 * Status counters that double as filters, plus the platform and content-pillar
 * filters. Scrolls sideways rather than wrapping, so the strip stays one line.
 */
export function FilterStrip({
  filters,
  counts,
  pillars,
  onChange,
  onOpenArchive,
}: {
  filters: Filters;
  counts: Record<Status, number>;
  pillars: string[];
  onChange: (next: Filters) => void;
  onOpenArchive: () => void;
}) {
  const total = STATUSES.reduce((sum, status) => sum + counts[status], 0);

  return (
    <div className="flex flex-col gap-3">
      <Row label="Waiting at">
        <Chip
          selected={filters.status === "all"}
          quiet
          onClick={() => onChange({ ...filters, status: "all" })}
        >
          All
          <Count value={total} selected={filters.status === "all"} />
        </Chip>
        {STATUSES.map((status) => (
          <Chip
            key={status}
            selected={filters.status === status}
            onClick={() =>
              // Published lives in the archive, so send the user there instead.
              status === "Published"
                ? onOpenArchive()
                : onChange({ ...filters, status: filters.status === status ? "all" : status })
            }
          >
            {status}
            <Count value={counts[status]} selected={filters.status === status} />
          </Chip>
        ))}
      </Row>

      <Row label="Platform">
        <Chip
          selected={filters.platform === "all"}
          quiet
          onClick={() => onChange({ ...filters, platform: "all" })}
        >
          Every platform
        </Chip>
        {PLATFORMS.map((platform) => (
          <Chip
            key={platform}
            selected={filters.platform === platform}
            onClick={() =>
              onChange({
                ...filters,
                platform: filters.platform === platform ? "all" : platform,
              })
            }
          >
            {platform}
          </Chip>
        ))}
      </Row>

      {pillars.length > 0 ? (
        <Row label="Pillar">
          <Chip
            selected={filters.pillar === "all"}
            quiet
            onClick={() => onChange({ ...filters, pillar: "all" })}
          >
            Every pillar
          </Chip>
          {pillars.map((pillar) => (
            <Chip
              key={pillar}
              selected={filters.pillar === pillar}
              onClick={() =>
                onChange({ ...filters, pillar: filters.pillar === pillar ? "all" : pillar })
              }
            >
              {pillar}
            </Chip>
          ))}
        </Row>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="st-caption hidden w-16 shrink-0 text-st-text-3 lg:block">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

function Count({ value, selected }: { value: number; selected?: boolean }) {
  return (
    <span className={cx("st-tabular", selected ? "opacity-80" : "text-st-text-3")}>{value}</span>
  );
}
