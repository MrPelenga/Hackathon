import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "MAINTENANCE") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json() as { status: string; resolutionNote?: string };

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) return NextResponse.json({ error: "Incident introuvable." }, { status: 404 });

  const updated = await prisma.incident.update({
    where: { id },
    data: {
      status: body.status as never,
      resolutionNote: body.resolutionNote ?? incident.resolutionNote,
      resolvedAt: body.status === "RESOLVED" || body.status === "CLOSED" ? new Date() : null,
      assignedToId: body.status === "IN_PROGRESS" ? session.user.id : incident.assignedToId,
    },
    select: { id: true, status: true, title: true },
  });

  return NextResponse.json({ success: true, incident: updated });
}
