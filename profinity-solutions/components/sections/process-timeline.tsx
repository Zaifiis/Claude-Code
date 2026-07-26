'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { PROCESS_STEPS } from '@/lib/site-config';

export function ProcessTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 70%', 'end 60%'],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <div ref={ref} className="relative mx-auto max-w-3xl">
      {/* rail */}
      <div className="absolute left-[19px] top-2 h-[calc(100%-1rem)] w-px bg-border md:left-1/2" />
      <motion.div
        style={{ scaleY }}
        className="absolute left-[19px] top-2 h-[calc(100%-1rem)] w-px origin-top bg-gradient-to-b from-brand-light2 via-brand-blue to-navy-600 md:left-1/2"
      />

      <div className="space-y-10">
        {PROCESS_STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5 }}
            className={`relative flex items-start gap-6 pl-12 md:pl-0 ${
              i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
            } md:items-center md:gap-10`}
          >
            {/* node */}
            <span className="absolute left-2 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-brand-blue/50 bg-surface text-xs font-bold text-brand-light md:static md:left-1/2">
              {step.n}
            </span>
            <div className="flex-1 md:text-right md:[&:nth-child(odd)]:text-left">
              <h3 className="font-display text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
            <div className="hidden flex-1 md:block" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
