"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add tag…",
  className,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = React.useState("");

  const add = (raw: string) => {
    const t = raw.trim().replace(/^#/, "");
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  const filtered = suggestions
    .filter((s) => !value.includes(s) && s.toLowerCase().includes(draft.toLowerCase()))
    .slice(0, 6);

  return (
    <div className={cn("group", className)}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1.5 focus-within:border-accent transition-colors">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] bg-surface-2 border border-border px-1.5 py-0.5 text-[12px] font-medium text-fg"
          >
            #{t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="text-faint hover:text-danger transition-colors"
              aria-label={`Remove ${t}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[80px] flex-1 bg-transparent px-1 py-0.5 text-sm text-fg placeholder:text-faint focus:outline-none"
        />
      </div>
      {draft && filtered.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-[var(--radius-xs)] border border-border bg-surface-2 px-1.5 py-0.5 text-[12px] text-muted hover:text-fg hover:border-border-strong transition-colors"
            >
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
