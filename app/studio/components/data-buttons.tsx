"use client";

import { useRef, useState } from "react";

import { cx } from "./ui";

type Result = { kind: "ok" | "error"; message: string } | null;

/**
 * Export downloads everything as one file. Import merges a file back in —
 * ideas and to-dos already here are updated, new ones are added, and nothing
 * is removed, so importing twice is harmless.
 */
export function DataButtons({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onFile = async (file: File) => {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/studio/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: await file.text(),
      });
      const body = (await response.json()) as {
        added?: { ideas: number; todos: number };
        error?: string;
      };

      if (!response.ok) throw new Error(body.error ?? `Import failed (${response.status})`);

      const { ideas = 0, todos = 0 } = body.added ?? {};
      setResult({
        kind: "ok",
        message:
          ideas + todos === 0
            ? "Nothing new — everything in that file was already here."
            : `Added ${ideas} ${ideas === 1 ? "idea" : "ideas"} and ${todos} ${todos === 1 ? "to-do" : "to-dos"}.`,
      });
      // The merged data is on the server; a reload is the simplest way to
      // show it without reconciling two copies in the browser.
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      setResult({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  };

  const ITEM = cx(
    "st-pressable flex min-h-9 w-full items-center rounded-st-control px-3 text-left st-footnote font-medium",
    "text-st-text-2 hover:bg-st-fill hover:text-st-text",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent",
  );

  return (
    <div className={cx("flex flex-col gap-0.5", className)}>
      <a href="/api/studio/export" download className={ITEM}>
        Export everything
      </a>

      <button type="button" className={ITEM} disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? "Importing…" : "Import a file"}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Reset so choosing the same file twice still fires.
          event.target.value = "";
          if (file) void onFile(file);
        }}
      />

      {result ? (
        <p
          role="status"
          className={cx(
            "st-footnote px-3 pt-1",
            result.kind === "ok" ? "text-st-green" : "text-st-pink",
          )}
        >
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
