import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
  hint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
  href?: string;
  hint?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span
          className="flex size-8 items-center justify-center rounded-[var(--radius-sm)]"
          style={{ backgroundColor: `${color ?? "#5b57e0"}1a`, color: color ?? "var(--accent)" }}
        >
          <Icon className="size-4" />
        </span>
        {href && (
          <ArrowUpRight className="size-4 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
      <div className="mt-3">
        <div className="text-[26px] font-semibold leading-none tracking-tight text-fg tabular-nums">{value}</div>
        <div className="mt-1.5 text-[13px] text-muted">{label}</div>
        {hint && <div className="mt-0.5 text-[11px] text-faint">{hint}</div>}
      </div>
    </>
  );

  const cls = cn(
    "group flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-xs transition-all",
    href && "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
  );

  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
