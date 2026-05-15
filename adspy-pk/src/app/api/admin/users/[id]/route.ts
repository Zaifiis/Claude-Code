import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN")
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { plan, role } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(plan && { plan }),
      ...(role && { role }),
      ...(plan === "PRO" && { planExpiresAt: new Date(Date.now() + 30 * 86400000) }),
    },
    select: { id: true, email: true, plan: true, role: true },
  });
  return Response.json({ user });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN")
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return Response.json({ deleted: true });
}
