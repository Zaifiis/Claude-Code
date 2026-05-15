import { Metadata } from "next";
import { Header } from "@/components/dashboard/header";
import { SavedContent } from "./saved-content";

export const metadata: Metadata = { title: "Saved Products" };
export const dynamic = "force-dynamic";

export default function SavedPage() {
  return (
    <div>
      <Header title="Saved Products" />
      <div className="p-6">
        <SavedContent />
      </div>
    </div>
  );
}
