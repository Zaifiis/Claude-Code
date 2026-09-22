"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { formatFullDate, relativeLabel } from "@/lib/studio/dates";
import { type Idea, PLATFORMS, STATUSES } from "@/types/studio";

import { ArrowUpIcon, ChevronLeftIcon, CloseIcon, ExpandIcon, PlusIcon, TrashIcon } from "./icons";
import { ScriptEditor } from "./script-editor";
import { useStudio } from "../studio-store";
import { Button, cx, Field, FieldGroup, IconButton, Panel, Select, Tag, TextArea, TextInput } from "./ui";

const DELETE_CONFIRM_TIMEOUT = 4000;

/** A textarea that grows with its content, for fields that must not scroll. */
function AutoTextArea({
  value,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return <textarea ref={ref} value={value} rows={1} className={cx("resize-none", className)} {...props} />;
}

export function IdeaSheet({
  idea,
  position,
  total,
  today,
  onClose,
}: {
  idea: Idea;
  /** 1-based place in the make-next order, or null once archived. */
  position: number | null;
  total: number;
  today: string | null;
  onClose: () => void;
}) {
  const { update, moveToTop, remove, pillars, flush } = useStudio();
  const [focusMode, setFocusMode] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const set = useCallback(
    (patch: Parameters<typeof update>[1], when?: "debounced" | "now") => update(idea.id, patch, when),
    [idea.id, update],
  );

  const close = useCallback(() => {
    flush();
    onClose();
  }, [flush, onClose]);

  // Escape steps back out of the writing view; the page behind stays put.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (focusMode) {
        setFocusMode(false);
        return;
      }
      close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, focusMode]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    containerRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), DELETE_CONFIRM_TIMEOUT);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  const overdue = idea.targetDate && today ? relativeLabel(idea.targetDate, today) : null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={idea.title || "Untitled idea"}
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-st-canvas outline-none"
    >
      <header className="st-glass sticky top-0 z-10 border-b border-st-hairline">
        <div className="mx-auto flex w-full max-w-[1120px] items-center gap-2 px-2 py-2 sm:px-4">
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-11 items-center gap-1 rounded-st-control pr-3 pl-1 st-callout font-medium text-st-accent transition-colors duration-[var(--st-dur-fast)] ease-st hover:bg-st-fill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            <span>All ideas</span>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <IconButton
              label={focusMode ? "Show all fields" : "Focus on the script"}
              active={focusMode}
              onClick={() => setFocusMode((current) => !current)}
            >
              {focusMode ? <CloseIcon className="h-5 w-5" /> : <ExpandIcon className="h-5 w-5" />}
            </IconButton>
            {confirmingDelete ? (
              <Button
                variant="tinted"
                onClick={() => {
                  remove(idea.id);
                  onClose();
                }}
              >
                Delete for good
              </Button>
            ) : (
              <IconButton label="Delete this idea" onClick={() => setConfirmingDelete(true)}>
                <TrashIcon className="h-5 w-5" />
              </IconButton>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1120px] px-4 pt-6 pb-24 sm:px-6">
        {!focusMode ? (
          <div className="flex flex-col gap-4">
            <AutoTextArea
              value={idea.title}
              onChange={(event) => set({ title: event.target.value })}
              placeholder="Untitled idea"
              aria-label="Idea title"
              className="st-title-1 w-full border-0 bg-transparent p-0 text-st-text outline-none placeholder:text-st-text-3"
            />

            <div className="flex flex-wrap items-center gap-2">
              {position === null ? (
                <Tag>Archived · published</Tag>
              ) : (
                <Tag tone={position === 1 ? "accent" : "neutral"}>
                  {position === 1 ? "Next up" : `#${position} of ${total} to make`}
                </Tag>
              )}
              {position !== null && position > 1 ? (
                <Button variant="plain" className="px-3" onClick={() => moveToTop(idea.id)}>
                  <ArrowUpIcon className="h-4 w-4" />
                  Move to top
                </Button>
              ) : null}
              {idea.targetDate ? (
                <Tag>
                  {overdue ? `${overdue} · ` : ""}
                  {formatFullDate(idea.targetDate)}
                </Tag>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          className={cx(
            "mt-8 grid gap-8",
            !focusMode && "lg:grid-cols-[minmax(0,1fr)_320px]",
          )}
        >
          <div className="flex min-w-0 flex-col gap-8">
            {!focusMode ? (
              <Panel className="p-6">
                <Field label="Hook / opening line">
                  <AutoTextArea
                    value={idea.hook}
                    onChange={(event) => set({ hook: event.target.value })}
                    placeholder="The first sentence that stops the scroll."
                    className="st-title-3 w-full border-0 bg-transparent p-0 text-st-text outline-none placeholder:text-st-text-3"
                  />
                </Field>
              </Panel>
            ) : null}

            <Panel className={cx("p-6", focusMode && "mx-auto w-full max-w-[760px] sm:p-10")}>
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="st-caption text-st-text-3">Script</h2>
                  {focusMode ? (
                    <Button variant="plain" className="px-3" onClick={() => setFocusMode(false)}>
                      Show all fields
                    </Button>
                  ) : null}
                </div>
                <ScriptEditor
                  value={idea.script}
                  onChange={(script) => set({ script })}
                  wordCountId={`word-count-${idea.id}`}
                />
              </div>
            </Panel>

            {!focusMode ? (
              <Panel className="p-6">
                <Field
                  label="Caption"
                  hint={`${idea.caption.length.toLocaleString("en-GB")} characters`}
                >
                  <TextArea
                    value={idea.caption}
                    onChange={(event) => set({ caption: event.target.value })}
                    rows={6}
                    placeholder="The caption that goes out with the post."
                  />
                </Field>
              </Panel>
            ) : null}
          </div>

          {!focusMode ? (
            <aside className="flex min-w-0 flex-col gap-6">
              <Panel className="flex flex-col gap-6 p-6">
                <Field label="Platform" htmlFor={`platform-${idea.id}`}>
                  <Select
                    id={`platform-${idea.id}`}
                    value={idea.platform}
                    onChange={(event) =>
                      set({ platform: event.target.value as Idea["platform"] }, "now")
                    }
                  >
                    {PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Status"
                  htmlFor={`status-${idea.id}`}
                  hint="Marking it Published moves it into the archive."
                >
                  <Select
                    id={`status-${idea.id}`}
                    value={idea.status}
                    onChange={(event) => set({ status: event.target.value as Idea["status"] }, "now")}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Content pillar" htmlFor={`pillar-${idea.id}`}>
                  <TextInput
                    id={`pillar-${idea.id}`}
                    value={idea.pillar}
                    list={`pillars-${idea.id}`}
                    onChange={(event) => set({ pillar: event.target.value })}
                    placeholder="e.g. Build in public"
                  />
                  <datalist id={`pillars-${idea.id}`}>
                    {pillars.map((pillar) => (
                      <option key={pillar} value={pillar} />
                    ))}
                  </datalist>
                </Field>

                <Field label="Target publish date" htmlFor={`date-${idea.id}`}>
                  <TextInput
                    id={`date-${idea.id}`}
                    type="date"
                    value={idea.targetDate}
                    onChange={(event) => set({ targetDate: event.target.value }, "now")}
                  />
                </Field>

                <Field label="Who is making it" htmlFor={`owner-${idea.id}`}>
                  <TextInput
                    id={`owner-${idea.id}`}
                    value={idea.owner}
                    onChange={(event) => set({ owner: event.target.value })}
                    placeholder="Leave empty if it's just you"
                  />
                </Field>
              </Panel>

              <Panel className="flex flex-col gap-6 p-6">
                <TitleOptions
                  options={idea.titleOptions}
                  onChange={(titleOptions) => set({ titleOptions })}
                />

                <Field label="Thumbnail / cover idea">
                  <TextArea
                    value={idea.thumbnailIdea}
                    onChange={(event) => set({ thumbnailIdea: event.target.value })}
                    rows={3}
                    placeholder="What the cover frame shows."
                  />
                </Field>
              </Panel>

              <Panel className="flex flex-col gap-6 p-6">
                <Field label="Notes">
                  <TextArea
                    value={idea.notes}
                    onChange={(event) => set({ notes: event.target.value })}
                    rows={4}
                    placeholder="Anything you want to remember."
                  />
                </Field>

                <Field
                  label="Performance note"
                  hint={
                    idea.archived
                      ? "How it actually did."
                      : "For after it goes live — how it actually did."
                  }
                >
                  <TextArea
                    value={idea.performanceNote}
                    onChange={(event) => set({ performanceNote: event.target.value })}
                    rows={3}
                    placeholder="e.g. 18k views, best hook so far"
                  />
                </Field>
              </Panel>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TitleOptions({
  options,
  onChange,
}: {
  options: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <FieldGroup label="Title options" hint="Candidate titles for the finished post.">
      <div className="flex flex-col gap-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <TextInput
              value={option}
              aria-label={`Title option ${index + 1}`}
              onChange={(event) =>
                onChange(options.map((current, i) => (i === index ? event.target.value : current)))
              }
            />
            <IconButton
              label={`Remove title option ${index + 1}`}
              onClick={() => onChange(options.filter((_, i) => i !== index))}
            >
              <CloseIcon className="h-4 w-4" />
            </IconButton>
          </div>
        ))}
        <Button variant="plain" className="justify-start px-3" onClick={() => onChange([...options, ""])}>
          <PlusIcon className="h-4 w-4" />
          Add a title option
        </Button>
      </div>
    </FieldGroup>
  );
}
