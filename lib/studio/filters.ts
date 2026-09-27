import type { Idea } from "@/types/studio";

/** Everything written on an idea, flattened for search. */
function searchable(idea: Idea): string {
  return [
    idea.title,
    ...idea.titleOptions,
    ...idea.hooks,
    ...idea.shotIdeas,
    ...idea.inspiration.map((row) => `${row.url} ${row.note}`),
    idea.pillar,
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

/** Every whitespace-separated term has to appear somewhere in the idea. */
export function matches(idea: Idea, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = searchable(idea);
  return terms.every((term) => haystack.includes(term));
}
