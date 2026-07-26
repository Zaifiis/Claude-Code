"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover shadow-xs active:translate-y-px",
  secondary:
    "bg-surface-2 text-fg hover:bg-border border border-border active:translate-y-px",
  outline:
    "border border-border-strong text-fg hover:bg-surface-2 active:translate-y-px",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-danger text-white hover:bg-danger-hover shadow-xs active:translate-y-px",
  subtle: "bg-accent-soft text-accent hover:brightness-105",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-[var(--radius-sm)] gap-1.5",
  md: "h-9 px-3.5 text-sm rounded-[var(--radius-sm)] gap-2",
  lg: "h-11 px-5 text-[15px] rounded-[var(--radius-md)] gap-2",
  icon: "h-9 w-9 rounded-[var(--radius-sm)] justify-center",
  "icon-sm": "h-8 w-8 rounded-[var(--radius-sm)] justify-center",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center font-medium whitespace-nowrap select-none transition-[background,color,box-shadow,transform] duration-150",
          "disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
