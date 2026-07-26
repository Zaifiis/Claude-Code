"use client";

import * as React from "react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type Resolver = (v: boolean) => void;

const ConfirmContext = React.createContext<(opts: ConfirmOptions) => Promise<boolean>>(
  async () => false,
);

export function useConfirm() {
  return React.useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmOptions | null>(null);
  const resolverRef = React.useRef<Resolver | null>(null);

  const confirm = React.useCallback((opts: ConfirmOptions) => {
    setState(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={!!state} onClose={() => settle(false)} className="max-w-sm">
        {state && (
          <>
            <div className="flex gap-3.5 px-5 pt-5">
              {state.destructive && (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                  <AlertTriangle className="size-4.5" />
                </div>
              )}
              <div className="min-w-0 pt-0.5">
                <h2 className="text-[15px] font-semibold text-fg">{state.title}</h2>
                {state.description && (
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{state.description}</p>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-border px-5 py-3.5">
              <Button variant="ghost" onClick={() => settle(false)}>
                {state.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                variant={state.destructive ? "danger" : "primary"}
                onClick={() => settle(true)}
                autoFocus
              >
                {state.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}
