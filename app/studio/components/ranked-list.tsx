"use client";

import { useCallback } from "react";

import { formatDayMonth, relativeLabel } from "@/lib/studio/dates";
import { countWords } from "@/lib/studio/script";
import { type Idea, PLATFORM_SHORT } from "@/types/studio";

import { GripIcon } from "./icons";
import { cx, EmptyState, Tag } from "./ui";
import { useDragOrder } from "./use-drag-order";

export function RankedList({
  ideas,
  today,
  filtered,
  onOpen,
  onMove,
}: {
  ideas: Idea[];
  today: string | null;
  /** True when a search or filter is narrowing the list. */
  filtered: boolean;
  onOpen: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}) {
  const { drag, begin, move, end, offsetFor } = useDragOrder({
    count: ideas.length,
    onMove,
  });

  const onHandleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      const target =
        event.key === "ArrowUp"
          ? index - 1
          : event.key === "ArrowDown"
            ? index + 1
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? ideas.length - 1
                : null;

      if (target === null) return;
      event.preventDefault();
      if (target < 0 || target > ideas.length - 1) return;
      onMove(index, target);
    },
    [ideas.length, onMove],
  );

  if (ideas.length === 0) {
    return (
      <EmptyState
        title={filtered ? "Nothing matches" : "The list is empty"}
        body={
          filtered
            ? "No idea matches your search and filters. Clear them to see the full make-next order again."
            : "Type an idea in the capture box above and press Enter. It lands at the bottom of this list, ready to be dragged up."
        }
      />
    );
  }

  return (
    <ol className="relative" aria-label="Ideas in make-next order">
      {ideas.map((idea, index) => {
        const dragging = drag?.id === idea.id;
        const offset = offsetFor(index);

        return (
          <li
            key={idea.id}
            data-drag-row
            style={{ transform: offset === 0 ? undefined : `translate3d(0, ${offset}px, 0)` }}
            className={cx(
              "relative flex items-stretch gap-1 bg-st-surface select-none",
              // Rounded ends only, so the rows read as one grouped panel.
              index === 0 && "rounded-t-st-panel",
              index === ideas.length - 1 && "rounded-b-st-panel",
              index > 0 && !dragging && "before:absolute before:inset-x-14 before:top-0 before:h-px before:bg-st-hairline",
              dragging
                ? "z-10 rounded-st-card shadow-st-lift"
                : "duration-[var(--st-dur)] ease-st transition-transform",
            )}
          >
            <button
              type="button"
              aria-label={`Reorder ${idea.title || "untitled idea"}. Currently ${index + 1} of ${ideas.length}. Use the arrow keys to move it.`}
              onPointerDown={(event) => begin(event, index, idea.id)}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              onKeyDown={(event) => onHandleKeyDown(event, index)}
              className={cx(
                "flex w-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-st-control text-st-text-3",
                "transition-colors duration-[var(--st-dur-fast)] ease-st hover:text-st-text-2",
                dragging && "cursor-grabbing text-st-text-2",
              )}
            >
              <GripIcon className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onOpen(idea.id)}
              className="flex min-h-14 min-w-0 flex-1 items-center gap-4 rounded-st-control py-3 pr-4 text-left transition-colors duration-[var(--st-dur-fast)] ease-st hover:bg-st-fill"
            >
              <span
                className={cx(
                  "st-footnote st-tabular w-6 shrink-0 text-right font-semibold",
                  index === 0 ? "text-st-accent" : "text-st-text-3",
                )}
              >
                {index + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="st-headline block truncate text-st-text">
                  {idea.title || "Untitled idea"}
                </span>
                <span className="st-footnote mt-0.5 flex items-center gap-2 truncate text-st-text-2">
                  <span className="st-tabular shrink-0 font-medium">{PLATFORM_SHORT[idea.platform]}</span>
                  <span aria-hidden="true" className="text-st-text-3">·</span>
                  <span className="truncate">{idea.status}</span>
                  {idea.pillar ? (
                    <>
                      <span aria-hidden="true" className="text-st-text-3">·</span>
                      <span className="truncate">{idea.pillar}</span>
                    </>
                  ) : null}
                </span>
              </span>

              <span className="hidden shrink-0 items-center gap-2 sm:flex">
                <ScriptBadge script={idea.script} />
                <DateBadge targetDate={idea.targetDate} today={today} />
                {index === 0 ? <Tag tone="accent">Next up</Tag> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function ScriptBadge({ script }: { script: string }) {
  const words = countWords(script);
  if (words === 0) return null;
  return <Tag>{words.toLocaleString("en-GB")}w</Tag>;
}

function DateBadge({ targetDate, today }: { targetDate: string; today: string | null }) {
  if (!targetDate) return null;
  const relative = today ? relativeLabel(targetDate, today) : null;
  return <Tag>{relative ?? formatDayMonth(targetDate)}</Tag>;
}
