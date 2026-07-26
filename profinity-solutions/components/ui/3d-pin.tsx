'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// Faithful recreation of the Aceternity "3d-pin": the card tilts into 3D on
// hover while a floating "pin" label rises above it. Themed to brand blue.
export function PinContainer({
  children,
  title,
  href,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  title?: string;
  href?: string;
  className?: string;
  containerClassName?: string;
}) {
  const [transform, setTransform] = useState(
    'translate(-50%,-50%) rotateX(0deg) scale(1)',
  );

  const onEnter = () =>
    setTransform('translate(-50%,-50%) rotateX(40deg) scale(0.8)');
  const onLeave = () =>
    setTransform('translate(-50%,-50%) rotateX(0deg) scale(1)');

  const Wrapper = (href ? Link : 'div') as typeof Link;
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      className={cn('group/pin relative z-10 cursor-pointer', containerClassName)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      {...(wrapperProps as { href: string })}
    >
      <div
        style={{ perspective: '1000px', transform: 'rotateX(70deg) translateZ(0deg)' }}
        className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          style={{ transform }}
          className="absolute left-1/2 top-1/2 flex items-start justify-start overflow-hidden rounded-2xl border border-border bg-surface/70 p-4 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-sm transition duration-700 group-hover/pin:border-brand-blue/40"
        >
          <div className={cn('relative z-50', className)}>{children}</div>
        </div>
      </div>

      <PinLabel title={title} />
    </Wrapper>
  );
}

function PinLabel({ title }: { title?: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex w-full flex-col items-center justify-center">
      <div className="relative z-10 flex w-full items-center justify-center opacity-0 transition duration-500 group-hover/pin:opacity-100">
        <div className="relative flex items-center gap-2 rounded-full bg-navy-900/80 px-4 py-0.5 ring-1 ring-brand-blue/40">
          <span className="relative z-20 text-xs font-bold text-brand-light2">
            {title}
          </span>
        </div>
      </div>

      {/* the three glowing lines / halo of the pin */}
      <div
        style={{ perspective: '1000px', transform: 'rotateX(70deg) translateZ(0)' }}
        className="absolute left-1/2 top-1/2 mt-2 -translate-x-1/2 -translate-y-1/2"
      >
        {[0, 2, 4].map((delay) => (
          <span
            key={delay}
            style={{ animationDelay: `${delay}s` }}
            className="absolute left-1/2 top-1/2 h-[11.25rem] w-[11.25rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-glow/[0.08] opacity-0 shadow-[0_0_60px_4px_rgba(56,189,248,0.25)] [animation:pin-ping_6s_cubic-bezier(0.19,1,0.22,1)_infinite] group-hover/pin:opacity-100"
          />
        ))}
      </div>

      <div className="absolute bottom-1/2 right-1/2 h-20 w-px translate-y-[14px] bg-gradient-to-b from-transparent to-brand-glow/60 opacity-0 transition duration-500 group-hover/pin:opacity-100" />
      <div className="absolute bottom-1/2 right-1/2 h-2 w-2 translate-x-[1px] translate-y-[14px] rounded-full bg-brand-glow opacity-0 blur-[2px] transition duration-500 group-hover/pin:opacity-100" />
    </div>
  );
}
