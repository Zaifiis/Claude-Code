import Link from "next/link";
import {
  Lightbulb,
  Send,
  Clapperboard,
  CheckCircle2,
  Bookmark,
  ArrowRight,
  Mic,
  CalendarClock,
  Link2,
  Hourglass,
  TrendingUp,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/content/stat-card";
import { ContentCard } from "@/components/content/content-card";
import { QuickAddButton } from "@/components/shell/quick-actions";
import { Card, SectionTitle } from "@/components/ui/misc";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { StatusBadge } from "@/components/ui/badges";
import {
  getDashboardStats,
  getMomentum,
  listContent,
  listReferences,
} from "@/lib/db/queries";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const stats = getDashboardStats();
  const momentum = getMomentum();
  const all = listContent({ archived: false });
  const recent = all.filter((c) => c.status !== "posted").slice(0, 6);
  const upcoming = all
    .filter((c) => c.scheduled_at && new Date(c.scheduled_at) >= new Date(new Date().toDateString()))
    .sort((a, b) => (a.scheduled_at! < b.scheduled_at! ? -1 : 1))
    .slice(0, 4);
  const references = listReferences({ archived: false }).slice(0, 4);

  const nudges = [
    momentum.scriptsReadyToRecord > 0 && {
      icon: Mic,
      text: `${momentum.scriptsReadyToRecord} script${momentum.scriptsReadyToRecord === 1 ? "" : "s"} ready to record`,
      href: "/pipeline",
      color: "#14b8a6",
    },
    momentum.scheduledThisWeek > 0 && {
      icon: CalendarClock,
      text: `${momentum.scheduledThisWeek} post${momentum.scheduledThisWeek === 1 ? "" : "s"} scheduled this week`,
      href: "/calendar",
      color: "#3b82f6",
    },
    momentum.unconvertedReferences > 0 && {
      icon: Link2,
      text: `${momentum.unconvertedReferences} reference${momentum.unconvertedReferences === 1 ? "" : "s"} haven't become ideas`,
      href: "/references?used=unused",
      color: "#8b5cf6",
    },
    momentum.staleIdeas > 0 && {
      icon: Hourglass,
      text: `${momentum.staleIdeas} idea${momentum.staleIdeas === 1 ? "" : "s"} untouched for 30+ days`,
      href: "/ideas?age=stale",
      color: "#f59e0b",
    },
  ].filter(Boolean) as { icon: typeof Mic; text: string; href: string; color: string }[];

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Your content operation at a glance."
        actions={
          <>
            <QuickAddButton tab="reference" variant="secondary" size="sm">
              Save Reference
            </QuickAddButton>
            <QuickAddButton tab="idea" variant="primary" size="sm">
              New Content
            </QuickAddButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Ideas" value={stats.totalIdeas} icon={Lightbulb} color="#5b57e0" href="/ideas" />
        <StatCard label="Ready to Post" value={stats.readyToPost} icon={Send} color="#22c55e" href="/ideas?status=ready_to_post" />
        <StatCard label="In Production" value={stats.inProduction} icon={Clapperboard} color="#ec4899" href="/pipeline" />
        <StatCard label="Posted This Month" value={stats.postedThisMonth} icon={CheckCircle2} color="#1a8a52" href="/library" />
        <StatCard label="Saved References" value={stats.savedReferences} icon={Bookmark} color="#0ea5e9" href="/references" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: continue working */}
        <div className="lg:col-span-2">
          <SectionTitle
            action={
              <Link href="/ideas" className="inline-flex items-center gap-1 text-[12px] font-medium text-muted hover:text-fg">
                View all <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            Pick up where you left off
          </SectionTitle>
          {recent.length === 0 ? (
            <Card className="p-8 text-center text-[13px] text-muted">
              No active content yet.{" "}
              <QuickAddButton tab="idea" variant="subtle" size="sm" className="mt-3">
                Capture your first idea
              </QuickAddButton>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recent.map((c) => (
                <ContentCard key={c.id} content={c} />
              ))}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div>
            <SectionTitle>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="size-3.5" /> Content Momentum
              </span>
            </SectionTitle>
            <Card className="divide-y divide-border">
              {nudges.length === 0 ? (
                <p className="p-4 text-[13px] text-muted">You&apos;re all caught up. Nothing needs attention right now.</p>
              ) : (
                nudges.map((n, i) => (
                  <Link
                    key={i}
                    href={n.href}
                    className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2"
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
                      style={{ backgroundColor: `${n.color}1a`, color: n.color }}
                    >
                      <n.icon className="size-4" />
                    </span>
                    <span className="flex-1 text-[13px] text-fg">{n.text}</span>
                    <ArrowRight className="size-3.5 text-faint" />
                  </Link>
                ))
              )}
            </Card>
          </div>

          <div>
            <SectionTitle
              action={
                <Link href="/calendar" className="text-[12px] font-medium text-muted hover:text-fg">
                  Calendar
                </Link>
              }
            >
              Scheduled next
            </SectionTitle>
            <Card className="divide-y divide-border">
              {upcoming.length === 0 ? (
                <p className="p-4 text-[13px] text-muted">Nothing scheduled yet.</p>
              ) : (
                upcoming.map((c) => (
                  <Link key={c.id} href={`/content/${c.id}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2">
                    <PlatformIcon platform={c.platform} className="size-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-fg">{c.title}</p>
                      <p className="text-[11px] text-faint">{formatDate(c.scheduled_at, { weekday: "short", month: "short", day: "numeric" })}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                ))
              )}
            </Card>
          </div>

          <div>
            <SectionTitle
              action={
                <Link href="/references" className="text-[12px] font-medium text-muted hover:text-fg">
                  Library
                </Link>
              }
            >
              Latest references
            </SectionTitle>
            <Card className="divide-y divide-border">
              {references.length === 0 ? (
                <p className="p-4 text-[13px] text-muted">No references saved.</p>
              ) : (
                references.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2"
                  >
                    <PlatformIcon platform={r.platform} className="size-4 shrink-0 text-muted" />
                    <p className="min-w-0 flex-1 truncate text-[13px] text-fg">{r.title}</p>
                    {r.usedCount > 0 ? (
                      <span className="text-[11px] text-accent">used {formatNumber(r.usedCount)}×</span>
                    ) : (
                      <span className="text-[11px] text-faint">new</span>
                    )}
                  </a>
                ))
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
