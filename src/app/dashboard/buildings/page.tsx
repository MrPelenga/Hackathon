export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Lightbulb, Wind, Thermometer, AlertTriangle } from "lucide-react";

const statusColor: Record<string, string> = {
  ON: "bg-emerald-100 text-emerald-700",
  OFF: "bg-slate-100 text-slate-600",
  FAULT: "bg-red-100 text-red-700",
  MAINTENANCE: "bg-amber-100 text-amber-700",
};
const roomTypeLabel: Record<string, string> = {
  CLASSROOM: "Cours", DORM: "Chambre", OFFICE: "Bureau",
  CAFETERIA: "Cafétéria", LAB: "Labo", COMMON: "Commun", OTHER: "Autre",
};

async function getData(role: string, userId: string) {
  if (role === "ADMIN" || role === "MAINTENANCE") {
    return prisma.building.findMany({
      include: {
        rooms: {
          where: { isActive: true },
          include: {
            equipment: { orderBy: { type: "asc" } },
            hvacUnits: { select: { name: true, status: true, currentTemperature: true, setTemperature: true } },
          },
          orderBy: { floor: "asc" },
        },
        _count: { select: { rooms: true, streetLights: true } },
      },
      orderBy: { name: "asc" },
    });
  }
  // TEACHER: only rooms where they have scheduled sessions
  const myRoomIds = (await prisma.courseSession.findMany({
    where: { course: { teacherId: userId } },
    select: { roomId: true },
    distinct: ["roomId"],
  })).map((r) => r.roomId);

  return prisma.building.findMany({
    where: { rooms: { some: { id: { in: myRoomIds } } } },
    include: {
      rooms: {
        where: { id: { in: myRoomIds }, isActive: true },
        include: {
          equipment: { orderBy: { type: "asc" } },
          hvacUnits: { select: { name: true, status: true, currentTemperature: true, setTemperature: true } },
        },
        orderBy: { floor: "asc" },
      },
      _count: { select: { rooms: true, streetLights: true } },
    },
  });
}

export default async function BuildingsPage() {
  const user = await requireAuth();
  const buildings = await getData(user.role, user.id);

  const totalFaults = buildings.flatMap((b) => b.rooms).flatMap((r) => r.equipment).filter((e) => e.status === "FAULT").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bâtiments & Salles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user.role === "TEACHER" ? "Mes salles de cours" : "État des équipements par bâtiment"}
          </p>
        </div>
        {totalFaults > 0 && (
          <div className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            <span className="text-xs font-medium text-red-700">{totalFaults} panne(s)</span>
          </div>
        )}
      </div>

      {buildings.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">Aucun bâtiment accessible.</p>
      )}

      {buildings.map((building) => (
        <Card key={building.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {building.name}
                <span className="text-xs font-normal text-muted-foreground">
                  {building.floorCount} étage(s) · {building._count.rooms} salles
                </span>
              </CardTitle>
              <Badge variant={building.isOpen ? "outline" : "destructive"} className="text-[10px]">
                {building.isOpen ? "Ouvert" : "Fermé"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {building.rooms.map((room) => {
                const faults = room.equipment.filter((e) => e.status === "FAULT").length;
                const lights = room.equipment.filter((e) => e.type === "LIGHT");
                const blinds = room.equipment.filter((e) => e.type === "BLIND");
                return (
                  <div key={room.id} className={`rounded-md border p-3 ${faults > 0 ? "border-red-200 bg-red-50/30" : ""}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{room.name}</p>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {roomTypeLabel[room.type] ?? room.type}
                          </span>
                          {faults > 0 && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                              {faults} panne(s)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">Étage {room.floor} · {room.capacity} places</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {lights.map((eq) => (
                        <span key={eq.id} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium border ${statusColor[eq.status]}`}>
                          <Lightbulb className="h-3 w-3" />
                          {eq.name}
                        </span>
                      ))}
                      {blinds.map((eq) => (
                        <span key={eq.id} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium border ${statusColor[eq.status]}`}>
                          <Wind className="h-3 w-3" />
                          {eq.name}
                        </span>
                      ))}
                      {room.hvacUnits.map((h) => (
                        <span key={h.name} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium border ${h.status === "FAULT" ? statusColor.FAULT : statusColor.ON}`}>
                          <Thermometer className="h-3 w-3" />
                          {h.currentTemperature.toFixed(1)}°C / {h.setTemperature}°C
                          {h.status === "FAULT" && " ⚠"}
                        </span>
                      ))}
                      {room.equipment.length === 0 && room.hvacUnits.length === 0 && (
                        <span className="text-[11px] text-muted-foreground">Aucun équipement connecté</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {building.rooms.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">Aucune salle visible dans ce bâtiment.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
