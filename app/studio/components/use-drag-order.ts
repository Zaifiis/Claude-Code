"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Distance the pointer must travel before a press becomes a drag. */
const DRAG_THRESHOLD = 3;
/** How close to the viewport edge before the page starts creeping. */
const EDGE = 72;
/** Peak scroll speed, in px per frame, reached at the very edge. */
const EDGE_SPEED = 16;

export interface DragOrderState {
  id: string;
  fromIndex: number;
  toIndex: number;
  /** How far the dragged row has travelled, in px. */
  offset: number;
  rowHeight: number;
}

/**
 * Pointer-driven reordering for a vertical list of equal-height rows.
 *
 * Works the same with a mouse, a trackpad and a finger, and moves nothing but
 * CSS transforms while the drag is live, so it stays at frame rate. The list
 * is committed once, on release.
 */
export function useDragOrder({
  count,
  onMove,
}: {
  count: number;
  onMove: (fromIndex: number, toIndex: number) => void;
}) {
  const [drag, setDrag] = useState<DragOrderState | null>(null);
  const [live, setLive] = useState(false);

  const originRef = useRef<{ pageY: number; rowHeight: number; fromIndex: number; id: string } | null>(
    null,
  );
  const pointerYRef = useRef(0);
  // Mirrors `drag`, so the commit on release reads it without going through a
  // state updater — those run during render, where setState is not allowed.
  const dragRef = useRef<DragOrderState | null>(null);

  const recompute = useCallback(() => {
    const origin = originRef.current;
    if (!origin) return;

    const offset = pointerYRef.current + window.scrollY - origin.pageY;
    const limit = Math.max(count - 1, 0);
    const toIndex = Math.min(
      Math.max(origin.fromIndex + Math.round(offset / origin.rowHeight), 0),
      limit,
    );

    const next: DragOrderState = {
      id: origin.id,
      fromIndex: origin.fromIndex,
      toIndex,
      offset,
      rowHeight: origin.rowHeight,
    };
    dragRef.current = next;
    setDrag(next);
  }, [count]);

  // While a drag is live, creep the page when the pointer nears an edge, so a
  // long list can be dragged past the fold without letting go.
  useEffect(() => {
    if (!live) return;

    let frame = requestAnimationFrame(function step() {
      // Speed rises with how far into the edge zone the row is held, so the
      // page creeps at the boundary rather than bolting to the end.
      const y = pointerYRef.current;
      const bottom = window.innerHeight - EDGE;
      if (y < EDGE) {
        window.scrollBy(0, -EDGE_SPEED * Math.min((EDGE - y) / EDGE, 1));
        recompute();
      } else if (y > bottom) {
        window.scrollBy(0, EDGE_SPEED * Math.min((y - bottom) / EDGE, 1));
        recompute();
      }
      frame = requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(frame);
  }, [live, recompute]);

  const begin = useCallback((event: React.PointerEvent<HTMLElement>, index: number, id: string) => {
    if (event.button !== 0) return;

    const handle = event.currentTarget;
    const row = handle.closest("[data-drag-row]");
    if (!(row instanceof HTMLElement)) return;

    const rowHeight = row.getBoundingClientRect().height;
    if (rowHeight === 0) return;

    handle.setPointerCapture(event.pointerId);
    event.preventDefault();

    originRef.current = { pageY: event.clientY + window.scrollY, rowHeight, fromIndex: index, id };
    pointerYRef.current = event.clientY;
  }, []);

  const move = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const origin = originRef.current;
      if (!origin) return;

      pointerYRef.current = event.clientY;
      const travelled = Math.abs(event.clientY + window.scrollY - origin.pageY);
      if (travelled < DRAG_THRESHOLD && !drag) return;

      setLive(true);
      recompute();
    },
    [drag, recompute],
  );

  const end = useCallback(() => {
    const committed = dragRef.current;
    originRef.current = null;
    dragRef.current = null;
    setLive(false);
    setDrag(null);

    if (committed && committed.toIndex !== committed.fromIndex) {
      onMove(committed.fromIndex, committed.toIndex);
    }
  }, [onMove]);

  /** How far row `index` should shift to make room for the dragged row. */
  const offsetFor = useCallback(
    (index: number) => {
      if (!drag) return 0;
      const { fromIndex, toIndex, rowHeight, offset } = drag;
      if (index === fromIndex) return offset;
      if (toIndex > fromIndex && index > fromIndex && index <= toIndex) return -rowHeight;
      if (toIndex < fromIndex && index >= toIndex && index < fromIndex) return rowHeight;
      return 0;
    },
    [drag],
  );

  return { drag, begin, move, end, offsetFor };
}
