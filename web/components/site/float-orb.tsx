'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

type FloatOrbProps = {
  className?: string;
  color?: string;
};

export function FloatOrb({ className, color = 'var(--brand-500)' }: FloatOrbProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-60, 60]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

  return (
    <div ref={ref} className={cn('pointer-events-none absolute -z-10', className)}>
      <motion.div
        style={{
          y,
          rotate,
          background: `radial-gradient(circle at 35% 35%, ${color}, transparent 70%)`,
        }}
        className="h-full w-full rounded-full opacity-30 blur-3xl"
      />
    </div>
  );
}
