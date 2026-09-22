"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Appearance = "light" | "dark";

const STORAGE_KEY = "studio-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    query.removeEventListener("change", onChange);
  };
}

function getSnapshot(): Appearance {
  const chosen = document.documentElement.getAttribute("data-theme");
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** The server cannot know the viewer's appearance, so it renders neither. */
function getServerSnapshot(): null {
  return null;
}

/**
 * Light/dark appearance. Follows the system until you choose, then remembers
 * the choice. The chosen value is applied before first paint by the inline
 * script in the root layout, so a reload never flashes the other appearance.
 *
 * `null` until after hydration, which keeps the server and client markup equal.
 */
export function useAppearance(): {
  appearance: Appearance | null;
  setAppearance: (next: Appearance) => void;
} {
  const appearance = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setAppearance = useCallback((next: Appearance) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing, or storage is blocked. The choice lasts this session.
    }
    for (const listener of listeners) listener();
  }, []);

  return { appearance, setAppearance };
}
