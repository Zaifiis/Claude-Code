"use client";

import { useState, useTransition } from "react";
import type { Platform, PlatformSettings } from "@/types/db";
import { savePlatformSettings, togglePlatform } from "./actions";

export function PlatformCard({
  platform,
  settings,
}: {
  platform: Platform;
  settings?: PlatformSettings;
}) {
  const [enabled, setEnabled] = useState(platform.enabled);
  const [brandVoice, setBrandVoice] = useState(settings?.brand_voice_prompt ?? "");
  const [postingCron, setPostingCron] = useState(settings?.posting_cadence_cron ?? "0 8 * * *");
  const [publishCron, setPublishCron] = useState(settings?.publish_cadence_cron ?? "0 9 * * *");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-100">{platform.display_name}</h2>
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          {enabled ? "Active" : "Disabled"}
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              const next = e.target.checked;
              setEnabled(next);
              startTransition(() => togglePlatform(platform.id, next));
            }}
            className="h-4 w-4 accent-emerald-500"
          />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-neutral-400">
            Brand voice / system prompt
          </label>
          <textarea
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-neutral-500"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Fed into the n8n Idea Generator agent as the system message for this platform.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-400">
              Generate schedule (cron)
            </label>
            <input
              value={postingCron}
              onChange={(e) => setPostingCron(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400">
              Publish schedule (cron)
            </label>
            <input
              value={publishCron}
              onChange={(e) => setPublishCron(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-neutral-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await savePlatformSettings(platform.id, {
                  brand_voice_prompt: brandVoice,
                  posting_cadence_cron: postingCron,
                  publish_cadence_cron: publishCron,
                });
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              })
            }
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
          >
            Save settings
          </button>
          {saved && <span className="text-xs text-emerald-400">Saved</span>}
        </div>
      </div>
    </div>
  );
}
