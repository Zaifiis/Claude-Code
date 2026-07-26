'use client';

import { AnimatedNumber } from '@/components/ui/animated-number';
import { STATS } from '@/lib/site-config';

export function Stats() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
      {STATS.map((s) => (
        <div key={s.label} className="bg-surface px-6 py-10 text-center">
          <div className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            <span className="text-gradient">
              <AnimatedNumber
                to={s.value}
                prefix={'prefix' in s ? s.prefix : ''}
                suffix={'suffix' in s ? s.suffix : ''}
              />
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
