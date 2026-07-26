'use client';

import { AnimatedNumber } from '@/components/ui/animated-number';

export type CalcData = {
  title: string;
  rows: { label: string; value: string }[];
  result: { label: string; value: number; prefix?: string; suffix?: string };
};

// A plain-English money calculation for the case-study posts: a few rows of
// simple before/after figures, then one big animated result.
export function PostCalc({ data }: { data: CalcData }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/50 p-6">
      <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
        {data.title}
      </h4>
      <ul className="mt-5 divide-y divide-border">
        {data.rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-display font-semibold text-foreground">{r.value}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-base/60 px-5 py-4">
        <span className="text-sm font-medium text-foreground">{data.result.label}</span>
        <span className="font-display text-2xl font-bold text-gradient sm:text-3xl">
          <AnimatedNumber
            to={data.result.value}
            prefix={data.result.prefix}
            suffix={data.result.suffix}
          />
        </span>
      </div>
    </div>
  );
}
