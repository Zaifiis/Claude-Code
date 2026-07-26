'use client';

import { memo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  borderWidth?: number;
}

// Faithful recreation of the Aceternity "glowing-effect": a gradient arc that
// rides the element's border and rotates to point at the cursor. Themed to the
// Profinity blue palette. The heavy mask math lives in globals.css (.glow-arc).
const GlowingEffect = memo(function GlowingEffect({
  blur = 0,
  inactiveZone = 0.7,
  proximity = 0,
  spread = 20,
  glow = false,
  className,
  disabled = false,
  borderWidth = 1,
}: GlowingEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const handleMove = useCallback(
    (e?: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const { left, top, width, height } = el.getBoundingClientRect();
        const mouseX = e?.clientX ?? lastPos.current.x;
        const mouseY = e?.clientY ?? lastPos.current.y;
        if (e) lastPos.current = { x: mouseX, y: mouseY };

        const cx = left + width * 0.5;
        const cy = top + height * 0.5;
        const dist = Math.hypot(mouseX - cx, mouseY - cy);
        const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

        if (dist < inactiveRadius) {
          el.style.setProperty('--active', '0');
          return;
        }

        const active =
          mouseX > left - proximity &&
          mouseX < left + width + proximity &&
          mouseY > top - proximity &&
          mouseY < top + height + proximity;

        el.style.setProperty('--active', active ? '1' : '0');
        if (!active) return;

        const current = parseFloat(el.style.getPropertyValue('--start')) || 0;
        const target = (180 * Math.atan2(mouseY - cy, mouseX - cx)) / Math.PI + 90;
        const diff = ((target - current + 180) % 360) - 180;
        el.style.setProperty('--start', String(current + diff));
      });
    },
    [inactiveZone, proximity],
  );

  useEffect(() => {
    if (disabled) return;
    const onScroll = () => handleMove();
    const onMove = (e: PointerEvent) => handleMove(e);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.body.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', onScroll);
      document.body.removeEventListener('pointermove', onMove);
    };
  }, [handleMove, disabled]);

  return (
    <div
      ref={containerRef}
      style={
        {
          '--spread': spread,
          '--start': '0',
          '--active': '0',
          '--glow-border-width': `${borderWidth}px`,
          '--blur': `${blur}px`,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        glow ? 'opacity-100' : 'opacity-0',
        disabled && 'hidden',
        className,
      )}
    >
      <div className="glow-arc" />
    </div>
  );
});

export { GlowingEffect };
