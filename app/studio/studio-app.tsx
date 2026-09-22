"use client";

import { useCallback, useMemo, useState } from "react";

import { matches, NO_FILTERS, hasActiveFilters } from "@/lib/studio/filters";
import type { Status } from "@/types/studio";

import { ArchiveList } from "./components/archive-list";
import { BoardView } from "./components/board-view";
import { CalendarView } from "./components/calendar-view";
import { FilterStrip } from "./components/filter-strip";
import { IdeaSheet } from "./components/idea-sheet";
import { RankedList } from "./components/ranked-list";
import { TopBar, type View } from "./components/top-bar";
import { useStudio } from "./studio-store";
import { useAppearance } from "./use-theme";
import { useToday } from "./use-today";

export function StudioApp() {
  const { active, archived, byId, counts, pillars, saveState, create, update, moveVisible } =
    useStudio();
  const today = useToday();
  const { appearance, setAppearance } = useAppearance();

  const [view, setView] = useState<View>("list");
  const [filters, setFilters] = useState(NO_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtering = hasActiveFilters(filters);

  const visibleActive = useMemo(
    () => active.filter((idea) => matches(idea, filters)),
    [active, filters],
  );
  const visibleArchived = useMemo(
    () => archived.filter((idea) => matches(idea, filters)),
    [archived, filters],
  );
  // The board and calendar show published work too: one stage on the board,
  // and a date that has already been and gone on the calendar.
  const everything = useMemo(
    () => [...visibleActive, ...visibleArchived],
    [visibleActive, visibleArchived],
  );

  const onMove = useCallback(
    (fromIndex: number, toIndex: number) => {
      moveVisible(
        visibleActive.map((idea) => idea.id),
        fromIndex,
        toIndex,
      );
    },
    [moveVisible, visibleActive],
  );

  const onSetStatus = useCallback(
    (id: string, status: Status) => update(id, { status }, "now"),
    [update],
  );

  const openIdea = openId ? byId.get(openId) : undefined;
  const openPosition = openIdea && !openIdea.archived
    ? active.findIndex((idea) => idea.id === openIdea.id) + 1
    : null;

  return (
    <div className="st-root flex min-h-dvh flex-col bg-st-canvas text-st-text">
      <TopBar
        nextUp={active[0]?.title || (active.length > 0 ? "Untitled idea" : null)}
        view={view}
        onViewChange={setView}
        query={filters.query}
        onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
        onCapture={(title) =>
          create(title, filters.platform === "all" ? {} : { platform: filters.platform })
        }
        saveState={saveState}
        appearance={appearance}
        onAppearanceChange={setAppearance}
      />

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 pt-6 pb-24 sm:px-6">
        <FilterStrip
          filters={filters}
          counts={counts}
          pillars={pillars}
          onChange={setFilters}
          onOpenArchive={() => setView("archive")}
        />

        <div className="mt-6">
          {view === "list" ? (
            <RankedList
              ideas={visibleActive}
              today={today}
              filtered={filtering}
              onOpen={setOpenId}
              onMove={onMove}
            />
          ) : null}

          {view === "board" ? (
            <BoardView
              ideas={everything}
              today={today}
              filtered={filtering}
              onOpen={setOpenId}
              onSetStatus={onSetStatus}
            />
          ) : null}

          {view === "calendar" ? (
            <CalendarView ideas={everything} today={today} onOpen={setOpenId} />
          ) : null}

          {view === "archive" ? (
            <ArchiveList ideas={visibleArchived} filtered={filtering} onOpen={setOpenId} />
          ) : null}
        </div>
      </main>

      {openIdea ? (
        <IdeaSheet
          key={openIdea.id}
          idea={openIdea}
          position={openPosition}
          total={active.length}
          today={today}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </div>
  );
}
