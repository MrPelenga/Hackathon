import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json() as {
    firstName?: string;
    lastName?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const updates: Record<string, unknown> = {};

  if (body.firstName?.trim()) updates.firstName = body.firstName.trim();
  if (body.lastName?.trim()) updates.lastName = body.lastName.trim();

  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json({ error: "Mot de passe actuel requis." }, { status: 400 });
    }
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });

    updates.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucune modification." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  return NextResponse.json({ success: true, user });
}
