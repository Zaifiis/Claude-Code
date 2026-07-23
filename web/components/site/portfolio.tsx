'use client';

import Image from 'next/image';
import { TiltCard } from '@/components/site/tilt-card';
import { FloatOrb } from '@/components/site/float-orb';
import { projects } from '@/lib/site-data';

export function Portfolio() {
  return (
    <section className="relative overflow-hidden bg-background px-6 pb-24 pt-32">
      <FloatOrb className="-left-24 top-1/3 h-72 w-72" color="var(--brand-600)" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 max-w-xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand-300">
            Selected work
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Recent projects
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((project) => (
            <TiltCard key={project.title} glare={false} className="overflow-hidden p-0">
              <div className="relative h-64 w-full">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020c45]/90 via-[#020c45]/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="text-xs uppercase tracking-widest text-neutral-300">
                    {project.category}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    {project.title}
                  </h3>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
