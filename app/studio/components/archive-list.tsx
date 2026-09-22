"use client";

import { formatFullDate } from "@/lib/studio/dates";
import { countWords } from "@/lib/studio/script";
import { type Idea, PLATFORM_SHORT } from "@/types/studio";

import { cx, EmptyState, Panel, Tag } from "./ui";

/** Everything that has gone live, newest first. */
export function ArchiveList({
  ideas,
  filtered,
  onOpen,
}: {
  ideas: Idea[];
  filtered: boolean;
  onOpen: (id: string) => void;
}) {
  if (ideas.length === 0) {
    return (
      <EmptyState
        title={filtered ? "Nothing matches" : "Nothing published yet"}
        body={
          filtered
            ? "No published idea matches your search and filters."
            : "When you set an idea's status to Published it leaves the ranked list and lands here, with room for a note on how it did."
        }
      />
    );
  }

  return (
    <Panel className="overflow-hidden">
      <ul>
        {ideas.map((idea, index) => (
          <li key={idea.id}>
            <button
              type="button"
              onClick={() => onOpen(idea.id)}
              className={cx(
                "flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left",
                "transition-colors duration-[var(--st-dur-fast)] ease-st hover:bg-st-fill",
                index > 0 && "border-t border-st-hairline",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="st-headline block truncate text-st-text">
                  {idea.title || "Untitled idea"}
                </span>
                <span className="st-footnote flex items-center gap-2 truncate text-st-text-2">
                  <span className="shrink-0 font-medium">{PLATFORM_SHORT[idea.platform]}</span>
                  {idea.publishedAt ? (
                    <>
                      <span aria-hidden="true" className="text-st-text-3">·</span>
                      <span className="shrink-0">
                        {formatFullDate(idea.publishedAt.slice(0, 10))}
                      </span>
                    </>
                  ) : null}
                  {idea.performanceNote ? (
                    <>
                      <span aria-hidden="true" className="text-st-text-3">·</span>
                      <span className="truncate">{idea.performanceNote}</span>
                    </>
                  ) : null}
                </span>
              </span>

              <span className="hidden shrink-0 items-center gap-2 sm:flex">
                {idea.pillar ? <Tag>{idea.pillar}</Tag> : null}
                {countWords(idea.script) > 0 ? (
                  <Tag>{countWords(idea.script).toLocaleString("en-GB")}w</Tag>
                ) : null}
                {idea.performanceNote ? null : <Tag>Add a performance note</Tag>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
