export const dynamic = "force-dynamic";
import { requirePermission } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, CheckCircle, XCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function ReservationsPage() {
  const user = await requirePermission("reservations", "view");

  const isAdmin = user.role === "ADMIN";

  const [myReservations, rooms] = await Promise.all([
    prisma.roomReservation.findMany({
      where: isAdmin ? {} : { reservedById: user.id },
      include: {
        room: { select: { name: true, capacity: true, building: { select: { name: true } } } },
        reservedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startTime: "desc" },
      take: 30,
    }),
    prisma.room.findMany({
      where: { isActive: true, type: { in: ["CLASSROOM", "LAB", "COMMON"] } },
      select: { id: true, name: true, capacity: true, type: true, building: { select: { name: true } } },
      orderBy: [{ building: { name: "asc" } }, { name: "asc" }],
      take: 20,
    }),
  ]);

  const pending = myReservations.filter((r) => !r.isApproved).length;
  const approved = myReservations.filter((r) => r.isApproved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Réservation de Salles</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isAdmin ? "Toutes les réservations" : "Mes réservations"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard title="Total" value={myReservations.length} icon={BookOpen} />
        <StatCard title="Approuvées" value={approved} icon={CheckCircle} color="green" />
        <StatCard title="En attente" value={pending} icon={Clock}
          color={pending > 0 ? "yellow" : "green"} />
      </div>

      {/* New reservation form (simplified) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Réserver une salle
            <Badge variant="secondary" className="text-[10px] ml-1">À venir</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La réservation interactive (calendrier, créneaux disponibles, validation) sera disponible dans une prochaine version.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {rooms.slice(0, 6).map((room) => (
              <div key={room.id} className="rounded-md border p-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{room.name}</p>
                  <p className="text-[11px] text-muted-foreground">{room.building.name} · {room.capacity} places</p>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {room.type === "CLASSROOM" ? "Cours" : room.type === "LAB" ? "Labo" : "Commun"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isAdmin ? "Toutes les réservations" : "Mes réservations"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {myReservations.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                <div className="shrink-0">
                  {r.isApproved
                    ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                    : <Clock className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.room.name} · {r.room.building.name}
                    {isAdmin && <span> · {r.reservedBy.firstName} {r.reservedBy.lastName}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] tabular-nums">
                    {new Date(r.startTime).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(r.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    {" → "}
                    {new Date(r.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <Badge variant={r.isApproved ? "outline" : "secondary"} className="text-[10px] shrink-0">
                  {r.isApproved ? "Approuvé" : "En attente"}
                </Badge>
              </div>
            ))}
            {myReservations.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">Aucune réservation.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
