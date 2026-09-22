"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { countWords, type InlineSpan, parseScript, speakingMinutes } from "@/lib/studio/script";

import { BulletIcon, EyeIcon, HeadingIcon, PencilIcon } from "./icons";
import { cx } from "./ui";

/** Strips any existing block marker so toggles never stack up. */
const BLOCK_MARKER = /^(\s*)(#{1,6}\s+|[-*+]\s+)?/;
const BULLET_LINE = /^(\s*)([-*+])\s+(.*)$/;

interface Edit {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

function lineBounds(value: string, from: number, to: number): [number, number] {
  const start = value.lastIndexOf("\n", from - 1) + 1;
  const lineEnd = value.indexOf("\n", to);
  return [start, lineEnd === -1 ? value.length : lineEnd];
}

/** Adds `prefix` to every selected line, or strips it when all lines have it. */
function toggleBlockPrefix(value: string, from: number, to: number, prefix: string): Edit {
  const [start, end] = lineBounds(value, from, to);
  const lines = value.slice(start, end).split("\n");
  const allPrefixed = lines.every((line) => line.trimStart().startsWith(prefix));

  const next = lines
    .map((line) => {
      const bare = line.replace(BLOCK_MARKER, "$1");
      return allPrefixed ? bare : bare.replace(/^(\s*)/, `$1${prefix}`);
    })
    .join("\n");

  return {
    value: value.slice(0, start) + next + value.slice(end),
    selectionStart: start,
    selectionEnd: start + next.length,
  };
}

/** Enter inside a bullet continues the list; Enter on an empty bullet ends it. */
function continueList(value: string, caret: number): Edit | null {
  const [start] = lineBounds(value, caret, caret);
  const match = BULLET_LINE.exec(value.slice(start, caret));
  if (!match) return null;

  const [, indent, marker, content] = match;

  if (content.trim() === "") {
    const next = `${value.slice(0, start)}${value.slice(caret)}`;
    return { value: next, selectionStart: start, selectionEnd: start };
  }

  const insertion = `\n${indent}${marker} `;
  const caretAfter = caret + insertion.length;
  return {
    value: value.slice(0, caret) + insertion + value.slice(caret),
    selectionStart: caretAfter,
    selectionEnd: caretAfter,
  };
}

export function ScriptEditor({
  value,
  onChange,
  wordCountId,
}: {
  value: string;
  onChange: (next: string) => void;
  wordCountId?: string;
}) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  const words = countWords(value);

  // Grow with the text so the writing area never has a scrollbar of its own.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || preview) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value, preview]);

  // Restore the caret after an edit that rewrote the text around it. This runs
  // before paint so a fast typist can never land a key on the old position.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const selection = pendingSelection.current;
    if (!textarea || !selection) return;
    pendingSelection.current = null;
    textarea.setSelectionRange(selection.start, selection.end);
  }, [value]);

  const apply = useCallback(
    (edit: Edit | null) => {
      if (!edit) return;
      pendingSelection.current = { start: edit.selectionStart, end: edit.selectionEnd };
      onChange(edit.value);
    },
    [onChange],
  );

  const togglePrefix = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      apply(toggleBlockPrefix(value, textarea.selectionStart, textarea.selectionEnd, prefix));
    },
    [apply, value],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = event.currentTarget;
      const shortcut = event.metaKey || event.ctrlKey;

      if (event.key === "Enter" && !event.shiftKey && !shortcut) {
        const edit = continueList(value, textarea.selectionStart);
        if (edit && textarea.selectionStart === textarea.selectionEnd) {
          event.preventDefault();
          apply(edit);
        }
        return;
      }

      if (!shortcut) return;

      if (event.altKey && event.key === "1") {
        event.preventDefault();
        togglePrefix("## ");
      } else if (event.altKey && event.key === "2") {
        event.preventDefault();
        togglePrefix("### ");
      } else if (event.shiftKey && (event.key === "8" || event.key === "*")) {
        event.preventDefault();
        togglePrefix("- ");
      }
    },
    [apply, togglePrefix, value],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ToolbarButton label="Heading" onClick={() => togglePrefix("## ")} disabled={preview}>
          <HeadingIcon className="h-4 w-4" />
          <span>Heading</span>
        </ToolbarButton>
        <ToolbarButton label="Subheading" onClick={() => togglePrefix("### ")} disabled={preview}>
          <HeadingIcon className="h-3.5 w-3.5" />
          <span>Subheading</span>
        </ToolbarButton>
        <ToolbarButton label="Bullet list" onClick={() => togglePrefix("- ")} disabled={preview}>
          <BulletIcon className="h-4 w-4" />
          <span>Bullets</span>
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-4">
          <p id={wordCountId} className="st-footnote st-tabular text-st-text-2" aria-live="polite">
            {words.toLocaleString("en-GB")} {words === 1 ? "word" : "words"}
            <span className="text-st-text-3"> · {speakingMinutes(words)}</span>
          </p>
          <ToolbarButton
            label={preview ? "Back to writing" : "Preview formatting"}
            onClick={() => setPreview((current) => !current)}
            active={preview}
          >
            {preview ? <PencilIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            <span>{preview ? "Write" : "Preview"}</span>
          </ToolbarButton>
        </div>
      </div>

      {preview ? (
        <ScriptPreview script={value} />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          spellCheck
          placeholder={"Write the script.\n\n## Use a heading for each beat\n- and bullets for the lines you want to hit"}
          aria-label="Script"
          aria-describedby={wordCountId}
          className={cx(
            "st-measure w-full resize-none border-0 bg-transparent p-0 outline-none",
            "text-[17px] leading-[1.65] tracking-[-0.004em] text-st-text placeholder:text-st-text-3",
            "min-h-[40vh]",
          )}
        />
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  children,
  active = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cx(
        "inline-flex min-h-11 items-center gap-1.5 rounded-st-control px-3 st-footnote font-medium",
        "transition-colors duration-[var(--st-dur-fast)] ease-st",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
        "disabled:pointer-events-none disabled:opacity-40",
        active ? "bg-st-accent-soft text-st-accent" : "text-st-text-2 hover:bg-st-fill hover:text-st-text",
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Inline({ spans }: { spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((span, index) =>
        span.bold ? (
          <strong key={index} className="font-semibold">
            {span.text}
          </strong>
        ) : span.italic ? (
          <em key={index}>{span.text}</em>
        ) : (
          <span key={index}>{span.text}</span>
        ),
      )}
    </>
  );
}

/** Renders the script's headings and bullets, straight from the Markdown. */
export function ScriptPreview({ script }: { script: string }) {
  const blocks = parseScript(script);

  if (blocks.length === 0) {
    return <p className="st-body text-st-text-3">Nothing written yet.</p>;
  }

  return (
    <div className="st-measure flex flex-col gap-4">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          const className =
            block.level === 1 ? "st-title-2" : block.level === 2 ? "st-title-3" : "st-headline";
          const Tag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
          return (
            <Tag key={index} className={cx(className, "text-st-text")}>
              <Inline spans={block.spans} />
            </Tag>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={index} className="flex flex-col gap-2 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="list-disc text-[17px] leading-[1.65] text-st-text">
                  <Inline spans={item} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="text-[17px] leading-[1.65] text-st-text">
            <Inline spans={block.spans} />
          </p>
        );
      })}
    </div>
  );
}
