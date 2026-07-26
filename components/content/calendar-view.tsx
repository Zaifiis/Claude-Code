"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { STATUS_MAP } from "@/lib/domain/constants";
import { setScheduleAction } from "@/lib/actions/content";
import { cn } from "@/lib/utils";
import type { ContentRecord } from "@/lib/db/types";

interface Ev {
  item: ContentRecord;
  date: Date;
  draggable: boolean;
}

function eventFor(item: ContentRecord): Ev | null {
  const iso = item.scheduled_at ?? item.published_at;
  if (!iso) return null;
  return { item, date: parseISO(iso), draggable: item.status !== "posted" };
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ items }: { items: ContentRecord[] }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"month" | "week">("month");
  const [cursor, setCursor] = React.useState(() => new Date());
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const events = React.useMemo(
    () => items.map(eventFor).filter((e): e is Ev => e !== null),
    [items],
  );

  const days = React.useMemo(() => {
    if (mode === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 0 });
      const end = endOfWeek(cursor, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor, mode]);

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, Ev[]>();
    for (const e of events) {
      const key = format(e.date, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const activeEvent = activeId ? events.find((e) => e.item.id === activeId) ?? null : null;

  const onDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const id = e.active.id as string;
    const overDay = e.over?.id as string | undefined;
    if (!overDay) return;
    const ev = events.find((x) => x.item.id === id);
    if (!ev) return;
    if (format(ev.date, "yyyy-MM-dd") === overDay) return;
    const [y, m, d] = overDay.split("-").map(Number);
    const next = new Date(ev.date);
    next.setFullYear(y, m - 1, d);
    toast.success(`Rescheduled to ${format(next, "MMM d")}`);
    setScheduleAction(id, next.toISOString()).then(() => router.refresh());
  };

  const title = mode === "month" ? format(cursor, "MMMM yyyy") : `Week of ${format(startOfWeek(cursor, { weekStartsOn: 0 }), "MMM d")}`;
  const step = (dir: number) => setCursor((c) => (mode === "month" ? addMonths(c, dir) : addWeeks(c, dir)));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => step(-1)} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => step(1)} aria-label="Next">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <h2 className="ml-1 text-[15px] font-semibold text-fg">{title}</h2>
        </div>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "month", label: "Month" },
            { value: "week", label: "Week" },
          ]}
        />
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <div className="grid grid-cols-7 border-b border-border bg-surface-2/50">
            {DOW.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-faint">
                {d}
              </div>
            ))}
          </div>
          <div className={cn("grid grid-cols-7", mode === "week" && "min-h-[420px]")}>
            {days.map((day) => (
              <DayCell
                key={day.toISOString()}
                day={day}
                inMonth={mode === "week" || isSameMonth(day, cursor)}
                events={eventsByDay.get(format(day, "yyyy-MM-dd")) ?? []}
                tall={mode === "week"}
              />
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeEvent ? <EventChip ev={activeEvent} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function DayCell({ day, inMonth, events, tall }: { day: Date; inMonth: boolean; events: Ev[]; tall: boolean }) {
  const id = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({ id });
  const today = isToday(day);
  const shown = events.slice(0, tall ? 12 : 3);
  const extra = events.length - shown.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[104px] flex-col gap-1 border-b border-r border-border p-1.5 transition-colors [&:nth-child(7n)]:border-r-0",
        tall && "min-h-[420px]",
        !inMonth && "bg-surface-2/30",
        isOver && "bg-accent-soft/50",
      )}
    >
      <div className="flex items-center justify-between px-0.5">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-[12px] font-medium tabular-nums",
            today ? "bg-accent text-accent-fg" : inMonth ? "text-fg" : "text-faint",
          )}
        >
          {format(day, "d")}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {shown.map((ev) => (
          <DraggableChip key={ev.item.id} ev={ev} />
        ))}
        {extra > 0 && <span className="px-1 text-[11px] text-faint">+{extra} more</span>}
      </div>
    </div>
  );
}

function DraggableChip({ ev }: { ev: Ev }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ev.item.id,
    disabled: !ev.draggable,
  });
  return (
    <div
      ref={setNodeRef}
      {...(ev.draggable ? { ...listeners, ...attributes } : {})}
      className={cn("touch-none", isDragging && "opacity-40")}
    >
      <EventChip ev={ev} />
    </div>
  );
}

function EventChip({ ev, overlay = false }: { ev: Ev; overlay?: boolean }) {
  const router = useRouter();
  const color = STATUS_MAP[ev.item.status]?.color;
  return (
    <button
      onClick={() => router.push(`/content/${ev.item.id}`)}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-[var(--radius-xs)] border border-border bg-surface px-1.5 py-1 text-left transition-colors hover:bg-surface-2",
        ev.draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        overlay && "cursor-grabbing shadow-pop",
      )}
      style={{ borderLeft: `2px solid ${color}` }}
    >
      <PlatformIcon platform={ev.item.platform} className="size-3 shrink-0 text-muted" />
      <span className="truncate text-[11.5px] font-medium text-fg">{ev.item.title}</span>
    </button>
  );
}
