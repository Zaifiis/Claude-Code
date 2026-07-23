import type { Metadata } from "next";
import { About } from "@/components/site/about";
import { CTABanner } from "@/components/site/cta-banner";

export const metadata: Metadata = {
  title: "About — Profinity Solutions",
};

export default function AboutPage() {
  return (
    <>
      <About />
      <CTABanner
        title="Want to work together?"
        description="We'd love to hear about what you're building."
      />
    </>
  );
}
