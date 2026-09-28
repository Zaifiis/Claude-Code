"use client";

import { useCallback } from "react";

import { formatDayMonth, relativeLabel } from "@/lib/studio/dates";
import { countWords } from "@/lib/studio/script";
import { type Idea, PLATFORM_SHORT, STATUS_COLOR } from "@/types/studio";

import { GripIcon } from "./icons";
import { cx, EmptyState, Tag } from "./ui";
import { useDragOrder } from "./use-drag-order";

/**
 * The ideas, in the order they get made. Each card carries its stage colour
 * down the left edge, so a glance down the list reads as a pipeline.
 */
export function IdeaList({
  ideas,
  today,
  emptyTitle,
  emptyBody,
  reorderable,
  onOpen,
  onMove,
}: {
  ideas: Idea[];
  today: string | null;
  emptyTitle: string;
  emptyBody: string;
  /** Dragging is only offered where the order is the real one. */
  reorderable: boolean;
  onOpen: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}) {
  const { drag, begin, move, end, offsetFor } = useDragOrder({ count: ideas.length, onMove });

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
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <ol className="flex flex-col gap-2" aria-label="Ideas">
      {ideas.map((idea, index) => {
        const dragging = drag?.id === idea.id;
        const offset = reorderable ? offsetFor(index) : 0;
        const tone = STATUS_COLOR[idea.status];
        const words = countWords(idea.script);
        const relative = idea.targetDate && today ? relativeLabel(idea.targetDate, today) : null;

        return (
          <li
            key={idea.id}
            data-drag-row
            style={{ transform: offset === 0 ? undefined : `translate3d(0, ${offset}px, 0)` }}
            className={cx(
              "relative flex select-none items-stretch overflow-hidden rounded-st-card bg-st-surface",
              dragging
                ? "z-10 scale-[1.01] shadow-st-float"
                : "shadow-st-raised duration-[var(--st-dur)] ease-st transition-transform",
            )}
          >
            <span aria-hidden="true" className={cx("w-[3px] shrink-0", tone.dot)} />

            {reorderable ? (
              <button
                type="button"
                aria-label={`Reorder ${idea.title || "untitled idea"}. Currently ${index + 1} of ${ideas.length}. Use the arrow keys to move it.`}
                onPointerDown={(event) => begin(event, index, idea.id)}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                onKeyDown={(event) => onHandleKeyDown(event, index)}
                className={cx(
                  "flex w-10 shrink-0 cursor-grab touch-none items-center justify-center text-st-text-3",
                  "transition-colors duration-[var(--st-dur-fast)] ease-st hover:text-st-text-2",
                  dragging && "cursor-grabbing text-st-text-2",
                )}
              >
                <GripIcon className="h-4 w-4" />
              </button>
            ) : (
              <span aria-hidden="true" className="w-4 shrink-0" />
            )}

            <button
              type="button"
              onClick={() => onOpen(idea.id)}
              className="st-pressable flex min-h-16 min-w-0 flex-1 items-center gap-4 py-3 pr-4 text-left hover:bg-st-fill/70"
            >
              <span className="min-w-0 flex-1">
                <span className="st-headline block truncate text-st-text">
                  {idea.title || "Untitled idea"}
                </span>
                <span className="st-footnote mt-1 flex items-center gap-2 truncate">
                  <span
                    className={cx(
                      "shrink-0 rounded-full px-2 py-0.5 font-semibold",
                      tone.soft,
                      tone.text,
                    )}
                  >
                    {idea.status}
                  </span>
                  <span className="shrink-0 text-st-text-2">{PLATFORM_SHORT[idea.platform]}</span>
                  {idea.pillar ? (
                    <>
                      <span aria-hidden="true" className="text-st-text-3">·</span>
                      <span className="truncate text-st-text-2">{idea.pillar}</span>
                    </>
                  ) : null}
                </span>
              </span>

              <span className="hidden shrink-0 items-center gap-2 sm:flex">
                {words > 0 ? <Tag>{words.toLocaleString("en-GB")}w</Tag> : null}
                {idea.targetDate ? <Tag>{relative ?? formatDayMonth(idea.targetDate)}</Tag> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
