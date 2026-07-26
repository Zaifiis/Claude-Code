'use client';

import { useEffect, useState } from 'react';
import { SERVICES } from '@/lib/site-config';
import { cn } from '@/lib/utils';

export function ServicesSubnav() {
  const [active, setActive] = useState(SERVICES[0].id);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    SERVICES.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div className="sticky top-20 z-30 -mx-5 mb-10 overflow-x-auto px-5">
      <div className="mx-auto flex w-max gap-1 rounded-full border border-border bg-[rgba(5,9,20,0.8)] p-1 backdrop-blur-xl">
        {SERVICES.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={cn(
              'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
              active === s.id && 'bg-gradient-to-r from-navy-800 to-navy-600 text-foreground',
            )}
          >
            {s.name}
          </a>
        ))}
      </div>
    </div>
  );
}
