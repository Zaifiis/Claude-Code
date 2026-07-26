import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { UIProvider } from "@/components/shell/ui-provider";
import { Toaster } from "sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Content OS",
  description:
    "A personal content operating system — capture ideas, save references, write scripts, run your pipeline and ship.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <UIProvider>{children}</UIProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast:
                  "!bg-elevated !text-fg !border !border-border !rounded-[var(--radius-md)] !shadow-pop !font-sans",
                description: "!text-muted",
                actionButton: "!bg-accent !text-accent-fg",
                cancelButton: "!bg-surface-2 !text-muted",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
