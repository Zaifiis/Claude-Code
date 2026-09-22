"use client";

import { useSyncExternalStore } from "react";

import { todayISO } from "@/lib/studio/dates";

/** Re-check roughly once a minute so a window left open overnight rolls over. */
const TICK = 60_000;

function subscribe(onChange: () => void): () => void {
  const timer = setInterval(onChange, TICK);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function getServerSnapshot(): null {
  return null;
}

/**
 * Today's date in the viewer's timezone — `null` until after hydration, so a
 * server running in UTC never disagrees with the browser about what "Today" is.
 */
export function useToday(): string | null {
  return useSyncExternalStore(subscribe, todayISO, getServerSnapshot);
}
