"use client";

import { useEffect, useState } from "react";

import { MoonIcon, PlusIcon, SearchIcon, SunIcon } from "./icons";
import type { Section } from "./nav";
import type { SaveState } from "../studio-store";
import type { Appearance } from "../use-theme";
import { cx, IconButton, TextInput } from "./ui";

const SAVE_LABELS: Record<SaveState, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Offline — will retry",
};

/** How far the content scrolls before the large title hands over to the bar. */
const COLLAPSE_AT = 28;

/**
 * A navigation bar that carries the section name only once the large title
 * below it has scrolled away — the behaviour of a title in an Apple app.
 */
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > COLLAPSE_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cx(
          "st-glass sticky top-0 z-30 transition-[border-color] duration-[var(--st-dur)] ease-st",
          collapsed ? "border-b border-st-hairline" : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-14 w-full max-w-[1080px] items-center gap-2 px-4 sm:px-6">
          <p
            aria-hidden={!collapsed}
            className={cx(
              "st-headline min-w-0 truncate text-st-text",
              "transition-all duration-[var(--st-dur)] ease-st",
              collapsed ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
            )}
          >
            {section}
          </p>

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

          <div className={cx("relative w-36 sm:w-56", saveState === "idle" && "ml-auto sm:ml-0")}>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-st-text-3" />
            <TextInput
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search"
              aria-label="Search every idea"
              className="h-10 min-h-10 rounded-full pl-9"
            />
          </div>

          <IconButton
            label={appearance === "dark" ? "Switch to light appearance" : "Switch to dark appearance"}
            onClick={() => onAppearanceChange(appearance === "dark" ? "light" : "dark")}
            className="st-pressable"
          >
            {appearance === null ? null : appearance === "dark" ? <MoonIcon /> : <SunIcon />}
          </IconButton>

          {/* The sidebar owns this button on a wide screen. */}
          <IconButton
            label="New idea"
            onClick={onNew}
            className="st-pressable shrink-0 bg-st-accent text-st-on-accent shadow-st-raised hover:bg-st-accent-hover hover:text-st-on-accent lg:hidden"
          >
            <PlusIcon />
          </IconButton>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1080px] px-4 pt-1 pb-3 sm:px-6">
        <h1
          className={cx(
            "st-large-title text-st-text",
            "transition-all duration-[var(--st-dur)] ease-st",
            collapsed ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100",
          )}
        >
          {section}
        </h1>
        <p className="st-footnote text-st-text-3">
          {count} {count === 1 ? "idea" : "ideas"}
        </p>
      </div>
    </>
  );
}
