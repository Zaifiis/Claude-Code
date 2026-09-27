"use client";

import { STATUS_COLOR, type Status, STATUSES } from "@/types/studio";

import { BoardIcon, CalendarIcon, PlusIcon } from "./icons";
import { Button, cx } from "./ui";

/** What the main area is showing. A stage name, everything, or another view. */
export type Section = "All" | Status | "Board" | "Calendar";

export const SECTIONS: Array<"All" | Status> = ["All", ...STATUSES];

function dotClass(section: "All" | Status): string {
  return section === "All" ? "bg-st-text-3" : STATUS_COLOR[section].dot;
}

const NAV_ITEM =
  "flex min-h-11 w-full items-center gap-3 rounded-st-control px-3 text-left transition-colors duration-[var(--st-dur-fast)] ease-st focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent";

/** Desktop: a quiet column of stages down the left. */
export function Sidebar({
  section,
  counts,
  total,
  onSelect,
  onNew,
}: {
  section: Section;
  counts: Record<Status, number>;
  total: number;
  onSelect: (next: Section) => void;
  onNew: () => void;
}) {
  return (
    <nav
      aria-label="Stages"
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-st-hairline px-4 py-6 lg:flex"
    >
      <p className="st-title-3 px-3 text-st-text">Studio</p>

      <Button variant="accent" onClick={onNew} className="w-full shadow-st-card">
        <PlusIcon className="h-5 w-5" />
        New idea
      </Button>

      <div className="flex flex-col gap-1">
        {SECTIONS.map((item) => {
          const active = section === item;
          const count = item === "All" ? total : counts[item];
          return (
            <button
              key={item}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(item)}
              className={cx(
                NAV_ITEM,
                active ? "bg-st-fill text-st-text" : "text-st-text-2 hover:bg-st-fill",
              )}
            >
              <span aria-hidden="true" className={cx("h-2.5 w-2.5 shrink-0 rounded-full", dotClass(item))} />
              <span className="st-callout flex-1 truncate font-medium">{item}</span>
              <span className="st-footnote st-tabular text-st-text-3">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t border-st-hairline pt-4">
        {([["Board", BoardIcon], ["Calendar", CalendarIcon]] as const).map(([item, Icon]) => (
          <button
            key={item}
            type="button"
            aria-current={section === item ? "page" : undefined}
            onClick={() => onSelect(item)}
            className={cx(
              NAV_ITEM,
              section === item ? "bg-st-fill text-st-text" : "text-st-text-2 hover:bg-st-fill",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="st-callout flex-1 truncate font-medium">{item}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/** Phones and tablets: the same stages as one scrollable row. */
export function SectionTabs({
  section,
  counts,
  total,
  onSelect,
}: {
  section: Section;
  counts: Record<Status, number>;
  total: number;
  onSelect: (next: Section) => void;
}) {
  const items: Section[] = [...SECTIONS, "Board", "Calendar"];

  return (
    <nav
      aria-label="Stages"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const active = section === item;
        const isStage = item !== "Board" && item !== "Calendar";
        const count = item === "All" ? total : isStage ? counts[item as Status] : null;

        return (
          <button
            key={item}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect(item)}
            className={cx(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 st-footnote font-medium",
              "transition-colors duration-[var(--st-dur-fast)] ease-st",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
              active ? "bg-st-surface text-st-text shadow-st-card" : "bg-st-fill text-st-text-2",
            )}
          >
            {isStage ? (
              <span
                aria-hidden="true"
                className={cx("h-2 w-2 shrink-0 rounded-full", dotClass(item as "All" | Status))}
              />
            ) : null}
            <span>{item}</span>
            {count !== null ? <span className="st-tabular text-st-text-3">{count}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
