"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon } from "./icons";
import { useStudio } from "../studio-store";
import { Button, cx, IconButton, TextInput } from "./ui";

/**
 * The to-do list, in a panel that slides in from the right.
 *
 * It is deliberately separate from the ranked list: these are the errands
 * around making content — chase a clip, renew a licence — not things that
 * belong in the make-next order.
 */
export function TodoDrawer() {
  const { todos, addTodo, toggleTodo, editTodo, removeTodo, clearDoneTodos } = useStudio();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { outstanding, done } = useMemo(
    () => ({
      outstanding: todos.filter((todo) => !todo.done),
      done: todos.filter((todo) => todo.done),
    }),
    [todos],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {/* The handle: a tab on the right edge, vertically centred. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="todo-drawer"
        onClick={() => setOpen((current) => !current)}
        className={cx(
          "st-pressable fixed top-1/2 right-0 z-40 flex h-16 w-7 -translate-y-1/2 items-center justify-center",
          "rounded-l-st-card border border-r-0 border-st-hairline bg-st-surface text-st-text-2 shadow-st-raised",
          "hover:text-st-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
          "transition-[right] duration-[var(--st-dur)] ease-st",
          open && "right-[min(360px,100vw)]",
        )}
      >
        <span className="sr-only">{open ? "Hide to-dos" : "Show to-dos"}</span>
        {open ? (
          <ChevronRightIcon className="h-4 w-4" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4" />
        )}
        {!open && outstanding.length > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-st-accent px-1 st-tabular text-[10px] font-semibold text-st-on-accent"
          >
            {outstanding.length}
          </span>
        ) : null}
      </button>

      {/* Tapping the page closes it on a phone, where the panel covers most of it. */}
      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="st-fade-in fixed inset-0 z-30 cursor-default bg-black/20 sm:hidden"
        />
      ) : null}

      <aside
        id="todo-drawer"
        aria-label="To-dos"
        aria-hidden={!open}
        className={cx(
          // Opaque, not vibrant: this floats over the list, and content
          // showing through it made the to-dos hard to read.
          "fixed top-0 right-0 z-40 flex h-dvh w-[min(360px,100vw)] flex-col bg-st-surface",
          "border-l border-st-hairline shadow-st-float",
          "transition-transform duration-[var(--st-dur-slow)] ease-st",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center gap-2 px-4 pt-6 pb-4">
          <h2 className="st-title-3 flex-1 text-st-text">To-do</h2>
          <IconButton label="Hide to-dos" onClick={() => setOpen(false)} className="st-pressable">
            <CloseIcon />
          </IconButton>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            addTodo(draft);
            setDraft("");
            inputRef.current?.focus();
          }}
          className="relative px-4 pb-4"
        >
          <PlusIcon className="pointer-events-none absolute top-1/2 left-7 h-4 w-4 -translate-y-1/2 text-st-text-3" />
          <TextInput
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a to-do"
            aria-label="Add a to-do"
            enterKeyHint="done"
            className="bg-st-surface pl-9 shadow-st-raised"
          />
        </form>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
          {todos.length === 0 ? (
            <p className="st-callout px-1 py-8 text-center text-st-text-3">
              Nothing to do. The errands around making content live here — ideas belong in the list.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {[...outstanding, ...done].map((todo) => (
                <li key={todo.id} className="group flex items-start gap-2 rounded-st-control py-1">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={todo.done}
                    aria-label={todo.done ? `Mark "${todo.text}" as not done` : `Mark "${todo.text}" as done`}
                    onClick={() => toggleTodo(todo.id, !todo.done)}
                    className={cx(
                      "st-pressable mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
                      todo.done
                        ? "border-st-accent bg-st-accent text-st-on-accent"
                        : "border-st-hairline-strong hover:border-st-accent",
                    )}
                  >
                    {todo.done ? (
                      <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true">
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
                  </button>

                  <input
                    value={todo.text}
                    onChange={(event) => editTodo(todo.id, event.target.value)}
                    aria-label={`To-do: ${todo.text}`}
                    className={cx(
                      "st-callout min-h-9 min-w-0 flex-1 border-0 bg-transparent py-1 outline-none",
                      "focus-visible:outline-none",
                      todo.done ? "text-st-text-3 line-through" : "text-st-text",
                    )}
                  />

                  <IconButton
                    label={`Delete "${todo.text}"`}
                    onClick={() => removeTodo(todo.id)}
                    className="st-pressable h-9 w-9 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}

          {done.length > 0 ? (
            <Button variant="plain" onClick={clearDoneTodos} className="mt-4 w-full justify-center">
              Clear {done.length} finished
            </Button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
