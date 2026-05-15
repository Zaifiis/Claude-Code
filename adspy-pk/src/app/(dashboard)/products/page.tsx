import { Metadata } from "next";
import { Header } from "@/components/dashboard/header";
import { ProductsContent } from "./products-content";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return (
    <div>
      <Header title="Trending Products" />
      <div className="p-6">
        <ProductsContent />
      </div>
    </div>
  );
}
