import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { ProductDetailContent } from "./product-detail-content";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product?.name ?? "Product" };
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { ads: { orderBy: { startDate: "desc" }, take: 50 } },
  });
  if (!product) notFound();

  return (
    <div>
      <Header title={product.name} />
      <div className="p-6">
        <ProductDetailContent product={JSON.parse(JSON.stringify(product))} />
      </div>
    </div>
  );
}
