"use client";

import { useCallback, useEffect, useState } from "react";

import { DataButtons } from "./data-buttons";
import { ClockIcon, CloudIcon, MoonIcon, SunIcon } from "./icons";
import { Section } from "./section";
import { Button, Segmented, cx } from "./ui";
import type { Appearance } from "../use-theme";

type Backup = { id: string; savedAt: string };
type Health = { ok: boolean; storage: string; ideas?: number; error?: string };

/**
 * Everything that is about the app rather than about an idea: where the data
 * lives, how to get it in and out, how to put a version back, and how it looks.
 */
export function SettingsView({
  appearance,
  onAppearanceChange,
  onRestored,
}: {
  appearance: Appearance | null;
  onAppearanceChange: (next: Appearance) => void;
  onRestored: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-8">
      <DataSection />
      <BackupsSection onRestored={onRestored} />
      <AppearanceSection appearance={appearance} onAppearanceChange={onAppearanceChange} />
      <StorageSection />
      <DriveSection />
    </div>
  );
}

function DataSection() {
  return (
    <Section title="Your data" color="indigo" hint="One file with every idea, script and to-do">
      <p className="st-callout st-measure text-st-text-2">
        Export writes the whole studio to a single JSON file — keep it anywhere you like. Import
        merges a file back in: anything already here is updated, anything new is added, and
        nothing is ever deleted, so importing the same file twice is harmless.
      </p>
      <DataButtons />
    </Section>
  );
}

function BackupsSection({ onRestored }: { onRestored: () => void }) {
  const [backups, setBackups] = useState<Backup[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const loaded = await fetchBackups();
    if ("error" in loaded) {
      setError(loaded.error);
      setBackups([]);
      return;
    }
    setBackups(loaded.backups);
    setError(null);
  }, []);

  useEffect(() => {
    let live = true;
    void (async () => {
      const loaded = await fetchBackups();
      if (!live) return;
      if ("error" in loaded) {
        setError(loaded.error);
        setBackups([]);
        return;
      }
      setBackups(loaded.backups);
    })();
    return () => {
      live = false;
    };
  }, []);

  const restore = async (backup: Backup) => {
    const when = formatWhen(backup.savedAt);
    if (!window.confirm(`Put the version from ${when} back? What is here now is backed up first.`)) {
      return;
    }

    setBusy(backup.id);
    setError(null);
    try {
      const response = await fetch("/api/studio/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: backup.id }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? `Restore failed (${response.status})`);
      onRestored();
      // The restored copy is the server's; reload rather than reconcile.
      setTimeout(() => window.location.reload(), 600);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : String(problem));
      setBusy(null);
    }
  };

  return (
    <Section
      title="Versions"
      color="teal"
      hint="Kept automatically before every save"
      action={
        <Button variant="plain" onClick={() => void load()} className="h-9 min-h-9 px-3">
          Refresh
        </Button>
      }
    >
      <p className="st-callout st-measure text-st-text-2">
        The studio keeps the previous copy every time it writes, newest first. If something goes
        wrong, put one back — the state you are replacing is itself saved first, so a restore is
        never the end of the line.
      </p>

      {backups === null ? (
        <p className="st-footnote text-st-text-3">Loading…</p>
      ) : backups.length === 0 ? (
        <p className="st-footnote text-st-text-3">No versions yet. One is kept the next time you save.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-st-hairline">
          {backups.slice(0, 12).map((backup) => (
            <li key={backup.id} className="flex min-h-12 items-center gap-3 py-1">
              <ClockIcon className="h-[18px] w-[18px] shrink-0 text-st-teal" />
              <span className="st-callout min-w-0 flex-1 truncate text-st-text">
                {formatWhen(backup.savedAt)}
              </span>
              <Button
                variant="plain"
                disabled={busy !== null}
                onClick={() => void restore(backup)}
                className="h-9 min-h-9 shrink-0 px-3"
              >
                {busy === backup.id ? "Restoring…" : "Restore"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error ? (
        <p role="status" className="st-footnote text-st-pink">
          {error}
        </p>
      ) : null}
    </Section>
  );
}

function AppearanceSection({
  appearance,
  onAppearanceChange,
}: {
  appearance: Appearance | null;
  onAppearanceChange: (next: Appearance) => void;
}) {
  return (
    <Section title="Appearance" color="orange" hint="Remembered on this device">
      {appearance === null ? (
        // Until hydration the viewer's appearance is unknown, and rendering a
        // guess would flip under them.
        <div className="h-11" />
      ) : (
        <Segmented
          label="Appearance"
          value={appearance}
          onChange={onAppearanceChange}
          options={[
            { value: "light", label: "Light", icon: <SunIcon className="h-4 w-4" /> },
            { value: "dark", label: "Dark", icon: <MoonIcon className="h-4 w-4" /> },
          ]}
        />
      )}
    </Section>
  );
}

function StorageSection() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const response = await fetch("/api/studio/health");
        const body = (await response.json()) as Health;
        if (live) setHealth(body);
      } catch (problem) {
        if (live) {
          setHealth({
            ok: false,
            storage: "unknown",
            error: problem instanceof Error ? problem.message : String(problem),
          });
        }
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <Section title="Where it is saved" color="green">
      {health === null ? (
        <p className="st-footnote text-st-text-3">Checking…</p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={cx(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                health.ok ? "bg-st-green" : "bg-st-pink",
              )}
            />
            <p className="st-callout min-w-0 text-st-text">{health.storage}</p>
          </div>
          <p className="st-footnote text-st-text-2">
            {health.ok
              ? `Readable, ${health.ideas ?? 0} ${health.ideas === 1 ? "idea" : "ideas"} stored.`
              : (health.error ?? "The store could not be read.")}
          </p>
        </div>
      )}
    </Section>
  );
}

function DriveSection() {
  return (
    <Section title="Nightly Google Drive backup" color="pink" hint="Set up once, in n8n">
      <p className="st-callout st-measure text-st-text-2">
        The workflow in <code className="st-tabular">n8n/studio-backup-workflow.json</code> fetches
        the same export every night at 3am and uploads it to Drive. It refuses to upload an empty
        or broken export, so a bad night can never overwrite a good copy.
      </p>
      <ol className="st-footnote flex list-decimal flex-col gap-1 pl-5 text-st-text-2">
        <li>Import that file into n8n.</li>
        <li>
          Set <code className="st-tabular">STUDIO_BACKUP_TOKEN</code> in the Netlify UI (Functions
          scope) to a long random string.
        </li>
        <li>
          Paste the same string into the workflow&rsquo;s{" "}
          <code className="st-tabular">x-studio-token</code> header and activate it.
        </li>
      </ol>
      <p className="st-footnote text-st-text-3">
        <CloudIcon className="mr-1 inline h-4 w-4 align-[-3px]" />
        That token only ever opens the export URL — it cannot read, change or delete anything else.
      </p>
    </Section>
  );
}

/** Kept free of state so both the first load and Refresh can share it. */
async function fetchBackups(): Promise<{ backups: Backup[] } | { error: string }> {
  try {
    const response = await fetch("/api/studio/backups");
    const body = (await response.json()) as { backups?: Backup[]; error?: string };
    if (!response.ok) {
      return { error: body.error ?? `Could not load versions (${response.status})` };
    }
    return { backups: body.backups ?? [] };
  } catch (problem) {
    return { error: problem instanceof Error ? problem.message : String(problem) };
  }
}

function formatWhen(iso: string): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return iso;
  return when.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
