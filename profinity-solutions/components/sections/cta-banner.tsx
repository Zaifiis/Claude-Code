import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MovingDotCard from '@/components/ui/moving-dot-card';
import { Reveal } from '@/components/reveal';
import { SITE_CONFIG } from '@/lib/site-config';

export function CtaBanner() {
  return (
    <Reveal>
      <MovingDotCard radius="1.5rem" className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[calc(1.5rem-1.5px)] px-6 py-14 text-center sm:px-14">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(60% 120% at 50% 0%, rgba(33,89,201,0.22), transparent 70%)',
            }}
          />
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            Ready to put AI to work in your business?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Book a free automation audit and we&apos;ll map exactly where AI agents save
            you time and win you more customers.
          </p>
          <Link
            href={SITE_CONFIG.primaryCta.href}
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_36px_-10px_rgba(59,130,246,0.75)] transition-transform hover:scale-[1.03]"
          >
            {SITE_CONFIG.primaryCta.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </MovingDotCard>
    </Reveal>
  );
}
