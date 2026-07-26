import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { SITE_CONFIG } from '@/lib/site-config';
import { Nav } from '@/components/ui/gradient-menu';
import { CinematicFooter } from '@/components/ui/motion-footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} — AI Automation Agency`,
    template: `%s — ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  icons: { icon: '/logo.jpeg', apple: '/logo.jpeg' },
  openGraph: {
    type: 'website',
    title: `${SITE_CONFIG.name} — AI Automation Agency`,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    images: [{ url: '/logo.jpeg', width: 1000, height: 1000, alt: SITE_CONFIG.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} — AI Automation Agency`,
    description: SITE_CONFIG.description,
    images: ['/logo.jpeg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#050914',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-base font-sans text-foreground antialiased">
        <Nav />
        {/* The content card scrolls over the cinematic footer, which is revealed
            underneath it at the bottom of the page. */}
        <div className="relative">
          <div className="relative z-10 min-h-screen rounded-b-[2rem] bg-base shadow-[0_50px_90px_-40px_rgba(0,0,0,0.9)] md:rounded-b-[2.5rem]">
            <main>{children}</main>
          </div>
          <CinematicFooter />
        </div>
      </body>
    </html>
  );
}
