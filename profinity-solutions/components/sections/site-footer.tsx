'use client';

import { usePathname } from 'next/navigation';
import { FlowFooter } from '@/components/sections/flow-footer';
import { SimpleFooter } from '@/components/sections/simple-footer';

// The cinematic FlowFooter's full-height pinned panels only feel right on the
// long home page. Everywhere else its CTA panel shows up mid-scroll, so those
// routes get the compact static footer that simply sits at the end.
export function SiteFooter() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  return isHome ? <FlowFooter /> : <SimpleFooter />;
}
