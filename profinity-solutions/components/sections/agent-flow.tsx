'use client';

import { Fragment, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { AGENT_FLOWS } from '@/lib/site-config';
import { cn } from '@/lib/utils';

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13 } },
};
const node: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const link: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

// Animated "how an AI calling agent works" explainer. Calculator-style tabs on
// top switch between outcome-framed flows; the steps animate in as a sequence.
export function AgentFlow() {
  const [active, setActive] = useState(AGENT_FLOWS[0].id);
  const reduce = useReducedMotion();
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

        {/* Re-keying by flow id replays the staggered reveal on every tab change */}
        <motion.div
          key={flow.id}
          variants={reduce ? undefined : container}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="flex flex-col lg:flex-row lg:items-stretch"
        >
          {flow.steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Fragment key={step.title}>
                <motion.div variants={reduce ? undefined : node} className="flex-1">
                  <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-base/50 p-5 text-center">
                    <span className="relative flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_24px_-10px_rgba(59,130,246,0.8)]">
                      <Icon className="h-5 w-5" />
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-base text-[10px] font-bold text-brand-light">
                        {i + 1}
                      </span>
                    </span>
                    <h4 className="font-display text-sm font-semibold text-foreground">
                      {step.title}
                    </h4>
                    <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                </motion.div>

                {i < flow.steps.length - 1 && (
                  <motion.div
                    variants={reduce ? undefined : link}
                    aria-hidden
                    className="flex items-center justify-center py-1 text-brand-light lg:px-1 lg:py-0"
                  >
                    <ChevronRight className="h-5 w-5 rotate-90 lg:rotate-0" />
                  </motion.div>
                )}
              </Fragment>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
