'use client';

import { Palette, Code2, Box, Compass, type LucideIcon } from 'lucide-react';
import { TiltCard } from '@/components/site/tilt-card';
import { services } from '@/lib/site-data';

const icons: Record<string, LucideIcon> = { Palette, Code2, Box, Compass };

export function Services() {
  return (
    <section id="services" className="bg-black px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-neutral-400">
            What we do
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Everything a modern brand needs to stand out
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = icons[service.icon];
            return (
              <TiltCard key={service.title} className="p-6">
                <Icon className="mb-4 h-8 w-8 text-white" strokeWidth={1.5} />
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {service.title}
                </h3>
                <p className="text-sm text-neutral-400">{service.description}</p>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
