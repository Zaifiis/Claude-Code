import { Hero } from "@/components/site/hero";
import { HomeHighlights } from "@/components/site/home-highlights";
import { CTABanner } from "@/components/site/cta-banner";

export default function Home() {
  return (
    <>
      <Hero />
      <HomeHighlights />
      <CTABanner
        title="Have a project in mind?"
        description="Tell us a bit about what you're building — we usually reply within one business day."
      />
    </>
  );
}
