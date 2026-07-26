"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { Dot } from "@/components/ui/badges";
import { STATUSES, STATUS_MAP, type StatusKey } from "@/lib/domain/constants";
import { cn } from "@/lib/utils";

export function StatusPicker({
  status,
  onChange,
  className,
}: {
  status: StatusKey;
  onChange: (s: StatusKey) => void;
  className?: string;
}) {
  const meta = STATUS_MAP[status];
  return (
    <Dropdown
      align="start"
      className={className}
      contentClassName="w-[220px]"
      trigger={
        <button className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-left text-[13px] font-medium text-fg transition-colors hover:border-border-strong">
          <Dot color={meta?.color} />
          <span className="flex-1">{meta?.label}</span>
          <ChevronDown className="size-3.5 text-faint" />
        </button>
      }
    >
      {(close) => (
        <div className="max-h-[320px] overflow-y-auto">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                onChange(s.key);
                close();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[var(--radius-xs)] px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-surface-2",
                s.key === status ? "text-fg" : "text-muted",
              )}
            >
              <Dot color={s.color} />
              <span className="flex-1">{s.label}</span>
              {s.key === status && <Check className="size-3.5 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
