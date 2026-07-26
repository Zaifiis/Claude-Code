import * as React from "react";
import { cn } from "@/lib/utils";
import {
  STATUS_MAP,
  PRIORITY_MAP,
  PLATFORM_MAP,
  FORMAT_MAP,
  type StatusKey,
  type PriorityKey,
  type PlatformKey,
  type FormatKey,
} from "@/lib/domain/constants";
import { PlatformIcon } from "./platform-icon";

const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted whitespace-nowrap";

export function Dot({ color, className }: { color?: string; className?: string }) {
  return (
    <span
      className={cn("inline-block size-1.5 rounded-full shrink-0", className)}
      style={{ backgroundColor: color ?? "var(--faint)" }}
      aria-hidden
    />
  );
}

export function StatusBadge({ status, className }: { status: StatusKey; className?: string }) {
  const s = STATUS_MAP[status];
  return (
    <span className={cn(chip, "text-fg", className)}>
      <Dot color={s?.color} />
      {s?.label ?? status}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: PriorityKey; className?: string }) {
  const p = PRIORITY_MAP[priority];
  return (
    <span className={cn(chip, className)} style={{ color: p?.color }}>
      <Dot color={p?.color} />
      {p?.label ?? priority}
    </span>
  );
}

export function PlatformBadge({
  platform,
  className,
  showLabel = true,
}: {
  platform: PlatformKey;
  className?: string;
  showLabel?: boolean;
}) {
  const p = PLATFORM_MAP[platform];
  return (
    <span className={cn(chip, "text-fg", className)}>
      <PlatformIcon platform={platform} className="size-3.5" />
      {showLabel && (p?.label ?? platform)}
    </span>
  );
}

export function FormatBadge({ format, className }: { format: FormatKey; className?: string }) {
  return <span className={cn(chip, className)}>{FORMAT_MAP[format]?.label ?? format}</span>;
}

export function TagChip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-xs)] bg-surface-2 border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted",
        className,
      )}
    >
      #{label}
    </span>
  );
}
