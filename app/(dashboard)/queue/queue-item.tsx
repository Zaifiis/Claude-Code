"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { ContentItem, Platform } from "@/types/db";
import { approveItem, rejectItem, revertToPending } from "./actions";

export function QueueItem({ item, platform }: { item: ContentItem; platform?: Platform }) {
  const [title, setTitle] = useState(item.title ?? "");
  const [text, setText] = useState(item.post_text ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 md:grid-cols-[160px_1fr]">
      {item.image_url ? (
        <div className="relative h-40 w-full overflow-hidden rounded-md bg-neutral-800 md:h-full">
          <Image
            src={item.image_url}
            alt={item.headline ?? "Post graphic"}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-md bg-neutral-800 text-xs text-neutral-500 md:h-full">
          No image
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {platform?.display_name ?? "Unknown platform"} · {item.status}
          </span>
          <span className="text-xs text-neutral-500">
            {new Date(item.created_at).toLocaleString()}
          </span>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm font-medium text-neutral-100 outline-none focus:border-neutral-500"
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-neutral-500"
        />

        <div className="flex gap-2">
          {item.status !== "Ready" && (
            <button
              disabled={isPending}
              onClick={() => startTransition(() => approveItem(item.id, text, title))}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Approve &amp; mark Ready
            </button>
          )}
          {item.status !== "Rejected" && (
            <button
              disabled={isPending}
              onClick={() => startTransition(() => rejectItem(item.id))}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
            >
              Reject
            </button>
          )}
          {item.status === "Ready" && (
            <button
              disabled={isPending}
              onClick={() => startTransition(() => revertToPending(item.id))}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
            >
              Revert to Pending
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
