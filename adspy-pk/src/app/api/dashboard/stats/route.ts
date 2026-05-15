import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalProducts, newToday, activeAds, advertiserCount, lastSync,
    trendData,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { firstSeenAt: { gte: today } } }),
    prisma.ad.count({ where: { status: "ACTIVE" } }),
    prisma.ad.groupBy({ by: ["pageId"], where: { status: "ACTIVE" }, _count: true })
      .then((r) => r.length),
    prisma.syncLog.findFirst({ orderBy: { createdAt: "desc" } }),
    // last 7 days product count trend
    Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        return prisma.product.count({
          where: { firstSeenAt: { gte: d, lt: next } },
        }).then((count) => ({
          date: d.toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
          products: count,
        }));
      })
    ),
  ]);

  const topProducts = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { trendingScore: "desc" },
    take: 5,
    select: {
      id: true, name: true, category: true, adCount: true,
      advertiserCount: true, trendingScore: true, firstSeenAt: true, lastSeenAt: true,
    },
  });

  return Response.json({
    stats: { totalProducts, newToday, activeAds, advertiserCount },
    lastSync,
    trendData,
    topProducts,
  });
}
