"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "start" | "end";
  className?: string;
  contentClassName?: string;
}

/** Lightweight click-triggered menu with outside-click + Esc handling. */
export function Dropdown({ trigger, children, align = "end", className, contentClassName }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute z-40 mt-1.5 min-w-[180px] overflow-hidden rounded-[var(--radius-md)] border border-border bg-elevated p-1 shadow-pop",
              align === "end" ? "right-0" : "left-0",
              contentClassName,
            )}
            role="menu"
          >
            {typeof children === "function" ? children(close) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  destructive,
  icon: Icon,
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[var(--radius-xs)] px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        destructive ? "text-danger hover:bg-danger/10" : "text-fg hover:bg-surface-2",
        className,
      )}
    >
      {Icon && <Icon className="size-4 shrink-0 opacity-80" />}
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-faint">{children}</div>;
}
