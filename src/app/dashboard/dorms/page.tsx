export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { BedDouble, Users } from "lucide-react";

export default async function DormsPage() {
  const user = await requireAuth();

  // STUDENT: show only their own room
  if (user.role === "STUDENT") {
    const assignment = await prisma.dormAssignment.findFirst({
      where: { student: { userId: user.id }, isActive: true },
      include: {
        room: {
          include: {
            building: { select: { name: true, address: true } },
            equipment: { select: { type: true, status: true, name: true } },
          },
        },
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Ma Résidence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Informations sur votre chambre</p>
        </div>
        {assignment ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                {assignment.room.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Bâtiment</p>
                  <p className="text-sm font-medium">{assignment.room.building.name}</p>
                  <p className="text-xs text-muted-foreground">{assignment.room.building.address}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Étage</p>
                  <p className="text-sm font-medium">Étage {assignment.room.floor}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date d&apos;entrée</p>
                  <p className="text-sm font-medium">{new Date(assignment.startDate).toLocaleDateString("fr-FR")}</p>
                </div>
                {assignment.endDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Date de fin</p>
                    <p className="text-sm font-medium">{new Date(assignment.endDate).toLocaleDateString("fr-FR")}</p>
                  </div>
                )}
              </div>
              {assignment.room.equipment.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Équipements de la chambre</p>
                  <div className="flex flex-wrap gap-2">
                    {assignment.room.equipment.map((eq, i) => (
                      <span key={i} className={`text-[11px] px-2 py-0.5 rounded border ${eq.status === "FAULT" ? "bg-red-100 text-red-700 border-red-200" : "bg-muted text-muted-foreground"}`}>
                        {eq.name}
                        {eq.status === "FAULT" && " ⚠ Panne"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BedDouble className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune chambre ne vous a été attribuée pour le moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ADMIN: show all dorm assignments
  const [assignments, totalDormRooms] = await Promise.all([
    prisma.dormAssignment.findMany({
      where: { isActive: true },
      include: {
        room: { select: { name: true, floor: true, building: { select: { name: true, shortName: true } } } },
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
      orderBy: [{ room: { building: { name: "asc" } } }, { room: { name: "asc" } }],
    }),
    prisma.room.count({ where: { type: "DORM", isActive: true } }),
  ]);

  const occupancyRate = totalDormRooms > 0 ? Math.round((assignments.length / totalDormRooms) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Résidences Universitaires</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Attributions de chambres actives</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard title="Chambres totales" value={totalDormRooms} icon={BedDouble} />
        <StatCard title="Chambres occupées" value={assignments.length} icon={BedDouble} color="blue" />
        <StatCard title="Taux d'occupation" value={`${occupancyRate}%`} icon={Users}
          color={occupancyRate > 90 ? "red" : occupancyRate > 70 ? "yellow" : "green"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attributions actives ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.student.user.firstName} {a.student.user.lastName}</p>
                  <p className="text-[11px] text-muted-foreground">{a.student.user.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm">{a.room.name}</p>
                  <p className="text-[10px] text-muted-foreground">{a.room.building.shortName} · Étage {a.room.floor}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-muted-foreground">
                    Depuis le {new Date(a.startDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">Aucune attribution active.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">À venir :</span> affectation de chambres, gestion des fins de contrat, contrôle d&apos;accès par badge.
        </CardContent>
      </Card>
    </div>
  );
}
