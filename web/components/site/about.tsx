'use client';

import { CircularTestimonials } from '@/components/ui/circular-testimonials';
import { FloatOrb } from '@/components/site/float-orb';
import { testimonials } from '@/lib/site-data';

export function About() {
  return (
    <section className="relative overflow-hidden bg-background px-6 pb-24 pt-32">
      <FloatOrb className="-right-24 top-0 h-96 w-96" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand-300">
            About us
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            A small studio, obsessed with craft
          </h2>
          <p className="mt-6 text-neutral-300">
            Profinity Solutions was founded to close the gap between good ideas and
            great execution. We&apos;re a tight team of designers, engineers, and 3D
            artists who work directly with founders and product teams — no layers,
            no hand-offs, just the people building your product.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
            <div>
              <p className="text-3xl font-bold text-white">40+</p>
              <p className="mt-1 text-sm text-neutral-400">Projects shipped</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">8</p>
              <p className="mt-1 text-sm text-neutral-400">Years in business</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">12</p>
              <p className="mt-1 text-sm text-neutral-400">Team members</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <CircularTestimonials
            testimonials={testimonials}
            autoplay
            colors={{
              name: '#ffffff',
              designation: '#a3a3a3',
              testimony: '#e5e5e5',
              arrowBackground: '#0b1a63',
              arrowForeground: '#f1f1f7',
              arrowHoverBackground: '#4f8ef7',
            }}
            fontSizes={{
              name: '22px',
              designation: '16px',
              quote: '18px',
            }}
          />
        </div>
      </div>
    </section>
  );
}
