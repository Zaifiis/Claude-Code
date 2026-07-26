"use client";

import * as React from "react";
import { ConfirmProvider } from "@/components/ui/confirm";
import { CommandPalette } from "./command-palette";
import { QuickAddModal, type QuickAddTab } from "./quick-add-modal";

interface UICtx {
  openQuickAdd: (tab?: QuickAddTab) => void;
  openCommand: () => void;
}

const Ctx = React.createContext<UICtx>({ openQuickAdd: () => {}, openCommand: () => {} });
export const useUI = () => React.useContext(Ctx);

function isTypingTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    node.isContentEditable === true
  );
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [quickAdd, setQuickAdd] = React.useState<{ open: boolean; tab: QuickAddTab }>({
    open: false,
    tab: "idea",
  });

  const openQuickAdd = React.useCallback((tab: QuickAddTab = "idea") => {
    setCommandOpen(false);
    setQuickAdd({ open: true, tab });
  }, []);
  const openCommand = React.useCallback(() => setCommandOpen(true), []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n" || e.key === "N") {
        // don't hijack when a dialog is already open
        if (commandOpen || quickAdd.open) return;
        e.preventDefault();
        openQuickAdd("idea");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandOpen, quickAdd.open, openQuickAdd]);

  return (
    <Ctx.Provider value={{ openQuickAdd, openCommand }}>
      <ConfirmProvider>
        {children}
        <CommandPalette
          open={commandOpen}
          onClose={() => setCommandOpen(false)}
          openQuickAdd={openQuickAdd}
        />
        <QuickAddModal
          open={quickAdd.open}
          tab={quickAdd.tab}
          onClose={() => setQuickAdd((s) => ({ ...s, open: false }))}
        />
      </ConfirmProvider>
    </Ctx.Provider>
  );
}
