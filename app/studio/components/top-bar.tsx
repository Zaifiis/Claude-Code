"use client";

import { MoonIcon, PlusIcon, SearchIcon, SunIcon } from "./icons";
import type { Section } from "./nav";
import type { SaveState } from "../studio-store";
import type { Appearance } from "../use-theme";
import { Button, cx, IconButton, TextInput } from "./ui";

const SAVE_LABELS: Record<SaveState, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Offline — will retry",
};

/** A thin frosted bar: where you are, search, and the way to add an idea. */
export function TopBar({
  section,
  count,
  query,
  onQueryChange,
  onNew,
  saveState,
  appearance,
  onAppearanceChange,
}: {
  section: Section;
  count: number;
  query: string;
  onQueryChange: (next: string) => void;
  onNew: () => void;
  saveState: SaveState;
  appearance: Appearance | null;
  onAppearanceChange: (next: Appearance) => void;
}) {
  return (
    <header className="st-glass sticky top-0 z-30 border-b border-st-hairline">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="st-title-3 truncate text-st-text">{section}</h1>
          <p className="st-footnote text-st-text-3">
            {count} {count === 1 ? "idea" : "ideas"}
          </p>
        </div>

        <p
          aria-live="polite"
          className={cx(
            "st-footnote ml-auto hidden shrink-0 transition-opacity duration-[var(--st-dur)] ease-st sm:block",
            saveState === "idle" ? "opacity-0" : "opacity-100",
            saveState === "error" ? "text-st-text" : "text-st-text-3",
          )}
        >
          {SAVE_LABELS[saveState] || "Saved"}
        </p>

        <div className={cx("relative w-40 sm:w-64", saveState === "idle" && "ml-auto sm:ml-0")}>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-st-text-3" />
          <TextInput
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search"
            aria-label="Search every idea"
            className="pl-9"
          />
        </div>

        <IconButton
          label={appearance === "dark" ? "Switch to light appearance" : "Switch to dark appearance"}
          onClick={() => onAppearanceChange(appearance === "dark" ? "light" : "dark")}
        >
          {appearance === null ? null : appearance === "dark" ? <MoonIcon /> : <SunIcon />}
        </IconButton>

        {/* The sidebar owns this button on a wide screen. */}
        <Button variant="accent" onClick={onNew} className="shrink-0 px-3 shadow-st-card lg:hidden">
          <PlusIcon className="h-5 w-5" />
          <span className="sr-only sm:not-sr-only">New</span>
        </Button>
      </div>
    </header>
  );
}
