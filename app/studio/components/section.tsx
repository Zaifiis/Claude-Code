"use client";

import { cx } from "./ui";

/** Each section of an idea gets its own colour, so it is findable at a glance. */
export type SectionColor = "indigo" | "pink" | "teal" | "orange" | "green" | "neutral";

const COLOR: Record<SectionColor, { text: string; soft: string; bar: string }> = {
  indigo: { text: "text-st-indigo", soft: "bg-st-indigo-soft", bar: "bg-st-indigo" },
  pink: { text: "text-st-pink", soft: "bg-st-pink-soft", bar: "bg-st-pink" },
  teal: { text: "text-st-teal", soft: "bg-st-teal-soft", bar: "bg-st-teal" },
  orange: { text: "text-st-orange", soft: "bg-st-orange-soft", bar: "bg-st-orange" },
  green: { text: "text-st-green", soft: "bg-st-green-soft", bar: "bg-st-green" },
  neutral: { text: "text-st-text-3", soft: "bg-st-fill", bar: "bg-st-text-3" },
};

export function sectionColor(color: SectionColor) {
  return COLOR[color];
}

export function Section({
  title,
  color,
  hint,
  action,
  children,
}: {
  title: string;
  color: SectionColor;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const tone = COLOR[color];

  return (
    <section className="relative overflow-hidden rounded-st-panel bg-st-surface shadow-st-card">
      {/* A colour down the edge: enough to identify, quiet enough to ignore. */}
      <span aria-hidden="true" className={cx("absolute inset-y-0 left-0 w-1", tone.bar)} />
      <div className="flex flex-col gap-4 p-6 pl-7">
        <div className="flex items-center gap-3">
          <h2 className={cx("st-caption", tone.text)}>{title}</h2>
          {hint ? <p className="st-footnote text-st-text-3">{hint}</p> : null}
          {action ? <div className="ml-auto">{action}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
