import { Metadata } from "next";
import { Header } from "@/components/dashboard/header";
import { SearchContent } from "./search-content";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <div>
      <Header title="Search Ads" />
      <div className="p-6">
        <SearchContent />
      </div>
    </div>
  );
}
