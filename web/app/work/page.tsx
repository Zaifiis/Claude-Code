import type { Metadata } from "next";
import { Portfolio } from "@/components/site/portfolio";
import { CTABanner } from "@/components/site/cta-banner";

export const metadata: Metadata = {
  title: "Work — Profinity Solutions",
};

export default function WorkPage() {
  return (
    <>
      <Portfolio />
      <CTABanner
        title="Like what you see?"
        description="Let's talk about what we can build for you next."
      />
    </>
  );
}
