'use client';

import Link from 'next/link';
import { ArrowRight, Palette, Boxes, Users } from 'lucide-react';
import { TiltCard } from '@/components/site/tilt-card';
import { FloatOrb } from '@/components/site/float-orb';

const highlights = [
  {
    icon: Palette,
    title: 'Services',
    description: 'Brand, web, 3D, and product strategy under one roof.',
    href: '/services',
  },
  {
    icon: Boxes,
    title: 'Work',
    description: 'A look at the products and brands we’ve shipped.',
    href: '/work',
  },
  {
    icon: Users,
    title: 'About',
    description: 'Who we are, and what our clients say about working with us.',
    href: '/about',
  },
];

export function HomeHighlights() {
  return (
    <section className="relative overflow-hidden bg-background px-6 py-24">
      <FloatOrb className="left-1/2 top-0 h-96 w-96 -translate-x-1/2" />

      <div className="relative mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <TiltCard className="h-full p-8">
                <Icon className="mb-4 h-8 w-8 text-brand-300" strokeWidth={1.5} />
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-400">{item.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-300">
                  Explore <ArrowRight size={14} />
                </span>
              </TiltCard>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
