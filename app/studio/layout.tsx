import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Studio",
  description: "Content ideas, scripts and the order they get made in.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    // Runs full screen from the home screen, with the status bar over the
    // frosted top bar rather than sitting in its own strip.
    capable: true,
    title: "Studio",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the frosted bar run under the status bar on a phone.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#101013" },
  ],
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
