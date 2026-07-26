'use client';

import { useState } from 'react';
import { AGENT_FLOWS } from '@/lib/site-config';
import { StepFlow } from '@/components/ui/step-flow';
import { cn } from '@/lib/utils';

// Animated "how an AI calling agent works" explainer. Calculator-style tabs on
// top switch between outcome-framed flows; the shared StepFlow animates the
// steps in as a sequence (re-keyed per tab so it replays on switch).
export function AgentFlow() {
  const [active, setActive] = useState(AGENT_FLOWS[0].id);
  const flow = AGENT_FLOWS.find((f) => f.id === active) ?? AGENT_FLOWS[0];

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-surface/50">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-border p-3">
        {AGENT_FLOWS.map((f) => {
          const Icon = f.icon;
          const on = f.id === active;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActive(f.id)}
              aria-pressed={on}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                on
                  ? 'bg-gradient-to-r from-navy-800 to-navy-600 text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="p-6 md:p-8">
        <p className="mb-8 text-center text-sm text-muted-foreground">{flow.tagline}</p>
        <StepFlow key={flow.id} steps={flow.steps} />
      </div>
    </div>
  );
}
