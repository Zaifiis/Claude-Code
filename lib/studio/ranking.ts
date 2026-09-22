/**
 * Pure ordering and archiving rules for Content Studio.
 *
 * The server store and the client state both apply these, so an optimistic
 * reorder on screen matches exactly what ends up in the data file.
 */

import { DONE_STATUS, type Idea } from "@/types/studio";

/** Rank given to archived cards; they are not part of the make-next order. */
export const UNRANKED = Number.MAX_SAFE_INTEGER;

/** Active ideas in make-next order: rank first, oldest first on a tie. */
export function sortActive(ideas: Idea[]): Idea[] {
  return ideas
    .filter((idea) => !idea.archived)
    .sort((a, b) => a.rank - b.rank || a.createdAt.localeCompare(b.createdAt));
}

/** Archived ideas, most recently published first. */
export function sortArchived(ideas: Idea[]): Idea[] {
  return ideas
    .filter((idea) => idea.archived)
    .sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
}

/**
 * Rewrites active ranks to a dense 0..n-1 sequence, so "first, second, third"
 * always reads true and no drag can drift the numbering.
 */
export function normaliseRanks(ideas: Idea[]): Idea[] {
  const rankById = new Map(sortActive(ideas).map((idea, index) => [idea.id, index]));
  return ideas.map((idea) => {
    const rank = rankById.get(idea.id);
    return rank === undefined ? { ...idea, rank: UNRANKED } : { ...idea, rank };
  });
}

/**
 * Publishing archives a card, which is what takes it out of the ranked list;
 * moving it back out of Published un-archives it and sends it to the bottom.
 */
export function syncArchiveState(idea: Idea, wasArchived: boolean, now = new Date()): Idea {
  const shouldArchive = idea.status === DONE_STATUS;
  if (shouldArchive === wasArchived) return idea;
  return shouldArchive
    ? { ...idea, archived: true, publishedAt: now.toISOString() }
    : { ...idea, archived: false, publishedAt: null, rank: UNRANKED };
}

/**
 * Applies a new make-next order. Active ideas missing from `orderedIds` keep
 * their relative place after the ones that are listed.
 */
export function applyOrder(ideas: Idea[], orderedIds: string[]): Idea[] {
  const positionById = new Map<string, number>();
  orderedIds.forEach((id, index) => {
    if (!positionById.has(id)) positionById.set(id, index);
  });

  // Normalise first so unlisted ranks are dense and can't overflow the tail.
  const tail = orderedIds.length;
  return normaliseRanks(
    normaliseRanks(ideas).map((idea) => {
      if (idea.archived) return idea;
      const position = positionById.get(idea.id);
      return position === undefined
        ? { ...idea, rank: tail + idea.rank }
        : { ...idea, rank: position };
    }),
  );
}

/**
 * Translates a drag inside a *filtered* list back onto the full make-next
 * order: the visible cards take each other's slots, and everything filtered
 * out keeps its absolute position.
 */
export function reorderVisible(
  fullIds: string[],
  visibleIds: string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (fromIndex === toIndex) return fullIds;

  const nextVisible = [...visibleIds];
  const [moved] = nextVisible.splice(fromIndex, 1);
  if (moved === undefined) return fullIds;
  nextVisible.splice(toIndex, 0, moved);

  const visible = new Set(visibleIds);
  const result = [...fullIds];
  let taken = 0;
  fullIds.forEach((id, slot) => {
    if (!visible.has(id)) return;
    result[slot] = nextVisible[taken];
    taken += 1;
  });

  return result;
}
