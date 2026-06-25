import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const VALID_CATEGORIES = ["LIGHTING", "HVAC", "BLIND", "EQUIPMENT", "ACCESS", "PARKING", "OTHER"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json() as {
    title: string;
    description: string;
    category: string;
    priority?: string;
    roomId?: string;
  };

  if (!body.title?.trim() || !body.description?.trim() || !body.category) {
    return NextResponse.json({ error: "Titre, description et catégorie sont requis." }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: "Catégorie invalide." }, { status: 400 });
  }
  const priority = body.priority && VALID_PRIORITIES.includes(body.priority) ? body.priority : "MEDIUM";

  const incident = await prisma.incident.create({
    data: {
      title: body.title.trim(),
      description: body.description.trim(),
      category: body.category as never,
      priority: priority as never,
      status: "OPEN",
      reportedById: session.user.id,
      roomId: body.roomId ?? null,
    },
    select: { id: true, title: true, status: true },
  });

  return NextResponse.json({ success: true, incident }, { status: 201 });
}
