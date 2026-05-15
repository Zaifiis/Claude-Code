import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.plan !== "PRO")
    return Response.json({ error: "PRO plan required" }, { status: 403 });

  const saved = await prisma.savedProduct.findMany({
    where: { userId: session.user.id },
    include: { product: true },
  });

  const headers = ["Product Name", "Category", "Ad Count", "Advertisers", "Trending Score", "First Seen", "Notes"];
  const rows = saved.map((s) => [
    s.product.name, s.product.category, s.product.adCount,
    s.product.advertiserCount, s.product.trendingScore.toFixed(1),
    new Date(s.product.firstSeenAt).toLocaleDateString(),
    s.note ?? "",
  ]);

  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="adspy-saved-${Date.now()}.csv"`,
    },
  });
}
