import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: { default: "AdSpy PK — Pakistan Facebook Ads Tracker", template: "%s | AdSpy PK" },
  description: "Discover trending products being advertised in Pakistan. Track Facebook Ads Library daily to find winning products before your competitors.",
  openGraph: {
    title: "AdSpy PK — Pakistan Facebook Ads Tracker",
    description: "Find trending products in Pakistan before your competitors.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
          <Toaster richColors position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
