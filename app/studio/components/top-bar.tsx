"use client";

import { useEffect, useRef, useState } from "react";

import { ArchiveIcon, BoardIcon, CalendarIcon, ListIcon, MoonIcon, PlusIcon, SearchIcon, SunIcon } from "./icons";
import type { SaveState } from "../studio-store";
import { type Appearance } from "../use-theme";
import { cx, IconButton, Segmented, TextInput } from "./ui";

export type View = "list" | "board" | "calendar" | "archive";

const VIEW_OPTIONS = [
  { value: "list" as const, label: "Ranked", icon: <ListIcon className="h-4 w-4" /> },
  { value: "board" as const, label: "Board", icon: <BoardIcon className="h-4 w-4" /> },
  { value: "calendar" as const, label: "Calendar", icon: <CalendarIcon className="h-4 w-4" /> },
];

/**
 * The frosted bar that sits above the content: what to make next, the view
 * switcher, quick capture and search. It stays put while the list scrolls.
 */
export function TopBar({
  nextUp,
  view,
  onViewChange,
  query,
  onQueryChange,
  onCapture,
  saveState,
  appearance,
  onAppearanceChange,
}: {
  nextUp: string | null;
  view: View;
  onViewChange: (next: View) => void;
  query: string;
  onQueryChange: (next: string) => void;
  onCapture: (title: string) => void;
  saveState: SaveState;
  appearance: Appearance | null;
  onAppearanceChange: (next: Appearance) => void;
}) {
  const [draft, setDraft] = useState("");
  const [justCaptured, setJustCaptured] = useState(false);
  const captureRef = useRef<HTMLInputElement | null>(null);

  // The confirmation fades on its own; the field stays focused so you can keep
  // dumping ideas in without reaching for the mouse.
  useEffect(() => {
    if (!justCaptured) return;
    const timer = setTimeout(() => setJustCaptured(false), 1600);
    return () => clearTimeout(timer);
  }, [justCaptured]);

  const capture = (event: React.FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;

    onCapture(title);
    setDraft("");
    captureRef.current?.focus();
    setJustCaptured(true);
  };

  return (
    <header className="st-glass sticky top-0 z-30 border-b border-st-hairline">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-3 px-4 pt-3 pb-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="st-title-3 text-st-text">Studio</h1>
            <p className="st-footnote truncate text-st-text-2">
              {nextUp ? (
                <>
                  <span className="text-st-accent">Next up</span> · {nextUp}
                </>
              ) : (
                "Nothing queued yet"
              )}
            </p>
          </div>

          <SaveBadge state={saveState} />

          <div className="hidden sm:block">
            <Segmented
              label="Change view"
              options={VIEW_OPTIONS}
              value={view === "archive" ? "list" : view}
              onChange={onViewChange}
            />
          </div>

          <IconButton
            label="Published archive"
            active={view === "archive"}
            onClick={() => onViewChange(view === "archive" ? "list" : "archive")}
          >
            <ArchiveIcon />
          </IconButton>

          <IconButton
            label={
              appearance === "dark" ? "Switch to light appearance" : "Switch to dark appearance"
            }
            onClick={() => onAppearanceChange(appearance === "dark" ? "light" : "dark")}
          >
            {appearance === null ? null : appearance === "dark" ? <MoonIcon /> : <SunIcon />}
          </IconButton>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={capture} className="relative flex-1">
            <PlusIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-st-text-3" />
            <TextInput
              ref={captureRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Capture an idea, press Enter"
              aria-label="Capture a new idea"
              enterKeyHint="done"
              className="bg-st-surface pr-24 pl-9 shadow-st-card"
            />
            <span
              aria-live="polite"
              className={cx(
                "st-footnote pointer-events-none absolute top-1/2 right-3 -translate-y-1/2",
                "transition-opacity duration-[var(--st-dur)] ease-st",
                justCaptured ? "text-st-accent" : "text-st-text-3",
              )}
            >
              {justCaptured ? "Added to the bottom" : "Enter ↵"}
            </span>
          </form>

          <div className="relative sm:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-st-text-3" />
            <TextInput
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search titles, scripts, captions"
              aria-label="Search every idea"
              className="pl-9"
            />
          </div>
        </div>

        <div className="sm:hidden">
          <Segmented
            label="Change view"
            options={VIEW_OPTIONS}
            value={view === "archive" ? "list" : view}
            onChange={onViewChange}
          />
        </div>
      </div>
    </header>
  );
}

const SAVE_LABELS: Record<SaveState, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Offline — will retry",
};

function SaveBadge({ state }: { state: SaveState }) {
  return (
    <p
      aria-live="polite"
      className={cx(
        "st-footnote hidden shrink-0 tabular-nums transition-opacity duration-[var(--st-dur)] ease-st sm:block",
        state === "idle" ? "opacity-0" : "opacity-100",
        state === "error" ? "text-st-text" : "text-st-text-3",
      )}
    >
      {SAVE_LABELS[state] || "Saved"}
    </p>
  );
}
