"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The capture popup. It only ever saves — clicking away, pressing Enter and
 * pressing Escape all keep what you typed, so an idea cannot be lost by
 * dismissing the wrong way. An empty box just closes.
 */
export function NewIdeaModal({
  onSave,
  onClose,
}: {
  onSave: (title: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const save = useCallback(() => {
    const title = text.trim();
    if (title) onSave(title);
    onClose();
  }, [text, onSave, onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      save();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [save]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New idea"
      onMouseDown={(event) => {
        // Only a click on the backdrop itself, never one inside the card.
        if (event.target === event.currentTarget) save();
      }}
      className="st-glass st-fade-in fixed inset-0 z-50 flex items-start justify-center overscroll-contain px-4 pt-[18vh] pb-8"
    >
      <div className="st-rise w-full max-w-[680px] rounded-st-sheet bg-st-surface p-6 shadow-st-float sm:p-8">
        <textarea
          ref={inputRef}
          value={text}
          rows={1}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            save();
          }}
          placeholder="What's the idea?"
          aria-label="Idea title"
          className="st-title-1 w-full resize-none border-0 bg-transparent p-0 text-st-text outline-none placeholder:text-st-text-3 focus-visible:outline-none"
        />

        <p className="st-footnote mt-4 text-st-text-3">
          Click anywhere to save · it lands in Ideas
        </p>
      </div>
    </div>
  );
}
