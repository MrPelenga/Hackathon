import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { spotId, startTime, endTime } = await request.json() as { spotId: string; startTime: string; endTime: string };

  if (!spotId || !startTime || !endTime) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) {
    return NextResponse.json({ error: "L'heure de fin doit être après l'heure de début." }, { status: 400 });
  }

  // Check spot is free
  const spot = await prisma.parkingSpot.findUnique({ where: { id: spotId } });
  if (!spot || spot.status !== "FREE") {
    return NextResponse.json({ error: "Cette place n'est pas disponible." }, { status: 409 });
  }

  // Check no overlap
  const conflict = await prisma.parkingReservation.findFirst({
    where: {
      spotId,
      OR: [
        { startTime: { lte: start }, endTime: { gt: start } },
        { startTime: { lt: end }, endTime: { gte: end } },
        { startTime: { gte: start }, endTime: { lte: end } },
      ],
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "Ce créneau est déjà réservé." }, { status: 409 });
  }

  const [reservation] = await prisma.$transaction([
    prisma.parkingReservation.create({
      data: { spotId, userId: session.user.id, startTime: start, endTime: end },
    }),
    prisma.parkingSpot.update({ where: { id: spotId }, data: { status: "RESERVED" } }),
  ]);

  return NextResponse.json({ success: true, reservationId: reservation.id }, { status: 201 });
}
