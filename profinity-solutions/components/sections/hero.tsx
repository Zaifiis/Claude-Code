'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/site-config';

// Lazy-load the three.js hero so it never blocks first paint or SSR.
const HeroCanvas = dynamic(() => import('@/components/sections/hero-canvas'), {
  ssr: false,
});

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export function Hero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);

    // Pause the render loop when the hero scrolls off-screen or tab is hidden.
    const el = sectionRef.current;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting && !document.hidden),
      { threshold: 0.05 },
    );
    if (el) io.observe(el);
    const onVis = () => setActive(!document.hidden && (el ? isElementInView(el) : true));
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const words = SITE_CONFIG.heroHeadline.split(' ');

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      {/* 3D field, or a static gradient for reduced-motion / before mount */}
      {mounted && !reduced ? (
        <HeroCanvas count={isMobile ? 9 : 18} active={active} />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 40%, rgba(33,89,201,0.25), transparent 70%), radial-gradient(40% 40% at 70% 70%, rgba(125,211,252,0.18), transparent 70%)',
          }}
        />
      )}

      {/* Vignette so the headline stays readable over the cubes */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(5,9,20,0.55) 0%, rgba(5,9,20,0.2) 45%, transparent 75%)',
        }}
      />

      <div className="container-x relative z-10 flex flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-[rgba(10,18,38,0.6)] px-4 py-1.5 text-xs font-medium text-brand-light backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-glow" />
          AI Automation Agency
        </motion.span>

        <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-6xl md:text-7xl">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={reduced ? false : { opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
              className="mr-[0.25em] inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 + words.length * 0.08 }}
          className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          {SITE_CONFIG.heroSubline}
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 + words.length * 0.08 }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            href={SITE_CONFIG.primaryCta.href}
            className="group inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(59,130,246,0.7)] transition-transform hover:scale-[1.03]"
          >
            {SITE_CONFIG.primaryCta.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={SITE_CONFIG.secondaryCta.href}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-[rgba(10,18,38,0.5)] px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:border-brand-blue/50"
          >
            {SITE_CONFIG.secondaryCta.label}
          </Link>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 text-muted-foreground"
      >
        <ChevronDown className="h-6 w-6 animate-bounce" />
      </motion.div>
    </section>
  );
}

function isElementInView(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
}
