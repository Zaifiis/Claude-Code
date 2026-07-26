import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Instagram, Facebook, Youtube } from 'lucide-react';
import { NAV_LINKS, SERVICES, SITE_CONFIG } from '@/lib/site-config';

const exploreLinks = NAV_LINKS.filter((l) =>
  ['/about', '/services', '/portfolio', '/blog', '/contact'].includes(l.href),
);

// Compact static footer for every page except the long home page (which keeps
// the cinematic FlowFooter). Normal document flow, so it only appears at the
// very end of the page.
export function SimpleFooter() {
  const { contact, socials } = SITE_CONFIG;
  const year = new Date().getFullYear();

  return (
    <footer aria-label="Site footer" className="mt-24 border-t border-border bg-[#060b1a]">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <Image src="/logo.jpeg" alt="" width={34} height={34} className="rounded-lg" />
              <span className="font-display text-base font-bold text-foreground">
                Profinity Solutions
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI agents that call, chat, and clear the busywork around the clock — wired into
              the tools you already run.
            </p>
            <div className="mt-5 flex gap-3">
              {socials.linkedin && <Social href={socials.linkedin} label="LinkedIn"><Linkedin className="h-4 w-4" /></Social>}
              {socials.instagram && <Social href={socials.instagram} label="Instagram"><Instagram className="h-4 w-4" /></Social>}
              {socials.facebook && <Social href={socials.facebook} label="Facebook"><Facebook className="h-4 w-4" /></Social>}
              {socials.youtube && <Social href={socials.youtube} label="YouTube"><Youtube className="h-4 w-4" /></Social>}
            </div>
          </div>

          {/* Explore */}
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

          {/* Services */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-brand-light">
              What we build
            </h4>
            <ul className="space-y-2.5">
              {SERVICES.map((s) => (
                <li key={s.id}>
                  <Link href={`/services/${s.slug}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
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
