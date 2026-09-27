"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { formatFullDate, relativeLabel } from "@/lib/studio/dates";
import { type Idea, PLATFORMS, STATUS_COLOR, STATUSES } from "@/types/studio";

import { ChevronLeftIcon, CloseIcon, ExpandIcon, TrashIcon } from "./icons";
import { InspirationEditor, ListEditor } from "./list-editor";
import { ScriptEditor } from "./script-editor";
import { Section } from "./section";
import { useStudio } from "../studio-store";
import { Button, cx, Field, IconButton, Select, Tag, TextArea, TextInput } from "./ui";

const DELETE_CONFIRM_TIMEOUT = 4000;

/** A textarea that grows with its content, for fields that must not scroll. */
function AutoTextArea({
  value,
  className,
  ...props
}: React.ComponentPropsWithRef<"textarea"> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return <textarea ref={ref} value={value} rows={1} className={cx("resize-none", className)} {...props} />;
}

/** The full-screen page for one idea: its script, hooks, references and shots. */
export function IdeaPage({
  idea,
  today,
  onClose,
}: {
  idea: Idea;
  today: string | null;
  onClose: () => void;
}) {
  const { update, remove, pillars, flush } = useStudio();
  const [focusMode, setFocusMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const tone = STATUS_COLOR[idea.status];

  const set = useCallback(
    (patch: Parameters<typeof update>[1], when?: "debounced" | "now") => update(idea.id, patch, when),
    [idea.id, update],
  );

  const close = useCallback(() => {
    flush();
    onClose();
  }, [flush, onClose]);

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

  const due = idea.targetDate && today ? relativeLabel(idea.targetDate, today) : null;

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
        <div className="mx-auto flex w-full max-w-[1080px] items-center gap-2 px-2 py-2 sm:px-4">
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-11 items-center gap-1 rounded-st-control pr-3 pl-1 st-callout font-medium text-st-accent transition-colors duration-[var(--st-dur-fast)] ease-st hover:bg-st-fill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <IconButton
              label={focusMode ? "Show all sections" : "Focus on the script"}
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

      <div className="mx-auto w-full max-w-[1080px] px-4 pt-6 pb-24 sm:px-6">
        {!focusMode ? (
          <div className="flex flex-col gap-4">
            <AutoTextArea
              value={idea.title}
              onChange={(event) => set({ title: event.target.value })}
              placeholder="Untitled idea"
              aria-label="Idea title"
              className="st-title-1 w-full border-0 bg-transparent p-0 text-st-text outline-none placeholder:text-st-text-3"
            />

            {/* The stage lives right under the title: it is the thing that changes most. */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="radiogroup"
                aria-label="Stage"
                className="flex flex-wrap items-center gap-1 rounded-full bg-st-fill p-1"
              >
                {STATUSES.map((stage) => {
                  const active = idea.status === stage;
                  const stageTone = STATUS_COLOR[stage];
                  return (
                    <button
                      key={stage}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set({ status: stage }, "now")}
                      className={cx(
                        "inline-flex min-h-9 items-center gap-2 rounded-full px-3 st-footnote font-medium",
                        "transition-colors duration-[var(--st-dur-fast)] ease-st",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
                        active
                          ? cx(stageTone.soft, stageTone.text)
                          : "text-st-text-2 hover:text-st-text",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cx("h-2 w-2 rounded-full", active ? stageTone.dot : "bg-st-text-3")}
                      />
                      {stage}
                    </button>
                  );
                })}
              </div>

              {idea.targetDate ? (
                <Tag>
                  {due ? `${due} · ` : ""}
                  {formatFullDate(idea.targetDate)}
                </Tag>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className={cx("mt-8 grid gap-6", !focusMode && "lg:grid-cols-[minmax(0,1fr)_380px]")}>
          <div className="flex min-w-0 flex-col gap-6">
            <Section
              title="Script"
              color="indigo"
              action={
                focusMode ? (
                  <Button variant="plain" className="px-3" onClick={() => setFocusMode(false)}>
                    Show all sections
                  </Button>
                ) : null
              }
            >
              <ScriptEditor
                value={idea.script}
                onChange={(script) => set({ script })}
                wordCountId={`word-count-${idea.id}`}
              />
            </Section>

            {!focusMode ? (
              <>
                <Section title="Hooks" color="pink" hint="Opening lines to choose between">
                  <ListEditor
                    rows={idea.hooks}
                    onChange={(hooks) => set({ hooks })}
                    label="Hook"
                    placeholder="The first line that stops the scroll"
                    addLabel="Add a hook"
                  />
                </Section>

                <Section title="Caption" color="green" hint={`${idea.caption.length} characters`}>
                  <TextArea
                    value={idea.caption}
                    onChange={(event) => set({ caption: event.target.value })}
                    rows={5}
                    aria-label="Caption"
                    placeholder="The caption that goes out with the post."
                  />
                </Section>
              </>
            ) : null}
          </div>

          {!focusMode ? (
            <aside className="flex min-w-0 flex-col gap-6">
              <Section title="Inspiration" color="teal" hint="Reels worth stealing from">
                <InspirationEditor
                  rows={idea.inspiration}
                  onChange={(inspiration) => set({ inspiration })}
                />
              </Section>

              <Section title="Shot ideas" color="orange" hint="What to film">
                <ListEditor
                  rows={idea.shotIdeas}
                  onChange={(shotIdeas) => set({ shotIdeas })}
                  label="Shot"
                  placeholder="e.g. close-up on the notebook"
                  addLabel="Add a shot"
                />
              </Section>

              <Section title="Details" color="neutral">
                <div className="flex flex-col gap-6">
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

                  {showDetails ? (
                    <>
                      <Field label="Title options">
                        <ListEditor
                          rows={idea.titleOptions}
                          onChange={(titleOptions) => set({ titleOptions })}
                          label="Title option"
                          placeholder="Another way to title it"
                          addLabel="Add a title option"
                        />
                      </Field>

                      <Field label="Thumbnail / cover idea">
                        <TextArea
                          value={idea.thumbnailIdea}
                          onChange={(event) => set({ thumbnailIdea: event.target.value })}
                          rows={3}
                          placeholder="What the cover frame shows."
                        />
                      </Field>

                      <Field label="Who is making it">
                        <TextInput
                          value={idea.owner}
                          onChange={(event) => set({ owner: event.target.value })}
                          placeholder="Leave empty if it's just you"
                        />
                      </Field>

                      <Field label="Notes">
                        <TextArea
                          value={idea.notes}
                          onChange={(event) => set({ notes: event.target.value })}
                          rows={4}
                          placeholder="Anything you want to remember."
                        />
                      </Field>
                    </>
                  ) : (
                    <Button
                      variant="plain"
                      className="justify-start px-3"
                      onClick={() => setShowDetails(true)}
                    >
                      More details
                    </Button>
                  )}
                </div>
              </Section>

              {idea.status === "Posted" ? (
                <Section title="How it did" color="green" hint="Now that it is live">
                  <TextArea
                    value={idea.performanceNote}
                    onChange={(event) => set({ performanceNote: event.target.value })}
                    rows={3}
                    aria-label="Performance note"
                    placeholder="e.g. 18k views, best hook so far"
                  />
                </Section>
              ) : null}
            </aside>
          ) : null}
        </div>

        {/* A quiet reminder of where this sits, at the foot of the page. */}
        {!focusMode ? (
          <p className={cx("st-footnote mt-8 text-center", tone.text)}>{idea.status}</p>
        ) : null}
      </div>
    </div>
  );
}
