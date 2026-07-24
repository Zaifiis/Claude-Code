import Link from "next/link";
import { getContentItems, getPlatforms } from "@/lib/data";
import type { ContentItem } from "@/types/db";

function itemDate(item: ContentItem): string | null {
  return item.scheduled_for ?? (item.posted_at ? item.posted_at.slice(0, 10) : null);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const now = new Date();
  const [year, monthIndex] = month
    ? month.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const first = new Date(year, monthIndex - 1, 1);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const startWeekday = first.getDay();

  const prev = new Date(year, monthIndex - 2, 1);
  const next = new Date(year, monthIndex, 1);

  const [items, platforms] = await Promise.all([getContentItems(), getPlatforms()]);
  const platformById = new Map(platforms.map((p) => [p.id, p]));

  const byDate = new Map<string, ContentItem[]>();
  for (const item of items) {
    const date = itemDate(item);
    if (!date) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(item);
  }

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">Calendar</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Scheduled and posted content across every platform.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={`/calendar?month=${prev.getFullYear()}-${prev.getMonth() + 1}`}
            className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800"
          >
            &larr;
          </Link>
          <span className="w-36 text-center text-neutral-200">{monthLabel}</span>
          <Link
            href={`/calendar?month=${next.getFullYear()}-${next.getMonth() + 1}`}
            className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800"
          >
            &rarr;
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-neutral-800 bg-neutral-800">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-neutral-900 px-2 py-2 text-center text-xs text-neutral-500">
            {d}
          </div>
        ))}
        {cells.map((day, idx) => {
          const dateKey = day
            ? `${year}-${String(monthIndex).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : null;
          const dayItems = dateKey ? byDate.get(dateKey) ?? [] : [];
          return (
            <div key={idx} className="min-h-24 bg-neutral-950 p-2">
              {day && <p className="text-xs text-neutral-500">{day}</p>}
              <div className="mt-1 space-y-1">
                {dayItems.map((item) => (
                  <div
                    key={item.id}
                    title={item.title ?? ""}
                    className={`truncate rounded px-1.5 py-0.5 text-[11px] ${
                      item.status === "Posted"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-sky-500/10 text-sky-400"
                    }`}
                  >
                    {platformById.get(item.platform_id)?.display_name ?? "?"} ·{" "}
                    {item.title ?? "(untitled)"}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
