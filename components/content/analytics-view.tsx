import Link from "next/link";
import { Eye, Heart, MessageCircle, Share2, Bookmark, Users, Send, TrendingUp } from "lucide-react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { PLATFORM_MAP, FORMAT_MAP } from "@/lib/domain/constants";
import { EmptyState } from "@/components/ui/misc";
import { BarChart3 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { AnalyticsData } from "@/lib/db/queries";

function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString(undefined, { month: "short" });
}

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  if (data.totals.posts === 0) {
    return (
      <EmptyState
        icon={<BarChart3 />}
        title="No performance data yet."
        description="Mark content as Posted and enter its metrics from the editor. Charts fill in automatically — no integrations required."
      />
    );
  }

  const totalTiles = [
    { label: "Posts", value: data.totals.posts, icon: Send, color: "#5b57e0" },
    { label: "Views", value: data.totals.views, icon: Eye, color: "#0ea5e9" },
    { label: "Likes", value: data.totals.likes, icon: Heart, color: "#ec4899" },
    { label: "Comments", value: data.totals.comments, icon: MessageCircle, color: "#8b5cf6" },
    { label: "Shares", value: data.totals.shares, icon: Share2, color: "#14b8a6" },
    { label: "Saves", value: data.totals.saves, icon: Bookmark, color: "#f59e0b" },
    { label: "Leads", value: data.totals.leads, icon: Users, color: "#22c55e" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {totalTiles.map((t) => (
          <div key={t.label} className="rounded-[var(--radius-lg)] border border-border bg-surface p-3.5 shadow-xs">
            <span className="flex size-7 items-center justify-center rounded-[var(--radius-sm)]" style={{ backgroundColor: `${t.color}1a`, color: t.color }}>
              <t.icon className="size-3.5" />
            </span>
            <div className="mt-2.5 text-[22px] font-semibold leading-none tracking-tight text-fg tabular-nums">
              {formatNumber(t.value)}
            </div>
            <div className="mt-1 text-[12px] text-muted">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Posts over time" hint="Last 6 months">
          <VBars
            data={data.postsOverTime.map((d) => ({ label: monthLabel(d.month), value: d.posts }))}
            color="var(--accent)"
          />
        </Panel>
        <Panel title="Views over time" hint="Last 6 months">
          <VBars
            data={data.viewsOverTime.map((d) => ({ label: monthLabel(d.month), value: d.views }))}
            color="#0ea5e9"
            format={formatNumber}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Content by platform">
          <HBars
            rows={data.byPlatform.map((p) => ({
              key: p.platform,
              label: PLATFORM_MAP[p.platform]?.label ?? p.platform,
              value: p.views,
              sub: `${p.posts} post${p.posts === 1 ? "" : "s"}`,
              icon: <PlatformIcon platform={p.platform} className="size-3.5 text-muted" />,
              color: PLATFORM_MAP[p.platform]?.color,
            }))}
            format={formatNumber}
          />
        </Panel>
        <Panel title="Best-performing format">
          <HBars
            rows={data.byFormat.map((f) => ({
              key: f.format,
              label: FORMAT_MAP[f.format]?.label ?? f.format,
              value: f.posts,
              sub: `${f.posts} post${f.posts === 1 ? "" : "s"}`,
              color: "var(--accent)",
            }))}
          />
        </Panel>
      </div>

      <Panel title="Best-performing content" icon={<TrendingUp className="size-4 text-muted" />}>
        {data.topContent.length === 0 ? (
          <p className="py-4 text-[13px] text-muted">No views recorded yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {data.topContent.map((c, i) => (
              <Link key={c.id} href={`/content/${c.id}`} className="flex items-center gap-3 py-2.5 transition-colors hover:bg-surface-2">
                <span className="w-5 text-center text-[13px] font-semibold text-faint tabular-nums">{i + 1}</span>
                <PlatformIcon platform={c.platform} className="size-4 shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg">{c.title}</span>
                <span className="inline-flex items-center gap-1 text-[12px] tabular-nums text-muted">
                  <Eye className="size-3.5" /> {formatNumber(c.views)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  hint,
  icon,
  children,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 text-[13px] font-semibold text-fg">
          {icon}
          {title}
        </h3>
        {hint && <span className="text-[11px] text-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function VBars({
  data,
  color,
  format = (n: number) => String(n),
}: {
  data: { label: string; value: number }[];
  color: string;
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-40 items-stretch gap-2">
      {data.map((d, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center gap-2">
          <div className="relative flex w-full flex-1 items-end justify-center">
            <div
              className="w-full rounded-t-[4px] transition-all"
              style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 6 : 0)}%`, minHeight: d.value > 0 ? 6 : 0, backgroundColor: color }}
            />
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-medium tabular-nums text-fg opacity-0 transition-opacity group-hover:opacity-100">
              {format(d.value)}
            </span>
          </div>
          <span className="text-[11px] text-faint">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function HBars({
  rows,
  format = (n: number) => String(n),
}: {
  rows: { key: string; label: string; value: number; sub?: string; icon?: React.ReactNode; color?: string }[];
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="py-4 text-[13px] text-muted">No data yet.</p>;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="inline-flex items-center gap-1.5 font-medium text-fg">
              {r.icon}
              {r.label}
            </span>
            <span className="tabular-nums text-muted">
              {format(r.value)} {r.sub && <span className="text-faint">· {r.sub}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, backgroundColor: r.color ?? "var(--accent)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
