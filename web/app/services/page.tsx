import type { Metadata } from "next";
import { Services } from "@/components/site/services";
import { CTABanner } from "@/components/site/cta-banner";

export const metadata: Metadata = {
  title: "Services — Profinity Solutions",
};

export default function ServicesPage() {
  return (
    <>
      <Services />
      <CTABanner
        title="Not sure where to start?"
        description="Tell us what you're building and we'll help you scope the right mix of services."
      />
    </>
  );
}
