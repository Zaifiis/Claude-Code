import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Kbd } from "@/components/ui/input";
import { Database, Keyboard, Palette, User, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const SHORTCUTS = [
  { keys: ["N"], label: "New idea" },
  { keys: ["⌘", "K"], label: "Search / command palette" },
  { keys: ["⌘", "S"], label: "Save (in editor)" },
  { keys: ["Esc"], label: "Close dialog or palette" },
  { keys: ["⌘", "↵"], label: "Capture (in Inbox)" },
];

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-xs">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-accent-soft text-accent">
          <Icon className="size-4.5" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  return (
    <PageContainer className="max-w-[760px]">
      <PageHeader title="Settings" description="Personalise Content OS and review how it works." />

      <div className="space-y-4">
        <Section icon={User} title="Profile" description="Your local workspace identity.">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover text-lg font-semibold text-accent-fg">
              Y
            </span>
            <div>
              <p className="text-[14px] font-medium text-fg">You</p>
              <p className="text-[12px] text-muted">you@contentos.local</p>
            </div>
          </div>
        </Section>

        <Section icon={Palette} title="Appearance" description="Match your system, or pick a side.">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted">Theme</span>
            <ThemeToggle />
          </div>
        </Section>

        <Section icon={Keyboard} title="Keyboard shortcuts" description="Move faster without the mouse.">
          <ul className="divide-y divide-border">
            {SHORTCUTS.map((s) => (
              <li key={s.label} className="flex items-center justify-between py-2.5">
                <span className="text-[13px] text-fg">{s.label}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Database} title="Data & storage" description="Where your content lives.">
          <div className="space-y-2 text-[13px] leading-relaxed text-muted">
            <p>
              Content OS stores everything in a local SQLite database at{" "}
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-fg">data/content-os.db</code>.
              It&apos;s created and seeded automatically on first run — no external services required.
            </p>
            <p>
              The relational schema (content, references, tags, attachments, performance metrics) is designed to port to
              Postgres / Supabase when you&apos;re ready to sync across devices.
            </p>
          </div>
        </Section>

        <div className="flex items-center justify-center gap-2 pt-2 text-[12px] text-faint">
          <Sparkles className="size-3.5" />
          Content OS · your personal content operating system
        </div>
      </div>
    </PageContainer>
  );
}
