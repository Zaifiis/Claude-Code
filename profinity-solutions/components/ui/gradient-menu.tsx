'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { NAV_LINKS, SERVICES, SITE_CONFIG } from '@/lib/site-config';
import { cn } from '@/lib/utils';

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Primary"
        className={cn(
          'mx-auto flex max-w-content items-center justify-between px-5 py-3 transition-all duration-300',
          scrolled &&
            'mt-2 max-w-[calc(1180px-1rem)] rounded-2xl border border-border bg-[rgba(5,9,20,0.78)] px-4 py-2.5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl md:mt-3',
        )}
      >
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE_CONFIG.name} home`}>
          <Image
            src="/logo.jpeg"
            alt=""
            width={38}
            height={38}
            className="rounded-lg"
            priority
          />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Profinity
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 rounded-full border border-border bg-[rgba(10,18,38,0.5)] p-1 lg:flex">
          {NAV_LINKS.map((link) => {
            if (link.label === 'Services') {
              return (
                <li
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setMega(true)}
                  onMouseLeave={() => setMega(false)}
                  onFocus={() => setMega(true)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setMega(false);
                  }}
                >
                  <Link
                    href={link.href}
                    aria-expanded={mega}
                    className={cn(
                      'relative flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                      isActive(link.href) && 'text-foreground',
                    )}
                  >
                    {isActive(link.href) && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-navy-800 to-navy-600"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {link.label}
                    <ChevronDown
                      className={cn('h-3.5 w-3.5 transition-transform', mega && 'rotate-180')}
                    />
                  </Link>

                  <AnimatePresence>
                    {mega && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-1/2 top-full z-50 mt-3 w-[560px] -translate-x-1/2 rounded-2xl border border-border bg-[rgba(8,14,30,0.96)] p-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl"
                      >
                        <div className="grid grid-cols-2 gap-1">
                          {SERVICES.map((s) => {
                            const Icon = s.icon;
                            return (
                              <Link
                                key={s.id}
                                href={`/services/${s.slug}`}
                                className="group/mega flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
                              >
                                <span className="mt-0.5 flex-none rounded-lg border border-border bg-muted p-2 text-brand-light">
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span>
                                  <span className="block text-sm font-medium text-foreground">
                                    {s.name}
                                  </span>
                                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                                    {s.whatYouGet[0]}
                                  </span>
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                        <Link
                          href={SITE_CONFIG.primaryCta.href}
                          className="group/cta mt-2 flex items-center justify-between rounded-xl bg-gradient-to-r from-navy-800 to-navy-600 px-4 py-3 text-sm font-semibold text-foreground"
                        >
                          {SITE_CONFIG.primaryCta.label}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            }
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'relative block rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                    isActive(link.href) && 'text-foreground',
                  )}
                >
                  {isActive(link.href) && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-navy-800 to-navy-600"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href={SITE_CONFIG.primaryCta.href}
            className="hidden rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.7)] transition-transform hover:scale-[1.03] sm:inline-block"
          >
            Book a Call
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="rounded-lg border border-border bg-muted p-2 text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-[rgba(5,9,20,0.97)] backdrop-blur-xl lg:hidden"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-display text-lg font-bold">Profinity</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border bg-muted p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="flex flex-1 flex-col items-center justify-center gap-2">
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      'font-display text-3xl font-semibold text-muted-foreground',
                      isActive(link.href) && 'text-gradient',
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * NAV_LINKS.length }}
                className="mt-6"
              >
                <Link
                  href={SITE_CONFIG.primaryCta.href}
                  className="rounded-full bg-brand-gradient px-6 py-3 text-base font-semibold text-white"
                >
                  {SITE_CONFIG.primaryCta.label}
                </Link>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
