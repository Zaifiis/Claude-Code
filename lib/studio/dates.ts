/**
 * Date helpers for Content Studio.
 *
 * Everything here formats from the `YYYY-MM-DD` string itself rather than
 * `toLocaleDateString`, so a server render and a browser render always agree —
 * no hydration mismatch when the server runs in UTC and you don't.
 */

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export { WEEKDAYS_SHORT };

export interface YearMonth {
  year: number;
  /** 1–12. */
  month: number;
}

export function isoFrom(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Today in the viewer's own timezone. */
export function todayISO(now = new Date()): string {
  return isoFrom(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function parseISO(iso: string): { year: number; month: number; day: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** "26 Sep" */
export function formatDayMonth(iso: string): string {
  const parsed = parseISO(iso);
  return parsed ? `${parsed.day} ${MONTHS_SHORT[parsed.month - 1]}` : "";
}

/** "Fri 26 Sep 2026" */
export function formatFullDate(iso: string): string {
  const parsed = parseISO(iso);
  if (!parsed) return "";
  const weekday = WEEKDAYS_SHORT[mondayIndex(parsed.year, parsed.month, parsed.day)];
  return `${weekday} ${parsed.day} ${MONTHS_SHORT[parsed.month - 1]} ${parsed.year}`;
}

/** "September 2026" */
export function formatMonthTitle({ year, month }: YearMonth): string {
  return `${MONTHS_LONG[month - 1]} ${year}`;
}

/** Weekday as 0 = Monday … 6 = Sunday. */
export function mondayIndex(year: number, month: number, day: number): number {
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

export function daysInMonth({ year, month }: YearMonth): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const zeroBased = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
}

export function monthOf(iso: string): YearMonth | null {
  const parsed = parseISO(iso);
  return parsed ? { year: parsed.year, month: parsed.month } : null;
}

/** Whole days from `fromISO` to `toISO`; negative means `toISO` is in the past. */
export function dayDelta(fromISO: string, toISO: string): number | null {
  const from = parseISO(fromISO);
  const to = parseISO(toISO);
  if (!from || !to) return null;
  const a = Date.UTC(from.year, from.month - 1, from.day);
  const b = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((b - a) / 86_400_000);
}

/**
 * "Today", "Tomorrow", "In 4 days", "Overdue" — or null when the date is far
 * enough away that the plain date says it better.
 */
export function relativeLabel(targetISO: string, today: string): string | null {
  const delta = dayDelta(today, targetISO);
  if (delta === null) return null;
  if (delta < 0) return "Overdue";
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta <= 6) return `In ${delta} days`;
  return null;
}

/**
 * A six-week grid covering the month, Monday first. Leading and trailing cells
 * carry the neighbouring months' dates so the grid never jumps height.
 */
export function monthGrid(cursor: YearMonth): Array<{ iso: string; inMonth: boolean }> {
  const lead = mondayIndex(cursor.year, cursor.month, 1);
  const previous = addMonths(cursor, -1);
  const previousLength = daysInMonth(previous);
  const length = daysInMonth(cursor);
  const next = addMonths(cursor, 1);

  const cells: Array<{ iso: string; inMonth: boolean }> = [];
  for (let i = lead; i > 0; i -= 1) {
    cells.push({ iso: isoFrom(previous.year, previous.month, previousLength - i + 1), inMonth: false });
  }
  for (let day = 1; day <= length; day += 1) {
    cells.push({ iso: isoFrom(cursor.year, cursor.month, day), inMonth: true });
  }
  let day = 1;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ iso: isoFrom(next.year, next.month, day), inMonth: false });
    day += 1;
  }
  return cells;
}
