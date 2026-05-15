import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN")
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const logs = await prisma.syncLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ logs });
}
