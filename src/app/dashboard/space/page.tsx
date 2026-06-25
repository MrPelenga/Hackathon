export const dynamic = "force-dynamic";
import { requirePermission } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/StatCard";
import { LayoutGrid, AlertTriangle, TrendingDown } from "lucide-react";

const roomTypeLabel: Record<string, string> = {
  CLASSROOM: "Cours", DORM: "Chambre", OFFICE: "Bureau",
  CAFETERIA: "Cafétéria", LAB: "Labo", COMMON: "Commun", OTHER: "Autre",
};

export default async function SpacePage() {
  await requirePermission("space", "view");

  const rooms = await prisma.room.findMany({
    where: { isActive: true, type: { in: ["CLASSROOM", "LAB", "COMMON", "CAFETERIA"] } },
    include: {
      building: { select: { name: true, shortName: true } },
      occupancyRecs: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
      _count: { select: { courseSessions: true, reservations: true } },
    },
    orderBy: [{ building: { name: "asc" } }, { name: "asc" }],
  });

  // Compute stats
  const occupied = rooms.filter((r) => {
    const last = r.occupancyRecs[0];
    return last && last.rate > 0.1;
  });
  const saturated = rooms.filter((r) => {
    const last = r.occupancyRecs[0];
    return last && last.rate > 0.9;
  });
  const underused = rooms.filter((r) => {
    const last = r.occupancyRecs[0];
    return !last || last.rate < 0.1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des Espaces</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Occupation et taux d&apos;utilisation des salles</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Salles totales" value={rooms.length} icon={LayoutGrid} />
        <StatCard title="Occupées" value={occupied.length} icon={LayoutGrid} color="blue" />
        <StatCard title="Saturées (>90%)" value={saturated.length} icon={AlertTriangle}
          color={saturated.length > 0 ? "red" : "green"} />
        <StatCard title="Sous-utilisées" value={underused.length} icon={TrendingDown}
          color={underused.length > 5 ? "yellow" : "green"} />
      </div>

      {underused.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {underused.length} salle(s) sous-utilisée(s) détectée(s)
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Heuristique IA : regrouper les cours dans des salles plus petites pourrait réduire la consommation énergétique.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Occupation par salle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rooms.map((room) => {
              const last = room.occupancyRecs[0];
              const rate = last ? Math.round(last.rate * 100) : 0;
              const count = last?.occupantCount ?? 0;
              return (
                <div key={room.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-medium truncate">{room.name}</p>
                    <p className="text-[10px] text-muted-foreground">{room.building.shortName} · {roomTypeLabel[room.type]}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>{count}/{room.capacity} personnes</span>
                      <span className={rate > 90 ? "text-red-600 font-medium" : rate > 70 ? "text-amber-600" : ""}>{rate}%</span>
                    </div>
                    <Progress value={rate} className={`h-1.5 ${rate > 90 ? "[&>div]:bg-red-500" : rate > 70 ? "[&>div]:bg-amber-400" : ""}`} />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">{room._count.courseSessions} sessions</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">À venir :</span> vue thermique d&apos;occupation, recommandations IA de réaffectation, historique 30 jours, export CSV.
        </CardContent>
      </Card>
    </div>
  );
}
