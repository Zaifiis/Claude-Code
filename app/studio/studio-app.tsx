"use client";

import { useCallback, useMemo, useState } from "react";

import { matches } from "@/lib/studio/filters";
import { type Channel, CHANNELS, type Status } from "@/types/studio";

import { BoardView } from "./components/board-view";
import { CalendarView } from "./components/calendar-view";
import type { ChannelFilter } from "./components/channel-tabs";
import { IdeaList } from "./components/idea-list";
import { IdeaPage } from "./components/idea-page";
import { type Section, SectionTabs, Sidebar } from "./components/nav";
import { NewIdeaModal } from "./components/new-idea-modal";
import { TodoDrawer } from "./components/todo-drawer";
import { TopBar } from "./components/top-bar";
import { useStudio } from "./studio-store";
import { useAppearance } from "./use-theme";
import { useToday } from "./use-today";

const EMPTY: Record<Section, { title: string; body: string }> = {
  All: {
    title: "Nothing to make",
    body: "Hit New idea, type what you're thinking, and click away. It lands in Ideas. Anything already posted is in the Posted section.",
  },
  Idea: { title: "No raw ideas", body: "Everything you've captured has moved on to a later stage." },
  Scripted: { title: "Nothing scripted", body: "Write a script on an idea and move it to Scripted." },
  Recorded: { title: "Nothing recorded", body: "Move a card here once you've filmed it." },
  Edited: { title: "Nothing edited", body: "Cards land here when the edit is done and it's ready to post." },
  Posted: { title: "Nothing posted yet", body: "Posted videos collect here, with room for a note on how each did." },
  Board: { title: "", body: "" },
  Calendar: { title: "", body: "" },
};

export function StudioApp() {
  const { active, archived, byId, counts, saveState, create, update, moveVisible } = useStudio();
  const today = useToday();
  const { appearance, setAppearance } = useAppearance();

  const [section, setSection] = useState<Section>("All");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const searching = query.trim() !== "";
  const everything = useMemo(() => [...active, ...archived], [active, archived]);

  /**
   * Posted work is done, so it lives in its own section rather than cluttering
   * the make-next order — except when you are searching, which looks
   * everywhere.
   */
  const source = searching ? everything : section === "Posted" ? archived : active;

  const found = useMemo(
    () =>
      source.filter(
        (idea) => matches(idea, query) && (channel === "all" || idea.channel === channel),
      ),
    [source, query, channel],
  );

  /** Counts across the whole make-next queue, so the tabs show the real mix. */
  const channelCounts = useMemo(() => {
    const tally = Object.fromEntries(CHANNELS.map((name) => [name, 0])) as Record<Channel, number>;
    for (const idea of active) tally[idea.channel] += 1;
    return tally;
  }, [active]);

  const listed = useMemo(() => {
    if (section === "All" || section === "Board" || section === "Calendar") return found;
    return found.filter((idea) => idea.status === section);
  }, [found, section]);

  // Dragging edits the real make-next order, so it is offered wherever the list
  // is made of cards that are actually in that order.
  const reorderable =
    !searching && section !== "Posted" && section !== "Board" && section !== "Calendar";

  const onMove = useCallback(
    (fromIndex: number, toIndex: number) => {
      moveVisible(
        listed.map((idea) => idea.id),
        fromIndex,
        toIndex,
      );
    },
    [moveVisible, listed],
  );

  const onSetStatus = useCallback(
    (id: string, status: Status) => update(id, { status }, "now"),
    [update],
  );

  const openIdea = openId ? byId.get(openId) : undefined;
  const empty = EMPTY[section];

  return (
    <div className="st-root flex min-h-dvh bg-st-canvas text-st-text">
      <Sidebar
        section={section}
        counts={counts}
        total={active.length}
        onSelect={setSection}
        onNew={() => setCapturing(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          section={section}
          count={listed.length}
          query={query}
          onQueryChange={setQuery}
          onNew={() => setCapturing(true)}
          saveState={saveState}
          appearance={appearance}
          onAppearanceChange={setAppearance}
          channel={channel}
          channelCounts={channelCounts}
          channelTotal={active.length}
          onChannelChange={setChannel}
        />

        <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 pb-24 sm:px-6">
          <SectionTabs
            section={section}
            counts={counts}
            total={active.length}
            onSelect={setSection}
          />

          <div key={section} className="st-section-enter mt-4">
            {section === "Board" ? (
              <BoardView
                ideas={everything.filter((idea) => matches(idea, query))}
                today={today}
                filtered={searching}
                onOpen={setOpenId}
                onSetStatus={onSetStatus}
              />
            ) : section === "Calendar" ? (
              <CalendarView
                ideas={everything.filter((idea) => matches(idea, query))}
                today={today}
                onOpen={setOpenId}
              />
            ) : (
              <IdeaList
                ideas={listed}
                today={today}
                emptyTitle={searching ? "Nothing matches" : empty.title}
                emptyBody={
                  searching
                    ? "No idea matches that search. Clear it to see this stage again."
                    : empty.body
                }
                reorderable={reorderable}
                onOpen={setOpenId}
                onMove={onMove}
              />
            )}
          </div>
        </main>
      </div>

      {capturing ? (
        <NewIdeaModal
          // Capturing while a brand's tab is open means the idea is for that
          // brand; from All it lands on the first and can be moved.
          channel={channel === "all" ? null : channel}
          onSave={(title) => create(title, channel === "all" ? {} : { channel })}
          onClose={() => setCapturing(false)}
        />
      ) : null}

      <TodoDrawer />

      {openIdea ? (
        <IdeaPage key={openIdea.id} idea={openIdea} today={today} onClose={() => setOpenId(null)} />
      ) : null}
    </div>
  );
}
