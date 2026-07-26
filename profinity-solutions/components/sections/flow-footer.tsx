'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Linkedin, Instagram, Facebook, Youtube } from 'lucide-react';
import FlowArt, { FlowSection } from '@/components/ui/flow-art';
import { NAV_LINKS, SERVICES, SITE_CONFIG } from '@/lib/site-config';

const exploreLinks = NAV_LINKS.filter((l) =>
  ['/about', '/services', '/portfolio', '/blog', '/contact'].includes(l.href),
);

// The site footer, built on the FlowArt scroll template. Panel one pins while
// panel two (the footer proper) rotates up into place over it. Typography and
// colour are the Profinity brand: Space Grotesk display, navy grounds, and the
// light-blue gradient.
export function FlowFooter() {
  const { contact, socials } = SITE_CONFIG;
  const year = new Date().getFullYear();

  return (
    <FlowArt aria-label="Footer">
      {/* Panel 1 — pinned call to action */}
      <FlowSection
        aria-label="Book a call"
        className="bg-[linear-gradient(160deg,#0b1f4d_0%,#0a1226_58%,#050914_100%)]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_520px_at_15%_-10%,rgba(56,189,248,0.16),transparent_60%)]"
        />
        <div className="relative mx-auto flex w-full max-w-content items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-light">
            Let&apos;s talk
          </span>
          <span className="hidden text-sm text-muted-foreground sm:block">{SITE_CONFIG.domain}</span>
        </div>

        <div className="relative mx-auto w-full max-w-content">
          <h2 className="max-w-[16ch] font-display text-[clamp(2.4rem,7vw,5.5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground">
            Your quietest new hire starts here.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Tell us what keeps eating your team&apos;s time. We will show you where an agent takes it
            off their hands, usually inside a few weeks.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={SITE_CONFIG.primaryCta.href}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient px-7 py-4 text-base font-semibold text-white shadow-[0_16px_44px_-14px_rgba(59,130,246,0.85)] transition-transform hover:scale-[1.02]"
            >
              {SITE_CONFIG.primaryCta.label}
              <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href={SITE_CONFIG.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-full border border-border bg-[rgba(10,18,38,0.5)] px-7 py-4 text-base font-semibold text-foreground transition-colors hover:border-brand-blue/50"
            >
              {SITE_CONFIG.secondaryCta.label}
            </Link>
          </div>
        </div>
      </FlowSection>

      {/* Panel 2 — the footer, rotates up into view */}
      <FlowSection aria-label="Site footer" className="bg-[#060b1a]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_460px_at_50%_118%,rgba(33,89,201,0.22),transparent_60%)]"
        />

        {/* Oversized brand wordmark */}
        <div className="relative mx-auto w-full max-w-content">
          <p className="select-none bg-brand-text bg-clip-text text-center font-display text-[clamp(4rem,17vw,190px)] font-bold leading-none tracking-[-0.04em] text-transparent opacity-90">
            Profinity
          </p>
        </div>

        {/* Columns + legal */}
        <div className="relative mx-auto w-full max-w-content">
          <div className="grid gap-10 border-t border-border pt-12 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link href="/" className="mb-4 flex items-center gap-2.5">
                <Image src="/logo.jpeg" alt="" width={38} height={38} className="rounded-lg" />
                <span className="font-display text-lg font-bold">Profinity Solutions</span>
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                We build AI agents that call, chat, and clear the busywork around the clock, wired
                into the tools your team already runs.
              </p>
              <div className="mt-5 flex gap-3">
                {socials.linkedin && <Social href={socials.linkedin} label="LinkedIn"><Linkedin className="h-4 w-4" /></Social>}
                {socials.instagram && <Social href={socials.instagram} label="Instagram"><Instagram className="h-4 w-4" /></Social>}
                {socials.facebook && <Social href={socials.facebook} label="Facebook"><Facebook className="h-4 w-4" /></Social>}
                {socials.youtube && <Social href={socials.youtube} label="YouTube"><Youtube className="h-4 w-4" /></Social>}
              </div>
            </div>

            <div>
              <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-brand-light">
                Explore
              </h4>
              <ul className="space-y-2.5">
                {exploreLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-brand-light">
                What we build
              </h4>
              <ul className="space-y-2.5">
                {SERVICES.map((s) => (
                  <li key={s.id}>
                    <Link href={`/services#${s.id}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-brand-light">
                Say hello
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a href={`mailto:${contact.email}`} className="transition-colors hover:text-foreground">{contact.email}</a>
                </li>
                <li>
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-foreground">{contact.phone}</a>
                </li>
                <li className="max-w-xs">{contact.address}</li>
              </ul>
              <Link
                href={SITE_CONFIG.primaryCta.href}
                className="mt-5 inline-block rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
              >
                Book a free audit
              </Link>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {year} Profinity Solutions. Built to keep working while you rest.</p>
            <p>{SITE_CONFIG.domain}</p>
          </div>
        </div>
      </FlowSection>
    </FlowArt>
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
