"use client";

import { type Channel, CHANNEL_SHORT, CHANNELS } from "@/types/studio";

import { cx } from "./ui";

/** Which brand the list is showing, or all three at once. */
export type ChannelFilter = Channel | "all";

/**
 * The three brands, as tabs.
 *
 * "All" stays first on purpose: you make one video at a time, so the combined
 * queue is the real one. The counts next to each tab are there to make an
 * imbalance visible — five agency videos and nothing for Unfiltered is
 * something you should notice now, not in three months.
 */
export function ChannelTabs({
  value,
  counts,
  total,
  onChange,
  className,
}: {
  value: ChannelFilter;
  counts: Record<Channel, number>;
  total: number;
  onChange: (next: ChannelFilter) => void;
  className?: string;
}) {
  const tabs: Array<{ key: ChannelFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: total },
    ...CHANNELS.map((channel) => ({
      key: channel as ChannelFilter,
      label: CHANNEL_SHORT[channel],
      count: counts[channel],
    })),
  ];

  return (
    <div
      role="tablist"
      aria-label="Channel"
      className={cx(
        "flex shrink-0 items-center gap-1 rounded-full bg-st-fill p-1",
        "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            className={cx(
              "st-pressable inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 st-footnote font-medium",
              "lg:min-h-8",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
              selected
                ? "bg-st-surface text-st-text shadow-st-raised"
                : "text-st-text-2 hover:text-st-text",
            )}
          >
            <span>{tab.label}</span>
            <span className={cx("st-tabular tabular-nums", selected ? "text-st-text-3" : "text-st-text-3")}>
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
