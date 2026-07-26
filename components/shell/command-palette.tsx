"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Plus,
  Bookmark,
  Calendar,
  Kanban,
  Send,
  FileText,
  Clock,
  CornerDownLeft,
  FileStack,
  Video,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/input";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { StatusBadge } from "@/components/ui/badges";
import { searchAction } from "@/lib/actions/lookup";
import type { SearchResults } from "@/lib/db/queries";
import type { QuickAddTab } from "./quick-add-modal";

const EMPTY: SearchResults = { content: [], references: [], scripts: [] };

export function CommandPalette({
  open,
  onClose,
  openQuickAdd,
}: {
  open: boolean;
  onClose: () => void;
  openQuickAdd: (tab?: QuickAddTab) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults>(EMPTY);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(EMPTY);
    }
  }, [open]);

  React.useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(EMPTY);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        setResults(await searchAction(q));
      } finally {
        setLoading(false);
      }
    }, 140);
    return () => clearTimeout(t);
  }, [query]);

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const commands = [
    { id: "create-idea", label: "Create idea", icon: Plus, run: () => openQuickAdd("idea"), kw: "new content" },
    { id: "save-reference", label: "Save reference", icon: Bookmark, run: () => openQuickAdd("reference"), kw: "video link url" },
    { id: "schedule", label: "Schedule content", icon: Calendar, run: () => openQuickAdd("schedule"), kw: "plan post" },
    { id: "open-pipeline", label: "Open pipeline", icon: Kanban, run: () => go("/pipeline"), kw: "kanban board" },
    { id: "open-calendar", label: "Open calendar", icon: Calendar, run: () => go("/calendar"), kw: "" },
    { id: "ready", label: "Show ready to post", icon: Send, run: () => go("/ideas?status=ready_to_post"), kw: "" },
    { id: "drafts", label: "Show drafts", icon: FileText, run: () => go("/ideas?status=idea"), kw: "ideas" },
    { id: "scheduled", label: "Show scheduled", icon: Clock, run: () => go("/ideas?status=scheduled"), kw: "" },
    { id: "library", label: "Open content library", icon: FileStack, run: () => go("/library"), kw: "published" },
  ];

  const q = query.trim().toLowerCase();
  const filteredCommands = q
    ? commands.filter((c) => (c.label + " " + c.kw).toLowerCase().includes(q))
    : commands;

  const hasResults =
    results.content.length + results.references.length + results.scripts.length > 0;

  return (
    <Dialog open={open} onClose={onClose} align="top" className="max-w-xl overflow-hidden p-0">
      <Command shouldFilter={false} loop className="flex flex-col">
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-faint" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search content, references, scripts — or run a command…"
            className="h-12 w-full bg-transparent text-sm text-fg placeholder:text-faint focus:outline-none"
          />
          {loading && <span className="text-[11px] text-faint">searching…</span>}
        </div>

        <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain p-2">
          <Command.Empty className="py-10 text-center text-[13px] text-muted">
            No matches for “{query}”.
          </Command.Empty>

          {filteredCommands.length > 0 && (
            <Command.Group
              heading="Commands"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-faint"
            >
              {filteredCommands.map((c) => (
                <Item key={c.id} onSelect={c.run}>
                  <c.icon className="size-4 text-muted" />
                  <span className="flex-1">{c.label}</span>
                </Item>
              ))}
            </Command.Group>
          )}

          {results.content.length > 0 && (
            <Group heading="Content">
              {results.content.map((r) => (
                <Item key={r.id} onSelect={() => go(`/content/${r.id}`)}>
                  <PlatformIcon platform={r.platform} className="size-4 text-muted" />
                  <span className="flex-1 truncate">{r.title}</span>
                  <StatusBadge status={r.status} />
                </Item>
              ))}
            </Group>
          )}

          {results.scripts.length > 0 && (
            <Group heading="Scripts">
              {results.scripts.map((r) => (
                <Item key={`s-${r.id}`} onSelect={() => go(`/content/${r.id}`)}>
                  <Video className="size-4 text-muted" />
                  <span className="flex-1 truncate">
                    <span className="text-fg">{r.title}</span>{" "}
                    <span className="text-faint">— {r.snippet}</span>
                  </span>
                </Item>
              ))}
            </Group>
          )}

          {results.references.length > 0 && (
            <Group heading="References">
              {results.references.map((r) => (
                <Item key={r.id} onSelect={() => go(`/references?q=${encodeURIComponent(r.title)}`)}>
                  <PlatformIcon platform={r.platform} className="size-4 text-muted" />
                  <span className="flex-1 truncate">{r.title}</span>
                </Item>
              ))}
            </Group>
          )}

          {q && !hasResults && !loading && filteredCommands.length === 0 && null}
        </Command.List>

        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-faint">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft className="size-3" /> to select
            </span>
            <span>↑↓ to navigate</span>
          </div>
          <span className="inline-flex items-center gap-1">
            <Kbd>Esc</Kbd> to close
          </span>
        </div>
      </Command>
    </Dialog>
  );
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-faint"
    >
      {children}
    </Command.Group>
  );
}

function Item({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-[13px] text-fg data-[selected=true]:bg-surface-2 aria-selected:bg-surface-2"
    >
      {children}
    </Command.Item>
  );
}
