'use client';

import { Fragment } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ChevronRight, type LucideIcon } from 'lucide-react';

export type Step = { icon: LucideIcon; title: string; desc: string };

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

// A horizontal (desktop) / vertical (mobile) sequence of step cards joined by
// chevrons, revealed in order. Shared by the home AgentFlow tabs and the blog
// case-study flow blocks. Remount (via `key`) to replay the reveal.
export function StepFlow({ steps }: { steps: Step[] }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={reduce ? undefined : container}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="flex flex-col lg:flex-row lg:items-stretch"
    >
      {steps.map((step, i) => {
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
                <h4 className="font-display text-sm font-semibold text-foreground">{step.title}</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            </motion.div>

            {i < steps.length - 1 && (
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
  );
}
