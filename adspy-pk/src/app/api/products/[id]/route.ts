import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      ads: { orderBy: { startDate: "desc" }, take: 50 },
      _count: { select: { savedBy: true, ads: true } },
    },
  });
  if (!product) return Response.json({ error: "Not found" }, { status: 404 });

  const saved = await prisma.savedProduct.findUnique({
    where: { userId_productId: { userId: session.user.id, productId: id } },
  });

  return Response.json({ product, isSaved: !!saved });
}
