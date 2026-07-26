"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, Link2, GripVertical } from "lucide-react";
import { STATUSES, STATUS_MAP, PLATFORM_MAP, type StatusKey } from "@/lib/domain/constants";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { FormatBadge, Dot } from "@/components/ui/badges";
import { Thumbnail } from "@/components/ui/thumbnail";
import { setStatusAction } from "@/lib/actions/content";
import { formatDate, cn } from "@/lib/utils";
import type { ContentRecord } from "@/lib/db/types";

type Columns = Record<StatusKey, ContentRecord[]>;

function buildColumns(items: ContentRecord[]): Columns {
  const cols = Object.fromEntries(STATUSES.map((s) => [s.key, [] as ContentRecord[]])) as Columns;
  for (const item of items) {
    (cols[item.status] ?? cols.idea).push(item);
  }
  return cols;
}

export function KanbanBoard({ items }: { items: ContentRecord[] }) {
  const router = useRouter();
  const [columns, setColumns] = React.useState<Columns>(() => buildColumns(items));
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const originRef = React.useRef<StatusKey | null>(null);

  // Re-sync when server data changes (after revalidation).
  React.useEffect(() => {
    setColumns(buildColumns(items));
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findContainer = (id: string): StatusKey | null => {
    if (id in columns) return id as StatusKey;
    for (const key of Object.keys(columns) as StatusKey[]) {
      if (columns[key].some((c) => c.id === id)) return key;
    }
    return null;
  };

  const activeItem = activeId
    ? Object.values(columns).flat().find((c) => c.id === activeId) ?? null
    : null;

  const onDragStart = (e: DragStartEvent) => {
    const id = e.active.id as string;
    setActiveId(id);
    originRef.current = findContainer(id);
  };

  const onDragOver = (e: DragOverEvent) => {
    const activeId = e.active.id as string;
    const overId = e.over?.id as string | undefined;
    if (!overId) return;
    const from = findContainer(activeId);
    const to = findContainer(overId);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const fromItems = prev[from];
      const toItems = prev[to];
      const moving = fromItems.find((c) => c.id === activeId);
      if (!moving) return prev;
      const overIndex = toItems.findIndex((c) => c.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : toItems.length;
      return {
        ...prev,
        [from]: fromItems.filter((c) => c.id !== activeId),
        [to]: [...toItems.slice(0, insertAt), moving, ...toItems.slice(insertAt)],
      };
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const id = e.active.id as string;
    setActiveId(null);
    const dest = findContainer(id);
    const origin = originRef.current;
    originRef.current = null;
    if (dest && origin && dest !== origin) {
      const label = STATUS_MAP[dest]?.label ?? dest;
      toast.success(`Moved to ${label}`);
      setStatusAction(id, dest).then(() => router.refresh());
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUSES.map((s) => (
          <Column key={s.key} status={s.key} items={columns[s.key]} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.16,1,0.3,1)" }}>
        {activeItem ? <KanbanCard content={activeItem} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ status, items }: { status: StatusKey; items: ContentRecord[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_MAP[status];
  return (
    <div className="flex w-[286px] shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Dot color={meta?.color} />
        <h3 className="text-[13px] font-semibold text-fg">{meta?.label}</h3>
        <span className="rounded-full bg-surface-2 px-1.5 text-[11px] font-medium text-faint tabular-nums">
          {items.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-[var(--radius-md)] border border-dashed border-transparent p-1.5 transition-colors",
          isOver ? "border-accent/40 bg-accent-soft/40" : "bg-surface-2/40",
        )}
      >
        <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {items.map((c) => (
            <SortableCard key={c.id} content={c} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <p className="px-2 py-4 text-center text-[11px] text-faint">Drop here</p>
        )}
      </div>
    </div>
  );
}

function SortableCard({ content }: { content: ContentRecord }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: content.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <KanbanCard content={content} />
    </div>
  );
}

function KanbanCard({ content, overlay = false }: { content: ContentRecord; overlay?: boolean }) {
  const router = useRouter();
  const platform = PLATFORM_MAP[content.platform];
  const preview = content.thumbnail_url ?? content.references.find((r) => r.thumbnail_url)?.thumbnail_url ?? null;
  const priorityColor = { low: "#8b8d98", medium: "#3b82f6", high: "#f59e0b", urgent: "#ef4444" }[content.priority];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/content/${content.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/content/${content.id}`);
      }}
      className={cn(
        "group cursor-grab select-none rounded-[var(--radius-md)] border border-border bg-surface p-2.5 shadow-xs transition-shadow active:cursor-grabbing",
        overlay ? "cursor-grabbing rotate-1 shadow-pop" : "hover:shadow-md",
      )}
      style={{ borderLeft: `2px solid ${priorityColor}` }}
    >
      {preview && (
        <div className="mb-2 aspect-[16/9] overflow-hidden rounded-[var(--radius-xs)] bg-surface-2">
          <Thumbnail src={preview} platform={content.platform} />
        </div>
      )}
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-muted" style={{ color: platform?.color }}>
          <PlatformIcon platform={content.platform} className="size-3.5" />
        </span>
        <p className="line-clamp-2 flex-1 text-[13px] font-medium leading-snug text-fg">{content.title}</p>
        <GripVertical className="size-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <FormatBadge format={content.format} />
        {content.scheduled_at ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-faint">
            <CalendarClock className="size-3" />
            {formatDate(content.scheduled_at, { month: "short", day: "numeric" })}
          </span>
        ) : content.references.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-faint">
            <Link2 className="size-3" />
            {content.references.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
