'use client';

import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden bg-black pt-16"
    >
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-6 py-20 md:flex-row">
        <div className="flex-1 relative z-10 text-center md:text-left">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-neutral-400">
            Design & 3D Studio
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-neutral-50 to-neutral-400 md:text-6xl">
            Interactive experiences for ambitious brands
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-neutral-300 md:mx-0">
            Nova Studio is a small team of designers and engineers who build brands,
            products, and 3D experiences that feel unmistakably alive.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:justify-start">
            <a
              href="#contact"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
            >
              Start a project
            </a>
            <a
              href="#work"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              See our work
            </a>
          </div>
        </div>

        <div className="relative h-[360px] w-full flex-1 md:h-[480px]">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full"
          />
        </div>
      </div>
    </section>
  );
}
