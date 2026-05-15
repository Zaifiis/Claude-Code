import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = session.user.plan === "FREE" ? 10 : 20;
  const category = searchParams.get("category") ?? undefined;
  const sortBy = searchParams.get("sort") ?? "trendingScore";
  const minAds = parseInt(searchParams.get("minAds") ?? "0");
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const where: any = { isActive: true };
  if (category) where.category = category;
  if (minAds > 0) where.adCount = { gte: minAds };
  if (from || to) {
    where.firstSeenAt = {};
    if (from) where.firstSeenAt.gte = new Date(from);
    if (to) where.firstSeenAt.lte = new Date(to);
  }

  const orderBy: any =
    sortBy === "adCount" ? { adCount: "desc" }
    : sortBy === "advertiserCount" ? { advertiserCount: "desc" }
    : sortBy === "newest" ? { firstSeenAt: "desc" }
    : { trendingScore: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { savedBy: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  // Check which are saved by this user
  const savedIds = new Set(
    (await prisma.savedProduct.findMany({
      where: { userId: session.user.id, productId: { in: products.map((p) => p.id) } },
      select: { productId: true },
    })).map((s) => s.productId)
  );

  return Response.json({
    products: products.map((p) => ({ ...p, isSaved: savedIds.has(p.id) })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
