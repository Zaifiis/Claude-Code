'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Linkedin, Instagram, Facebook, Youtube } from 'lucide-react';
import { NAV_LINKS, SERVICES, SITE_CONFIG } from '@/lib/site-config';

const companyLinks = NAV_LINKS.filter((l) =>
  ['/about', '/services', '/portfolio', '/blog', '/contact'].includes(l.href),
);

// A "cinematic" footer that sits underneath the page. The main content scrolls
// over it (see app/layout.tsx) and the footer is revealed as you reach the
// bottom, with its contents drifting up into place.
export function CinematicFooter() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end end'],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [64, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], reduce ? [1, 1] : [0.2, 1]);

  const year = new Date().getFullYear();
  const { contact, socials } = SITE_CONFIG;

  return (
    <footer
      ref={ref}
      className="sticky bottom-0 z-0 overflow-hidden border-t border-border bg-[#060b1a]"
    >
      {/* Ambient glow inside the footer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_120%,rgba(33,89,201,0.22),transparent_60%)]"
      />

      <motion.div style={{ y, opacity }} className="relative">
        {/* Oversized brand wordmark, cinematic */}
        <div className="container-x pt-16">
          <p className="select-none bg-brand-text bg-clip-text text-center font-display text-[15vw] font-bold leading-none tracking-[-0.04em] text-transparent opacity-90 sm:text-[13vw] lg:text-[150px]">
            Profinity
          </p>
        </div>

        <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <Image src="/logo.jpeg" alt="" width={40} height={40} className="rounded-lg" />
              <span className="font-display text-lg font-bold">Profinity Solutions</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              An AI automation agency building agents that call, chat, and work 24/7 —
              integrated with the tools your team already uses.
            </p>
            <div className="mt-5 flex gap-3">
              {socials.linkedin && <Social href={socials.linkedin} label="LinkedIn"><Linkedin className="h-4 w-4" /></Social>}
              {socials.instagram && <Social href={socials.instagram} label="Instagram"><Instagram className="h-4 w-4" /></Social>}
              {socials.facebook && <Social href={socials.facebook} label="Facebook"><Facebook className="h-4 w-4" /></Social>}
              {socials.youtube && <Social href={socials.youtube} label="YouTube"><Youtube className="h-4 w-4" /></Social>}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-brand-light">
              Company
            </h3>
            <ul className="space-y-2.5">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-brand-light">
              Services
            </h3>
            <ul className="space-y-2.5">
              {SERVICES.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/services#${s.id}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-brand-light">
              Get in touch
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href={`mailto:${contact.email}`} className="transition-colors hover:text-foreground">
                  {contact.email}
                </a>
              </li>
              <li>
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-foreground">
                  {contact.phone}
                </a>
              </li>
              <li className="max-w-xs">{contact.address}</li>
            </ul>
            <Link
              href={SITE_CONFIG.primaryCta.href}
              className="group mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
            >
              {SITE_CONFIG.primaryCta.label}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {year} Profinity Solutions. All rights reserved.</p>
            <p>{SITE_CONFIG.domain}</p>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="rounded-lg border border-border bg-muted p-2 text-muted-foreground transition-colors hover:text-brand-light"
    >
      {children}
    </a>
  );
}
