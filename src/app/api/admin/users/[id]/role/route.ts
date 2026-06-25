import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const VALID_ROLES = ["STUDENT", "TEACHER", "ADMIN", "MAINTENANCE"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { id } = await params;
  const { role } = await request.json() as { role: string };

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
  }
  if (id === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre rôle." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: role as never },
    select: { id: true, email: true, role: true, firstName: true, lastName: true },
  });

  return NextResponse.json({ success: true, user });
}
