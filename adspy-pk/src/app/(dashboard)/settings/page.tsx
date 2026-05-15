import { Metadata } from "next";
import { Header } from "@/components/dashboard/header";
import { SettingsContent } from "./settings-content";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div>
      <Header title="Settings" />
      <div className="p-6">
        <SettingsContent />
      </div>
    </div>
  );
}
