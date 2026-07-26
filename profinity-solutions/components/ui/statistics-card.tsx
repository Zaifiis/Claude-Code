'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';
import { STATS } from '@/lib/site-config';

function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return <span ref={ref}>{val}</span>;
}

export function Stats() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
      {STATS.map((s) => (
        <div key={s.label} className="bg-surface px-6 py-10 text-center">
          <div className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            <span className="text-gradient">
              {'prefix' in s && s.prefix}
              <Counter to={s.value} />
              {'suffix' in s && s.suffix}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
