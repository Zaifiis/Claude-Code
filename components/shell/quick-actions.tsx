"use client";

import * as React from "react";
import { Plus, Bookmark, CalendarClock, PenLine } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useUI } from "./ui-provider";
import type { QuickAddTab } from "./quick-add-modal";

const LABELS: Record<QuickAddTab, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  idea: { label: "New Content", icon: Plus },
  script: { label: "New Script", icon: PenLine },
  reference: { label: "Save Reference", icon: Bookmark },
  schedule: { label: "Schedule Content", icon: CalendarClock },
};

export function QuickAddButton({
  tab = "idea",
  children,
  ...props
}: { tab?: QuickAddTab } & ButtonProps) {
  const { openQuickAdd } = useUI();
  const meta = LABELS[tab];
  return (
    <Button onClick={() => openQuickAdd(tab)} {...props}>
      <meta.icon className="size-4" />
      {children ?? meta.label}
    </Button>
  );
}
