import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// A card whose border carries a glowing light-blue dot with a trailing
// gradient that continuously travels around the perimeter. Implemented as a
// rotating conic gradient revealed only along the border ring.
export default function MovingDotCard({
  children,
  className,
  innerClassName,
  radius = '1rem',
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  radius?: string;
}) {
  return (
    <div
      className={cn('relative overflow-hidden p-[1.5px]', className)}
      style={{ borderRadius: radius }}
    >
      <span className="moving-dot-glow" aria-hidden />
      <div
        className={cn('relative h-full w-full bg-surface', innerClassName)}
        style={{ borderRadius: `calc(${radius} - 1.5px)` }}
      >
        {children}
      </div>
    </div>
  );
}
