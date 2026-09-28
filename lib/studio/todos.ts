import { type Todo, TODO_PRIORITIES } from "@/types/studio";

/**
 * Ordering and date reading for to-dos, kept here so the drawer, the sheet
 * and anything added later all agree on what "next" means.
 */

const RANK = new Map(TODO_PRIORITIES.map((priority, index) => [priority, index]));

/**
 * Due today or earlier, and not yet done. `today` comes from the viewer's
 * clock and is null until hydration, when nothing can be called late yet.
 */
export function todoIsOverdue(todo: Todo, today: string | null): boolean {
  return today !== null && !todo.done && todo.due !== "" && todo.due <= today;
}

/**
 * Loudest first, then soonest, then oldest.
 *
 * A dated to-do that is already late outranks its priority: something due
 * yesterday is urgent whatever you labelled it.
 */
export function todoOrder(today: string | null) {
  return (a: Todo, b: Todo): number => {
    const lateA = todoIsOverdue(a, today) ? 0 : 1;
    const lateB = todoIsOverdue(b, today) ? 0 : 1;
    if (lateA !== lateB) return lateA - lateB;

    const rankA = RANK.get(a.priority) ?? RANK.size;
    const rankB = RANK.get(b.priority) ?? RANK.size;
    if (rankA !== rankB) return rankA - rankB;

    // Dated before undated, then by date; an empty string would otherwise sort
    // before every real date.
    if (a.due !== b.due) {
      if (a.due === "") return 1;
      if (b.due === "") return -1;
      return a.due < b.due ? -1 : 1;
    }

    if (a.dueTime !== b.dueTime) {
      if (a.dueTime === "") return 1;
      if (b.dueTime === "") return -1;
      return a.dueTime < b.dueTime ? -1 : 1;
    }

    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  };
}

/**
 * "Today", "Tomorrow", "Late · Fri 26 Sep", or "" when it has no date. Times
 * are appended only when one was set.
 */
export function todoDueLabel(todo: Todo, today: string | null): string {
  if (todo.due === "") return "";

  const [y, m, d] = todo.due.split("-").map(Number);
  const due = new Date(y, m - 1, d);

  // Before hydration the viewer's date is unknown, and "Today" rendered
  // against a server clock would disagree with the browser.
  const absolute = due.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  if (today === null) return absolute + (todo.dueTime === "" ? "" : ` ${formatTime(todo.dueTime)}`);

  const [ty, tm, td] = today.split("-").map(Number);
  const days = Math.round((due.getTime() - new Date(ty, tm - 1, td).getTime()) / 86_400_000);

  const when =
    days === 0 ? "Today" : days === 1 ? "Tomorrow" : days === -1 ? "Yesterday" : absolute;

  const time = todo.dueTime === "" ? "" : ` ${formatTime(todo.dueTime)}`;
  const late = !todo.done && todo.due < today ? "Late · " : "";

  return `${late}${when}${time}`;
}

function formatTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const at = new Date();
  at.setHours(hours, minutes, 0, 0);
  return at.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
