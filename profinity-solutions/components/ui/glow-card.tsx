import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { cn } from '@/lib/utils';

// Bento cell wrapper with the cursor-tracked glow border. Used by the home
// services grid and the About values grid. When `href` is set the whole card
// becomes a link to the service's dedicated page.
export function GlowCard({
  area,
  icon,
  title,
  description,
  href,
  cta = 'Learn more',
  className,
}: {
  area?: string;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  href?: string;
  cta?: string;
  className?: string;
}) {
  const body = (
    <div
      className={cn(
        'relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-[0px_0px_27px_0px_rgba(6,12,28,0.6)] transition-colors',
        href && 'group-hover/card:border-brand-blue/50',
        className,
      )}
    >
      <div className="relative flex flex-1 flex-col justify-between gap-3">
        <div className="w-fit rounded-lg border border-border bg-muted p-2.5 text-brand-light">
          {icon}
        </div>
        <div className="space-y-3">
          <h3 className="pt-0.5 font-display text-xl font-semibold tracking-[-0.03em] text-foreground md:text-2xl">
            {title}
          </h3>
          <p className="font-sans text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
      </div>
      {href && (
        <span className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-brand-light">
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover/card:translate-x-1" />
        </span>
      )}
    </div>
  );

  return (
    <li className={cn('min-h-[14rem] list-none', area)}>
      <div className="relative h-full rounded-[1.25rem] border border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect spread={42} glow proximity={64} inactiveZone={0.01} borderWidth={3} />
        {href ? (
          <Link href={href} className="group/card block h-full">
            {body}
          </Link>
        ) : (
          body
        )}
      </div>
    </li>
  );
}
