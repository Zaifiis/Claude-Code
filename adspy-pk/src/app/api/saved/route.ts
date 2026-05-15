import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const saved = await prisma.savedProduct.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true, name: true, category: true, adCount: true,
          advertiserCount: true, trendingScore: true, firstSeenAt: true, lastSeenAt: true, isActive: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ saved });
}
