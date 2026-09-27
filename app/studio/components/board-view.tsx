"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { formatDayMonth, relativeLabel } from "@/lib/studio/dates";
import { countWords } from "@/lib/studio/script";
import { type Idea, PLATFORM_SHORT, STATUS_COLOR, type Status, STATUSES } from "@/types/studio";

import { cx, EmptyState, Tag } from "./ui";

const DRAG_THRESHOLD = 4;
/** How close to the board's edge before it scrolls towards the next column. */
const EDGE = 96;
/** Peak scroll speed, in px per frame, reached at the very edge. */
const EDGE_SPEED = 18;
/** How far outside a column a card can be dropped and still land in it. */
const DROP_REACH = 140;

interface DragState {
  id: string;
  from: Status;
  /** Viewport position of the floating card. */
  x: number;
  y: number;
  width: number;
  over: Status | null;
}

/**
 * Board grouped by status. Dragging a card into another column is what moves
 * the idea to that stage; dropping it on Published archives it, exactly as the
 * status picker in the idea view does.
 */
export function BoardView({
  ideas,
  today,
  filtered,
  onOpen,
  onSetStatus,
}: {
  ideas: Idea[];
  today: string | null;
  filtered: boolean;
  onOpen: (id: string) => void;
  onSetStatus: (id: string, status: Status) => void;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [live, setLive] = useState(false);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const columnRefs = useRef(new Map<Status, HTMLElement>());
  const originRef = useRef<{
    id: string;
    from: Status;
    pointerX: number;
    pointerY: number;
    grabX: number;
    grabY: number;
    width: number;
  } | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  // Mirrors `drag` so the drop can be committed outside a state updater.
  const dragRef = useRef<DragState | null>(null);

  const columns = useMemo(
    () =>
      STATUSES.map((status) => ({
        status,
        items: ideas.filter((idea) => idea.status === status),
      })),
    [ideas],
  );

  /**
   * The column a card would drop into. Falls back to the nearest one within
   * arm's reach, so a card held past the end of the board still has a target.
   */
  const columnUnder = useCallback((x: number, y: number): Status | null => {
    let nearest: { status: Status; distance: number } | null = null;

    for (const [status, element] of columnRefs.current) {
      const rect = element.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return status;

      const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
      const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
      const distance = Math.hypot(dx, dy);
      if (!nearest || distance < nearest.distance) nearest = { status, distance };
    }

    return nearest && nearest.distance <= DROP_REACH ? nearest.status : null;
  }, []);

  const recompute = useCallback(() => {
    const origin = originRef.current;
    if (!origin) return;

    const { x, y } = pointerRef.current;
    const next: DragState = {
      id: origin.id,
      from: origin.from,
      x: x - origin.grabX,
      y: y - origin.grabY,
      width: origin.width,
      over: columnUnder(x, y),
    };
    dragRef.current = next;
    setDrag(next);
  }, [columnUnder]);

  // The board is wider than any screen, so it scrolls towards whichever edge
  // the card is held against — otherwise distant columns are unreachable.
  useEffect(() => {
    if (!live) return;

    let frame = requestAnimationFrame(function step() {
      const scroller = scrollerRef.current;
      if (scroller) {
        const rect = scroller.getBoundingClientRect();
        const { x } = pointerRef.current;
        // Speed rises with how far into the edge zone the card is held, so it
        // creeps at the boundary instead of bolting to the end of the board.
        if (x < rect.left + EDGE) {
          scroller.scrollLeft -= EDGE_SPEED * Math.min((rect.left + EDGE - x) / EDGE, 1);
        } else if (x > rect.right - EDGE) {
          scroller.scrollLeft += EDGE_SPEED * Math.min((x - rect.right + EDGE) / EDGE, 1);
        }
      }
      recompute();
      frame = requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(frame);
  }, [live, recompute]);

  const begin = useCallback((event: React.PointerEvent<HTMLElement>, idea: Idea) => {
    if (event.button !== 0) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();

    card.setPointerCapture(event.pointerId);
    originRef.current = {
      id: idea.id,
      from: idea.status,
      pointerX: event.clientX,
      pointerY: event.clientY,
      grabX: event.clientX - rect.left,
      grabY: event.clientY - rect.top,
      width: rect.width,
    };
    pointerRef.current = { x: event.clientX, y: event.clientY };
    movedRef.current = false;
  }, []);

  const move = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const origin = originRef.current;
      if (!origin) return;

      pointerRef.current = { x: event.clientX, y: event.clientY };
      const travelled = Math.hypot(
        event.clientX - origin.pointerX,
        event.clientY - origin.pointerY,
      );
      if (!movedRef.current && travelled < DRAG_THRESHOLD) return;

      if (!movedRef.current) {
        movedRef.current = true;
        // Only claim the gesture once it is clearly a drag, so taps still open.
        event.preventDefault();
        setLive(true);
      }

      recompute();
    },
    [recompute],
  );

  const end = useCallback(() => {
    const committed = dragRef.current;
    originRef.current = null;
    dragRef.current = null;
    setLive(false);
    setDrag(null);

    if (committed?.over && committed.over !== committed.from) {
      onSetStatus(committed.id, committed.over);
    }
  }, [onSetStatus]);

  const dragged = drag ? ideas.find((idea) => idea.id === drag.id) : undefined;

  if (ideas.length === 0) {
    return (
      <EmptyState
        title={filtered ? "Nothing matches" : "Nothing on the board yet"}
        body={
          filtered
            ? "No idea matches your search and filters."
            : "Capture an idea above and it appears in the first column."
        }
      />
    );
  }

  return (
    <div className="relative">
      <div ref={scrollerRef} className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        <div className="flex min-w-max items-start gap-4">
          {columns.map(({ status, items }) => (
            <section
              key={status}
              ref={(element) => {
                if (element) columnRefs.current.set(status, element);
                else columnRefs.current.delete(status);
              }}
              className={cx(
                "flex w-[264px] shrink-0 flex-col gap-2 rounded-st-panel p-2",
                "transition-colors duration-[var(--st-dur-fast)] ease-st",
                drag?.over === status && drag.from !== status
                  ? "bg-st-accent-soft"
                  : "bg-st-surface-2",
              )}
            >
              <header className="flex items-center gap-2 px-2 pt-2 pb-1">
                <span
                  aria-hidden="true"
                  className={cx("h-2 w-2 shrink-0 rounded-full", STATUS_COLOR[status].dot)}
                />
                <h2 className={cx("st-caption", STATUS_COLOR[status].text)}>{status}</h2>
                <span className="st-footnote st-tabular ml-auto text-st-text-3">{items.length}</span>
              </header>

              <div className="flex flex-col gap-2">
                {items.map((idea) => (
                  <BoardCard
                    key={idea.id}
                    idea={idea}
                    today={today}
                    dimmed={drag?.id === idea.id}
                    onPointerDown={(event) => begin(event, idea)}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerCancel={end}
                    onClick={() => {
                      if (movedRef.current) return;
                      onOpen(idea.id);
                    }}
                  />
                ))}
                {items.length === 0 ? (
                  <p className="st-footnote px-2 py-6 text-center text-st-text-3">Nothing here</p>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>

      {drag && dragged ? (
        <div
          className="pointer-events-none fixed z-50 scale-[1.02] opacity-95"
          style={{ left: drag.x, top: drag.y, width: drag.width }}
        >
          <BoardCard idea={dragged} today={today} lifted />
        </div>
      ) : null}
    </div>
  );
}

function BoardCard({
  idea,
  today,
  dimmed = false,
  lifted = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  idea: Idea;
  today: string | null;
  dimmed?: boolean;
  lifted?: boolean;
}) {
  const words = countWords(idea.script);
  const relative = idea.targetDate && today ? relativeLabel(idea.targetDate, today) : null;

  return (
    <div
      role={lifted ? undefined : "button"}
      tabIndex={lifted ? undefined : 0}
      aria-label={lifted ? undefined : `${idea.title || "Untitled idea"} — ${idea.status}`}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        props.onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
      }}
      className={cx(
        "relative flex cursor-grab touch-pan-y flex-col gap-2 overflow-hidden rounded-st-card bg-st-surface p-3 pl-4 text-left select-none",
        "transition-[opacity,box-shadow] duration-[var(--st-dur-fast)] ease-st",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
        lifted ? "cursor-grabbing shadow-st-lift" : "shadow-st-card hover:shadow-st-lift",
        dimmed && "opacity-35",
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cx("absolute inset-y-0 left-0 w-1", STATUS_COLOR[idea.status].dot)}
      />
      <p className="st-callout line-clamp-3 font-medium text-st-text">
        {idea.title || "Untitled idea"}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag>{PLATFORM_SHORT[idea.platform]}</Tag>
        {idea.pillar ? <Tag>{idea.pillar}</Tag> : null}
        {idea.targetDate ? <Tag>{relative ?? formatDayMonth(idea.targetDate)}</Tag> : null}
        {words > 0 ? <Tag>{words.toLocaleString("en-GB")}w</Tag> : null}
      </div>
    </div>
  );
}
