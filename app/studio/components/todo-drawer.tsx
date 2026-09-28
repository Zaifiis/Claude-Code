"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { todoDueLabel, todoIsOverdue, todoOrder } from "@/lib/studio/todos";
import { type Todo, TODO_PRIORITY_COLOR } from "@/types/studio";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon } from "./icons";
import { TodoSheet } from "./todo-sheet";
import { useStudio } from "../studio-store";
import { useToday } from "../use-today";
import { Button, Chip, cx, IconButton, TextInput } from "./ui";

/** What the drawer is showing. "Focus" is the answer to "what now?". */
const FILTERS = ["Focus", "All", "Dated", "Finished"] as const;
type Filter = (typeof FILTERS)[number];

/**
 * The to-do list, in a panel that slides in from the right.
 *
 * It is deliberately separate from the ranked list: these are the errands
 * around making content — chase a clip, renew a licence — not things that
 * belong in the make-next order.
 */
export function TodoDrawer() {
  const { todos, addTodo, toggleTodo, editTodo, removeTodo, clearDoneTodos } = useStudio();
  const today = useToday();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("Focus");
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { outstanding, done } = useMemo(
    () => ({
      outstanding: todos.filter((todo) => !todo.done),
      done: todos.filter((todo) => todo.done),
    }),
    [todos],
  );

  /** Urgent first, then what is due soonest, then everything else. */
  const sorted = useMemo(() => [...outstanding].sort(todoOrder(today)), [outstanding, today]);

  const shown = useMemo(() => {
    switch (filter) {
      case "Focus":
        // What you would actually do next: urgent, for today, or already late.
        return sorted.filter(
          (todo) =>
            todo.priority === "Urgent" || todo.priority === "Today" || todoIsOverdue(todo, today),
        );
      case "Dated":
        return sorted.filter((todo) => todo.due !== "");
      case "Finished":
        return done;
      default:
        return sorted;
    }
  }, [filter, sorted, done, today]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // The sheet closes itself first; this only ever closes the drawer.
      if (event.key === "Escape" && openId === null) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, openId]);

  const openTodo = openId ? todos.find((todo) => todo.id === openId) : undefined;

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
          // The tab stays narrow, but the hit area reaches 44 so a thumb does
          // not have to find a 28px sliver.
          "after:absolute after:-inset-y-1 after:right-0 after:-left-4 after:content-['']",
          "rounded-l-st-card border border-r-0 border-st-hairline bg-st-surface text-st-text-2 shadow-st-raised",
          "hover:text-st-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
          "transition-[right] duration-[var(--st-dur)] ease-st",
          open && "right-[min(380px,100vw)]",
        )}
      >
        <span className="sr-only">{open ? "Hide to-dos" : "Show to-dos"}</span>
        {open ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
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
          "fixed top-0 right-0 z-40 flex h-dvh w-[min(380px,100vw)] flex-col bg-st-surface",
          "border-l border-st-hairline shadow-st-float",
          "transition-transform duration-[var(--st-dur-slow)] ease-st",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-start gap-3 px-5 pt-6 pb-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="st-title-3 text-st-text">To-do</h2>
            <p className="st-footnote text-st-text-3">
              {outstanding.length === 0
                ? "All clear"
                : `${outstanding.length} to go${done.length > 0 ? ` · ${done.length} done` : ""}`}
            </p>
          </div>
          <IconButton
            label="Hide to-dos"
            onClick={() => setOpen(false)}
            className="st-pressable -mr-2 shrink-0"
          >
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
          className="relative px-5 pb-3 sm:px-6"
        >
          <PlusIcon className="pointer-events-none absolute top-1/2 left-8 h-4 w-4 -translate-y-1/2 text-st-text-3 sm:left-9" />
          <TextInput
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a to-do"
            aria-label="Add a to-do"
            enterKeyHint="done"
            className="min-h-11 bg-st-surface pl-10 shadow-st-raised"
          />
        </form>

        <div
          aria-label="Which to-dos"
          role="group"
          className="flex gap-2 overflow-x-auto px-5 pb-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map((item) => (
            <Chip
              key={item}
              selected={filter === item}
              quiet={item === "All"}
              onClick={() => setFilter(item)}
              className="min-h-11 min-w-11 justify-center lg:min-h-9 lg:min-w-0"
            >
              {item}
            </Chip>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
          {shown.length === 0 ? (
            <p className="st-callout mx-auto px-2 py-10 text-center text-st-text-3">
              {emptyMessage(filter, outstanding.length)}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-st-hairline">
              {shown.map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  onToggle={() => toggleTodo(todo.id, !todo.done)}
                  onOpen={() => setOpenId(todo.id)}
                  today={today}
                />
              ))}
            </ul>
          )}

          {done.length > 0 && (filter === "All" || filter === "Finished") ? (
            <div className="mt-4 border-t border-st-hairline pt-3">
              <Button variant="plain" onClick={clearDoneTodos} className="w-full justify-center">
                Clear {done.length} finished
              </Button>
            </div>
          ) : null}
        </div>
      </aside>

      {openTodo ? (
        <TodoSheet
          todo={openTodo}
          onPatch={(patch) => editTodo(openTodo.id, patch)}
          onDelete={() => {
            removeTodo(openTodo.id);
            setOpenId(null);
          }}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </>
  );
}

function emptyMessage(filter: Filter, outstanding: number): string {
  const nothingAtAll =
    "Nothing to do. The errands around making content live here — ideas belong in the list.";

  switch (filter) {
    case "Focus":
      return outstanding === 0
        ? nothingAtAll
        : "Nothing urgent or due today. Tap All for the rest.";
    case "Dated":
      return "Nothing has a date yet. Open a to-do to give it one.";
    case "Finished":
      return "Nothing ticked off yet.";
    default:
      return nothingAtAll;
  }
}

/**
 * A row. The text wraps over up to three lines rather than being cut off at
 * the panel edge — the single-line field it replaces hid the end of anything
 * longer than a few words. Tapping it opens the whole thing.
 */
function TodoRow({
  todo,
  today,
  onToggle,
  onOpen,
}: {
  todo: Todo;
  today: string | null;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const tone = TODO_PRIORITY_COLOR[todo.priority];
  const due = todoDueLabel(todo, today);
  const overdue = todoIsOverdue(todo, today);

  return (
    <li className="flex items-start gap-1">
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.done ? `Mark "${todo.text}" as not done` : `Mark "${todo.text}" as done`}
        onClick={onToggle}
        className={cx(
          // The circle stays 20px, the way a checkbox should look; the button
          // around it carries the tap area out to 44, which is what a thumb
          // needs.
          "st-pressable -ml-3 mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "flex h-5 w-5 items-center justify-center rounded-full border",
            "transition-colors duration-[var(--st-dur-fast)] ease-st",
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

      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open "${todo.text}"`}
        className={cx(
          "st-pressable -mx-2 flex min-h-11 min-w-0 flex-1 flex-col items-start gap-1 rounded-st-control px-2 py-2 text-left",
          "hover:bg-st-fill/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
        )}
      >
        <span
          className={cx(
            "st-callout line-clamp-3 w-full break-words",
            todo.done ? "text-st-text-3 line-through" : "text-st-text",
          )}
        >
          {todo.text}
        </span>

        {due || todo.priority !== "Soon" || todo.notes ? (
          <span className="flex flex-wrap items-center gap-2">
            {todo.priority !== "Soon" ? (
              <span className={cx("st-footnote inline-flex items-center gap-1.5", tone.text)}>
                <span aria-hidden="true" className={cx("h-2 w-2 rounded-full", tone.dot)} />
                {todo.priority}
              </span>
            ) : null}
            {due ? (
              <span className={cx("st-footnote", overdue ? "text-st-pink" : "text-st-text-3")}>
                {due}
              </span>
            ) : null}
            {todo.notes ? <span className="st-footnote text-st-text-3">Notes</span> : null}
          </span>
        ) : null}
      </button>
    </li>
  );
}
