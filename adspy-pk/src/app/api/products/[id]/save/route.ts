import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: productId } = await params;
  const { note } = await req.json().catch(() => ({ note: undefined }));

  const existing = await prisma.savedProduct.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await prisma.savedProduct.delete({
      where: { userId_productId: { userId: session.user.id, productId } },
    });
    return Response.json({ saved: false });
  }

  await prisma.savedProduct.create({
    data: { userId: session.user.id, productId, note },
  });
  return Response.json({ saved: true });
}
