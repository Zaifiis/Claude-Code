"use client";

import { useEffect, useRef, useState } from "react";

import {
  type Todo,
  type TodoPatch,
  TODO_PRIORITIES,
  TODO_PRIORITY_COLOR,
  type TodoPriority,
} from "@/types/studio";

import { CloseIcon, TrashIcon } from "./icons";
import { Button, cx, Field, FieldGroup, IconButton, TextArea, TextInput } from "./ui";

/**
 * One to-do, opened up: the whole text rather than a clipped line, somewhere
 * to put the detail, when it is due, and how loudly it is asking.
 *
 * Edits save as you make them, the way the rest of the studio does, so there
 * is no Save button to forget.
 */
export function TodoSheet({
  todo,
  onPatch,
  onDelete,
  onClose,
}: {
  todo: Todo;
  onPatch: (patch: TodoPatch) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  // The title grows with what you type: a to-do you cannot read in full is
  // the problem this sheet exists to solve.
  useEffect(() => {
    const field = textRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 240)}px`;
  }, [todo.text]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={onClose}
        className="st-fade-in absolute inset-0 cursor-default bg-black/30"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="To-do"
        className={cx(
          "st-push-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden",
          "rounded-t-st-panel bg-st-surface shadow-st-float sm:max-w-[560px] sm:rounded-st-panel",
        )}
      >
        <header className="flex items-center gap-3 border-b border-st-hairline px-5 py-3 sm:px-6">
          <button
            type="button"
            role="checkbox"
            aria-checked={todo.done}
            onClick={() => onPatch({ done: !todo.done })}
            className="st-pressable -ml-3 flex h-11 w-11 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent"
          >
            <span
              aria-hidden="true"
              className={cx(
                "flex h-5 w-5 items-center justify-center rounded-full border",
                todo.done
                  ? "border-st-accent bg-st-accent text-st-on-accent"
                  : "border-st-hairline-strong",
              )}
            >
              {todo.done ? (
                <svg viewBox="0 0 20 20" className="h-3 w-3">
                  <path
                    d="M5 10.5 8.5 14 15 6.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
          </button>

          <p className="st-caption flex-1 text-st-text-3">{todo.done ? "Done" : "To do"}</p>

          <IconButton label="Close" onClick={onClose} className="st-pressable -mr-2">
            <CloseIcon />
          </IconButton>
        </header>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
          <Field label="To-do">
            <TextArea
              ref={textRef}
              rows={3}
              value={todo.text}
              onChange={(event) => onPatch({ text: event.target.value })}
              placeholder="What needs doing"
              className="st-body"
            />
          </Field>

          <FieldGroup label="Priority" hint="The list puts the loudest first.">
            <div className="flex flex-wrap gap-2">
              {TODO_PRIORITIES.map((priority) => (
                <PriorityChip
                  key={priority}
                  priority={priority}
                  selected={todo.priority === priority}
                  onSelect={() => onPatch({ priority })}
                />
              ))}
            </div>
          </FieldGroup>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due" hint="Leave empty if it has no date.">
              <TextInput
                type="date"
                value={todo.due}
                onChange={(event) => onPatch({ due: event.target.value })}
              />
            </Field>

            <Field label="Time" hint="Optional, for something with an hour.">
              <TextInput
                type="time"
                value={todo.dueTime}
                onChange={(event) => onPatch({ dueTime: event.target.value })}
                disabled={!todo.due}
              />
            </Field>
          </div>

          <Field label="Notes">
            <TextArea
              rows={5}
              value={todo.notes}
              onChange={(event) => onPatch({ notes: event.target.value })}
              placeholder="Links, numbers, whatever you need to hand when you do it"
            />
          </Field>
        </div>

        <footer className="flex items-center gap-2 border-t border-st-hairline px-5 py-3 sm:px-6">
          {confirmingDelete ? (
            <>
              <p className="st-footnote flex-1 text-st-text-2">Delete this to-do?</p>
              <Button variant="quiet" onClick={() => setConfirmingDelete(false)}>
                Keep
              </Button>
              <Button variant="tinted" onClick={onDelete} className="bg-st-pink-soft text-st-pink">
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="plain"
                onClick={() => setConfirmingDelete(true)}
                className="text-st-text-3 hover:text-st-pink"
              >
                <TrashIcon className="h-[18px] w-[18px]" />
                Delete
              </Button>
              <Button variant="quiet" onClick={onClose} className="ml-auto">
                Done
              </Button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

function PriorityChip({
  priority,
  selected,
  onSelect,
}: {
  priority: TodoPriority;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = TODO_PRIORITY_COLOR[priority];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cx(
        "st-pressable inline-flex min-h-11 items-center gap-2 rounded-full px-4 st-footnote font-medium",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
        selected ? cx(tone.soft, tone.text) : "bg-st-fill text-st-text-2 hover:text-st-text",
      )}
    >
      <span aria-hidden="true" className={cx("h-2 w-2 rounded-full", tone.dot)} />
      {priority}
    </button>
  );
}
