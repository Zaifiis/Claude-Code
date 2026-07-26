'use client';

import { type ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GridTestimonial = { imgSrc: string; alt: string };

// An animated wall of client avatars that gently drift in vertical columns
// behind a centered headline + CTA. Avatars are decorative social proof; the
// image sources come from config so they stay swappable.
export function AnimatedTestimonialGrid({
  testimonials,
  title,
  description,
  ctaText,
  ctaHref,
  className,
}: {
  testimonials: GridTestimonial[];
  title: ReactNode;
  description: string;
  ctaText: string;
  ctaHref: string;
  className?: string;
}) {
  // Split the avatars into 4 columns and duplicate each column so the marquee
  // loops seamlessly.
  const columns = useMemo(() => {
    const cols: GridTestimonial[][] = [[], [], [], []];
    testimonials.forEach((t, i) => cols[i % 4].push(t));
    return cols.map((c) => (c.length ? c : testimonials.slice(0, 3)));
  }, [testimonials]);

  return (
    <section
      className={cn(
        'relative isolate overflow-hidden rounded-[2rem] border border-border bg-surface/40 px-5 py-20 sm:px-8 md:py-28',
        className,
      )}
    >
      {/* Avatar wall */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex justify-center gap-3 opacity-[0.5] sm:gap-4 md:opacity-60 [mask-image:radial-gradient(circle_at_center,transparent_5%,#000_78%)]"
      >
        {columns.map((col, ci) => (
          <div
            key={ci}
            className="flex w-[22%] max-w-[150px] flex-col gap-3 sm:gap-4"
            style={{ animation: `avatar-marquee ${34 + ci * 6}s linear infinite`, animationDirection: ci % 2 ? 'reverse' : 'normal' }}
          >
            {[...col, ...col].map((t, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${ci}-${i}`}
                src={t.imgSrc}
                alt=""
                loading="lazy"
                className="aspect-square w-full rounded-2xl border border-border object-cover grayscale"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Scrim so text stays readable over the wall */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(5,9,20,0.92)_35%,rgba(5,9,20,0.55)_100%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto flex max-w-xl flex-col items-center text-center"
      >
        <div className="mb-5 flex items-center gap-1 rounded-full border border-border bg-surface/70 px-3 py-1.5 backdrop-blur">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-brand-light text-brand-light" />
          ))}
          <span className="ml-1.5 text-xs font-medium text-muted-foreground">Loved by teams</span>
        </div>

        <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl md:text-5xl">
          {title}
        </h2>
        <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">{description}</p>

        <Link
          href={ctaHref}
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.8)] transition-transform hover:scale-[1.03]"
        >
          {ctaText}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </section>
  );
}
