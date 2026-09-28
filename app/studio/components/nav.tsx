"use client";

import { STATUS_COLOR, type Status, STATUSES } from "@/types/studio";

import {
  BoardIcon,
  CalendarIcon,
  CameraIcon,
  PlusIcon,
  ScissorsIcon,
  ScriptIcon,
  SendIcon,
  SparkIcon,
  StackIcon,
} from "./icons";
import { Button, cx } from "./ui";

/** What the main area is showing: a stage, everything, or another view. */
export type Section = "All" | Status | "Board" | "Calendar";

export const SECTIONS: Array<"All" | Status> = ["All", ...STATUSES];

type Glyph = (props: { className?: string }) => React.ReactElement;

/** A glyph per stage, so the sidebar reads without depending on colour alone. */
const GLYPH: Record<"All" | Status, Glyph> = {
  All: StackIcon,
  Idea: SparkIcon,
  Scripted: ScriptIcon,
  Recorded: CameraIcon,
  Edited: ScissorsIcon,
  Posted: SendIcon,
};

function tint(section: "All" | Status): string {
  return section === "All" ? "text-st-text-2" : STATUS_COLOR[section].text;
}

const ROW = cx(
  "st-pressable group relative flex min-h-10 w-full items-center gap-3 rounded-st-control px-3 text-left",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
);

/** Desktop: a translucent column of stages, the way a Mac app carries its sidebar. */
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
      className="st-vibrancy sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-6 border-r border-st-hairline px-3 py-6 lg:flex"
    >
      <p className="st-headline px-3 text-st-text">Studio</p>

      <Button variant="accent" onClick={onNew} className="st-pressable w-full shadow-st-raised">
        <PlusIcon className="h-5 w-5" />
        New idea
      </Button>

      <div className="flex flex-col gap-1">
        {SECTIONS.map((item) => {
          const active = section === item;
          const count = item === "All" ? total : counts[item];
          const Icon = GLYPH[item];

          return (
            <button
              key={item}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(item)}
              className={cx(
                ROW,
                active ? "bg-st-fill text-st-text" : "text-st-text-2 hover:bg-st-fill/60",
              )}
            >
              <Icon className={cx("h-[18px] w-[18px] shrink-0", active ? tint(item) : "text-st-text-3")} />
              <span className="st-callout flex-1 truncate font-medium">{item}</span>
              <span
                className={cx(
                  "st-footnote st-tabular tabular-nums",
                  active ? "text-st-text-2" : "text-st-text-3",
                )}
              >
                {count}
              </span>
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
              ROW,
              section === item ? "bg-st-fill text-st-text" : "text-st-text-2 hover:bg-st-fill/60",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0 text-st-text-3" />
            <span className="st-callout flex-1 truncate font-medium">{item}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/** Phones and tablets: the same stages as one scrollable row of capsules. */
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
        const Icon = isStage ? GLYPH[item as "All" | Status] : item === "Board" ? BoardIcon : CalendarIcon;

        return (
          <button
            key={item}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect(item)}
            className={cx(
              "st-pressable inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 st-footnote font-medium",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
              active
                ? "bg-st-surface text-st-text shadow-st-raised"
                : "bg-st-fill text-st-text-2",
            )}
          >
            <Icon
              className={cx(
                "h-4 w-4 shrink-0",
                active && isStage ? tint(item as "All" | Status) : "text-st-text-3",
              )}
            />
            <span>{item}</span>
            {count !== null ? (
              <span className="st-tabular tabular-nums text-st-text-3">{count}</span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
