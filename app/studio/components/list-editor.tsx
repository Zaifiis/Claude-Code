"use client";

import type { Inspiration } from "@/types/studio";

import { CloseIcon, PlusIcon } from "./icons";
import { Button, IconButton, TextInput } from "./ui";

/**
 * A list of one-line entries — hooks, shot ideas, title options. Blank rows are
 * kept on screen while you type and dropped when the idea is saved.
 */
export function ListEditor({
  rows,
  onChange,
  label,
  placeholder,
  addLabel,
}: {
  rows: string[];
  onChange: (next: string[]) => void;
  label: string;
  placeholder: string;
  addLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <TextInput
            value={row}
            aria-label={`${label} ${index + 1}`}
            placeholder={placeholder}
            onChange={(event) =>
              onChange(rows.map((current, i) => (i === index ? event.target.value : current)))
            }
          />
          <IconButton
            label={`Remove ${label.toLowerCase()} ${index + 1}`}
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <CloseIcon className="h-4 w-4" />
          </IconButton>
        </div>
      ))}

      <Button variant="plain" className="justify-start px-3" onClick={() => onChange([...rows, ""])}>
        <PlusIcon className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}

/** Reference links: the reel, plus a note on what to take from it. */
export function InspirationEditor({
  rows,
  onChange,
}: {
  rows: Inspiration[];
  onChange: (next: Inspiration[]) => void;
}) {
  const set = (index: number, patch: Partial<Inspiration>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-st-card bg-st-surface-2 p-3">
          <div className="flex items-center gap-2">
            <TextInput
              value={row.url}
              type="url"
              inputMode="url"
              aria-label={`Reference link ${index + 1}`}
              placeholder="Paste a link to the reel"
              onChange={(event) => set(index, { url: event.target.value })}
              className="bg-st-surface"
            />
            <IconButton
              label={`Remove reference ${index + 1}`}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              <CloseIcon className="h-4 w-4" />
            </IconButton>
          </div>

          <TextInput
            value={row.note}
            aria-label={`What to take from reference ${index + 1}`}
            placeholder="What to take from it"
            onChange={(event) => set(index, { note: event.target.value })}
            className="bg-st-surface"
          />

          {isOpenable(row.url) ? (
            <a
              href={row.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-9 items-center self-start rounded-st-control px-2 st-footnote font-medium text-st-teal transition-colors duration-[var(--st-dur-fast)] ease-st hover:bg-st-teal-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent"
            >
              Open the reel ↗
            </a>
          ) : null}
        </div>
      ))}

      <Button
        variant="plain"
        className="justify-start px-3"
        onClick={() => onChange([...rows, { url: "", note: "" }])}
      >
        <PlusIcon className="h-4 w-4" />
        Add a reference
      </Button>
    </div>
  );
}

/** Only http(s) links are offered as openable, so a typo cannot become javascript:. */
function isOpenable(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
