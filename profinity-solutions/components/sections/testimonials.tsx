'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import MovingDotCard from '@/components/ui/moving-dot-card';
import { TESTIMONIALS } from '@/lib/site-config';

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Testimonials() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const n = TESTIMONIALS.length;

  const go = useCallback(
    (next: number) => {
      setDir(next > i || (i === n - 1 && next === 0) ? 1 : -1);
      setI((next + n) % n);
    },
    [i, n],
  );

  // Auto-advance, paused for reduced-motion users.
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      setDir(1);
      setI((p) => (p + 1) % n);
    }, 6000);
    return () => clearInterval(t);
  }, [n, reduce]);

  const t = TESTIMONIALS[i];

  return (
    <div className="mx-auto max-w-3xl">
      <MovingDotCard radius="1.5rem">
        <div className="relative min-h-[19rem] p-8 sm:p-10">
          <Quote className="h-9 w-9 text-brand-light/50" />
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={i}
              custom={dir}
              initial={reduce ? false : { opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mt-4 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-brand-light text-brand-light" />
                ))}
              </div>
              <blockquote className="mt-4 font-display text-xl font-medium leading-relaxed tracking-[-0.01em] text-foreground sm:text-2xl">
                “{t.quote}”
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-gradient font-display text-sm font-bold text-white">
                  {initials(t.name)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </MovingDotCard>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous testimonial"
          onClick={() => go(i - 1)}
          className="rounded-full border border-border bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          {TESTIMONIALS.map((_, d) => (
            <button
              key={d}
              type="button"
              aria-label={`Go to testimonial ${d + 1}`}
              aria-current={d === i}
              onClick={() => go(d)}
              className={`h-2 rounded-full transition-all ${
                d === i ? 'w-6 bg-brand-light' : 'w-2 bg-border hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next testimonial"
          onClick={() => go(i + 1)}
          className="rounded-full border border-border bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
