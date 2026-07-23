'use client';

import { TiltCard } from '@/components/site/tilt-card';
import { testimonials } from '@/lib/site-data';

export function About() {
  return (
    <section id="about" className="bg-black px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-neutral-400">
              About us
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              A small studio, obsessed with craft
            </h2>
            <p className="mt-6 text-neutral-300">
              Nova Studio was founded to close the gap between good ideas and great
              execution. We&apos;re a tight team of designers, engineers, and 3D
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

          <div className="flex flex-col gap-6">
            {testimonials.map((testimonial) => (
              <TiltCard key={testimonial.name} className="p-6">
                <p className="text-neutral-200">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-medium text-white">
                  {testimonial.name}
                </p>
                <p className="text-sm text-neutral-400">{testimonial.role}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
