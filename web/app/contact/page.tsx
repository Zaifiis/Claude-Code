import type { Metadata } from "next";
import { Contact } from "@/components/site/contact";

export const metadata: Metadata = {
  title: "Contact — Profinity Solutions",
};

export default function ContactPage() {
  return <Contact />;
}
