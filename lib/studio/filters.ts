import type { Idea, Platform, Status } from "@/types/studio";

export interface Filters {
  /** Free text, matched across every written field of an idea. */
  query: string;
  platform: Platform | "all";
  pillar: string | "all";
  status: Status | "all";
}

export const NO_FILTERS: Filters = {
  query: "",
  platform: "all",
  pillar: "all",
  status: "all",
};

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.platform !== "all" ||
    filters.pillar !== "all" ||
    filters.status !== "all"
  );
}

/** Search covers the title, script and caption, plus every other written field. */
function searchable(idea: Idea): string {
  return [
    idea.title,
    ...idea.titleOptions,
    idea.pillar,
    idea.hook,
    idea.thumbnailIdea,
    idea.script,
    idea.caption,
    idea.notes,
    idea.owner,
    idea.performanceNote,
  ]
    .join("\n")
    .toLowerCase();
}

export function matches(idea: Idea, filters: Filters): boolean {
  if (filters.platform !== "all" && idea.platform !== filters.platform) return false;
  if (filters.status !== "all" && idea.status !== filters.status) return false;
  if (filters.pillar !== "all" && idea.pillar.trim() !== filters.pillar) return false;

  const query = filters.query.trim().toLowerCase();
  if (query === "") return true;

  // Every whitespace-separated term has to appear somewhere in the idea.
  const haystack = searchable(idea);
  return query.split(/\s+/).every((term) => haystack.includes(term));
}
