"use client";

import { ChevronDownIcon } from "./icons";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Every control clears 44×44pt, so nothing is fiddly on a phone. */
const TAP = "min-h-11";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent";
const MOTION = "transition-[background-color,color,box-shadow,opacity,transform] duration-[var(--st-dur-fast)] ease-st";

type ButtonVariant = "accent" | "tinted" | "quiet" | "plain";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  accent: "bg-st-accent text-st-on-accent hover:bg-st-accent-hover",
  tinted: "bg-st-accent-soft text-st-accent hover:brightness-105",
  quiet: "bg-st-fill text-st-text hover:bg-st-fill-hover",
  plain: "text-st-text-2 hover:bg-st-fill hover:text-st-text",
};

export function Button({
  variant = "quiet",
  className,
  type = "button",
  ...props
}: React.ComponentPropsWithRef<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-st-control px-4 st-callout font-medium",
        TAP,
        MOTION,
        FOCUS,
        "disabled:pointer-events-none disabled:opacity-40",
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({
  label,
  className,
  type = "button",
  active = false,
  ...props
}: React.ComponentPropsWithRef<"button"> & { label: string; active?: boolean }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-st-control",
        MOTION,
        FOCUS,
        active ? "bg-st-accent-soft text-st-accent" : "text-st-text-2 hover:bg-st-fill hover:text-st-text",
        className,
      )}
      {...props}
    />
  );
}

/** iOS-style segmented control: one accent-free track, quiet selected chip. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string; icon?: React.ReactNode }>;
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-1 rounded-st-control bg-st-fill p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[7px] px-3 st-footnote font-medium",
              MOTION,
              FOCUS,
              selected
                ? "bg-st-surface text-st-text shadow-st-card"
                : "text-st-text-2 hover:text-st-text",
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const INPUT_BASE = cx(
  "w-full rounded-st-control bg-st-fill px-3 st-body text-st-text",
  "border border-transparent outline-none placeholder:text-st-text-3",
  "focus:border-st-accent focus:bg-st-surface",
  MOTION,
);

export function TextInput({
  className,
  ...props
}: React.ComponentPropsWithRef<"input">) {
  return <input className={cx(INPUT_BASE, TAP, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: React.ComponentPropsWithRef<"textarea">) {
  return <textarea className={cx(INPUT_BASE, "resize-y py-2.5 leading-[1.55]", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.ComponentPropsWithRef<"select">) {
  return (
    <div className="relative">
      <select
        className={cx(INPUT_BASE, TAP, "appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-st-text-3" />
    </div>
  );
}

/**
 * A labelled control. With no `htmlFor` the label wraps the control, which
 * associates the two without needing an id; pass `htmlFor` when the control
 * already has one. For a group holding several controls use `FieldGroup`,
 * since a label can only ever name one of them.
 */
export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  if (htmlFor) {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={htmlFor} className="st-caption text-st-text-3">
          {label}
        </label>
        {children}
        {hint ? <p className="st-footnote text-st-text-3">{hint}</p> : null}
      </div>
    );
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="st-caption text-st-text-3">{label}</span>
      {children}
      {hint ? <span className="st-footnote text-st-text-3">{hint}</span> : null}
    </label>
  );
}

/** Like `Field`, but for a set of controls that each carry their own label. */
export function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <p className="st-caption text-st-text-3">{label}</p>
      {children}
      {hint ? <p className="st-footnote text-st-text-3">{hint}</p> : null}
    </div>
  );
}

export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 st-footnote whitespace-nowrap",
        tone === "accent" ? "bg-st-accent-soft text-st-accent" : "bg-st-fill text-st-text-2",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * A filter chip. The accent is reserved for a chip that is actually narrowing
 * what you see; `quiet` marks the "everything" chip as current without
 * colouring it, so a dashboard with no filters on stays calm.
 */
export function Chip({
  selected,
  quiet,
  children,
  className,
  ...props
}: React.ComponentPropsWithRef<"button"> & { selected?: boolean; quiet?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 st-footnote font-medium",
        MOTION,
        FOCUS,
        selected
          ? quiet
            ? "bg-st-surface text-st-text shadow-st-card"
            : "bg-st-accent text-st-on-accent"
          : "bg-st-fill text-st-text-2 hover:bg-st-fill-hover hover:text-st-text",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("rounded-st-panel bg-st-surface shadow-st-card", className)}>{children}</div>
  );
}

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <p className="st-title-3 text-st-text">{title}</p>
      <p className="st-callout st-measure text-st-text-2">{body}</p>
      {children}
    </div>
  );
}
