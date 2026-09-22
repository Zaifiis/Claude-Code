"use client";

import { useMemo, useState } from "react";

import {
  addMonths,
  formatFullDate,
  formatMonthTitle,
  monthGrid,
  monthOf,
  parseISO,
  todayISO,
  WEEKDAYS_SHORT,
  type YearMonth,
} from "@/lib/studio/dates";
import { type Idea, PLATFORM_SHORT } from "@/types/studio";

import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { Button, cx, IconButton, Panel, Tag } from "./ui";

/** Month view of target publish dates, plus everything still undated. */
export function CalendarView({
  ideas,
  today,
  onOpen,
}: {
  ideas: Idea[];
  today: string | null;
  onOpen: (id: string) => void;
}) {
  const [cursor, setCursor] = useState<YearMonth>(
    () => monthOf(today ?? todayISO()) ?? { year: 2026, month: 1 },
  );

  const byDate = useMemo(() => {
    const map = new Map<string, Idea[]>();
    for (const idea of ideas) {
      if (!idea.targetDate) continue;
      const bucket = map.get(idea.targetDate);
      if (bucket) bucket.push(idea);
      else map.set(idea.targetDate, [idea]);
    }
    return map;
  }, [ideas]);

  const undated = useMemo(() => ideas.filter((idea) => !idea.targetDate), [ideas]);
  const cells = useMemo(() => monthGrid(cursor), [cursor]);
  const agenda = useMemo(
    () => [...byDate.entries()].filter(([iso]) => iso.startsWith(monthPrefix(cursor))).sort(),
    [byDate, cursor],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <h2 className="st-title-3 mr-auto text-st-text">{formatMonthTitle(cursor)}</h2>
        <Button
          variant="plain"
          className="px-3"
          onClick={() => setCursor(monthOf(today ?? todayISO()) ?? cursor)}
        >
          Today
        </Button>
        <IconButton label="Previous month" onClick={() => setCursor(addMonths(cursor, -1))}>
          <ChevronLeftIcon />
        </IconButton>
        <IconButton label="Next month" onClick={() => setCursor(addMonths(cursor, 1))}>
          <ChevronRightIcon />
        </IconButton>
      </div>

      {/* Wide screens get the month grid. */}
      <Panel className="hidden overflow-hidden sm:block">
        <div className="grid grid-cols-7 border-b border-st-hairline">
          {WEEKDAYS_SHORT.map((weekday) => (
            <div key={weekday} className="st-caption px-2 py-3 text-center text-st-text-3">
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, index) => {
            const items = byDate.get(cell.iso) ?? [];
            const isToday = cell.iso === today;
            return (
              <div
                key={cell.iso}
                className={cx(
                  "flex min-h-[112px] flex-col gap-1 border-st-hairline p-2",
                  index % 7 !== 0 && "border-l",
                  index >= 7 && "border-t",
                  !cell.inMonth && "bg-st-surface-2/40",
                )}
              >
                <span
                  className={cx(
                    "st-footnote st-tabular self-start rounded-full px-1.5 py-0.5",
                    isToday
                      ? "bg-st-accent font-semibold text-st-on-accent"
                      : cell.inMonth
                        ? "text-st-text-2"
                        : "text-st-text-3",
                  )}
                >
                  {parseISO(cell.iso)?.day}
                </span>
                {items.map((idea) => (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => onOpen(idea.id)}
                    title={`${idea.title || "Untitled idea"} · ${idea.platform} · ${idea.status}`}
                    className="flex min-h-7 items-center gap-1 rounded-[7px] bg-st-fill px-1.5 text-left transition-colors duration-[var(--st-dur-fast)] ease-st hover:bg-st-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent"
                  >
                    <span className="st-footnote st-tabular shrink-0 font-medium text-st-text-3">
                      {PLATFORM_SHORT[idea.platform]}
                    </span>
                    <span className="st-footnote truncate text-st-text">
                      {idea.title || "Untitled idea"}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Phones get an agenda instead, where every row is a real tap target. */}
      <div className="flex flex-col gap-4 sm:hidden">
        {agenda.length === 0 ? (
          <Panel className="px-4 py-8">
            <p className="st-callout text-center text-st-text-3">
              Nothing scheduled in {formatMonthTitle(cursor)}.
            </p>
          </Panel>
        ) : (
          agenda.map(([iso, items]) => (
            <section key={iso} className="flex flex-col gap-2">
              <h3 className="st-caption px-1 text-st-text-3">
                {formatFullDate(iso)}
                {iso === today ? " · Today" : ""}
              </h3>
              <Panel className="overflow-hidden">
                {items.map((idea, index) => (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => onOpen(idea.id)}
                    className={cx(
                      "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left",
                      index > 0 && "border-t border-st-hairline",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="st-callout block truncate font-medium text-st-text">
                        {idea.title || "Untitled idea"}
                      </span>
                      <span className="st-footnote text-st-text-2">
                        {idea.platform} · {idea.status}
                      </span>
                    </span>
                  </button>
                ))}
              </Panel>
            </section>
          ))
        )}
      </div>

      {undated.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="st-caption px-1 text-st-text-3">
            No target date yet · {undated.length}
          </h3>
          <div className="flex flex-wrap gap-2">
            {undated.map((idea) => (
              <button
                key={idea.id}
                type="button"
                onClick={() => onOpen(idea.id)}
                className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-st-control bg-st-surface px-3 shadow-st-card transition-shadow duration-[var(--st-dur-fast)] ease-st hover:shadow-st-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent"
              >
                <Tag>{PLATFORM_SHORT[idea.platform]}</Tag>
                <span className="st-callout truncate text-st-text">
                  {idea.title || "Untitled idea"}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function monthPrefix({ year, month }: YearMonth): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}
