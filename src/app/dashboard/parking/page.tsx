export const dynamic = "force-dynamic";
import { requirePermission } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/StatCard";
import { Car, ParkingSquare } from "lucide-react";
import { ParkingReserveButton } from "./_components/ParkingReserveButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ParkingPage() {
  const user = await requirePermission("parking", "view");
  const session = await getServerSession(authOptions);
  const canReserve = user.role === "ADMIN" || user.role === "STUDENT";

  const [lots, myReservations] = await Promise.all([
    prisma.parkingLot.findMany({
      include: {
        spots: { orderBy: { number: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
    canReserve
      ? prisma.parkingReservation.findMany({
          where: { userId: user.id, endTime: { gte: new Date() } },
          include: { spot: { include: { lot: { select: { name: true } } } } },
          orderBy: { startTime: "asc" },
          take: 3,
        })
      : Promise.resolve([]),
  ]);

  const totalFree = lots.flatMap((l) => l.spots).filter((s) => s.status === "FREE").length;
  const totalSpots = lots.flatMap((l) => l.spots).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parkings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">État en temps réel des parkings du campus</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Places libres" value={totalFree} icon={Car}
          color={totalFree < 10 ? "red" : totalFree < 30 ? "yellow" : "green"} />
        <StatCard title="Total places" value={totalSpots} icon={ParkingSquare} />
      </div>

      {/* My active reservations */}
      {myReservations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mes réservations actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myReservations.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                  <ParkingSquare className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Place {r.spot.number} — {r.spot.lot.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.startTime).toLocaleDateString("fr-FR")} · {new Date(r.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      {" → "}
                      {new Date(r.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 text-emerald-600 border-emerald-300">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lots.map((lot) => {
          const total = lot.spots.length;
          const free = lot.spots.filter((s) => s.status === "FREE").length;
          const occupied = lot.spots.filter((s) => s.status === "OCCUPIED").length;
          const reserved = lot.spots.filter((s) => s.status === "RESERVED").length;
          const disabled = lot.spots.filter((s) => s.type === "DISABLED").length;
          const electric = lot.spots.filter((s) => s.type === "ELECTRIC").length;
          const rate = total > 0 ? Math.round(((total - free) / total) * 100) : 0;
          const freeSpots = lot.spots.filter((s) => s.status === "FREE");

          return (
            <Card key={lot.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{lot.name}</CardTitle>
                  <Badge variant={lot.isOpen ? "outline" : "destructive"} className="text-[10px] shrink-0">
                    {lot.isOpen ? "Ouvert" : "Fermé"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taux d&apos;occupation</span>
                  <span className="font-semibold tabular-nums">{rate}%</span>
                </div>
                <Progress value={rate} className={`h-2 ${rate > 85 ? "[&>div]:bg-red-500" : rate > 65 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`} />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md bg-emerald-50 p-2">
                    <p className="font-bold text-emerald-700 text-lg">{free}</p>
                    <p className="text-emerald-600">Libres</p>
                  </div>
                  <div className="rounded-md bg-red-50 p-2">
                    <p className="font-bold text-red-700 text-lg">{occupied}</p>
                    <p className="text-red-600">Occupées</p>
                  </div>
                  <div className="rounded-md bg-amber-50 p-2">
                    <p className="font-bold text-amber-700 text-lg">{reserved}</p>
                    <p className="text-amber-600">Réservées</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>PMR : {disabled}</span>
                  <span>·</span>
                  <span>Élec. : {electric}</span>
                  <span>·</span>
                  <span>Total : {total}</span>
                </div>
                {canReserve && lot.isOpen && freeSpots.length > 0 && (
                  <ParkingReserveButton
                    spots={freeSpots.slice(0, 5).map((s) => ({ id: s.id, number: s.number, type: s.type }))}
                    lotName={lot.name}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
