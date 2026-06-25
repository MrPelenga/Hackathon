import { AlertTriangle, Thermometer, Lightbulb, Wrench, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import prisma from "@/lib/prisma";

async function getData() {
  const [openIncidents, hvacFaults, lightFaults, recentIncidents] = await Promise.all([
    prisma.incident.count({ where: { status: "OPEN" } }),
    prisma.hvacUnit.count({ where: { status: "FAULT" } }),
    prisma.streetLight.count({ where: { status: "FAULT" } }),
    prisma.incident.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 8,
      include: {
        room: { select: { name: true } },
        reportedBy: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  return { openIncidents, hvacFaults, lightFaults, recentIncidents };
}

const statusColor: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
};
const statusLabel: Record<string, string> = { OPEN: "Ouvert", IN_PROGRESS: "En cours" };
const priorityColor: Record<string, string> = {
  LOW: "bg-slate-300", MEDIUM: "bg-amber-400", HIGH: "bg-orange-500", CRITICAL: "bg-red-600",
};
const priorityLabel: Record<string, string> = {
  LOW: "Basse", MEDIUM: "Moyenne", HIGH: "Haute", CRITICAL: "Critique",
};
const categoryLabel: Record<string, string> = {
  LIGHTING: "Éclairage", HVAC: "Climatisation", BLIND: "Volet",
  EQUIPMENT: "Équipement", ACCESS: "Accès", PARKING: "Parking", OTHER: "Autre",
};

export default async function MaintenanceDashboard() {
  const d = await getData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord — Maintenance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Incidents et équipements à traiter · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard title="Incidents ouverts" value={d.openIncidents} icon={AlertTriangle}
          color={d.openIncidents > 5 ? "red" : d.openIncidents > 0 ? "yellow" : "green"} />
        <StatCard title="Pannes HVAC" value={d.hvacFaults} icon={Thermometer}
          color={d.hvacFaults > 0 ? "red" : "green"} />
        <StatCard title="Lampadaires HS" value={d.lightFaults} icon={Lightbulb}
          color={d.lightFaults > 0 ? "yellow" : "green"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-500" />
            Incidents à traiter (priorité décroissante)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {d.recentIncidents.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <p className="text-sm">Aucun incident ouvert. Tout fonctionne !</p>
            </div>
          ) : (
            <div className="space-y-2">
              {d.recentIncidents.map((inc) => (
                <div key={inc.id} className="flex items-start gap-3 rounded-md border px-3 py-3">
                  <span className={`h-2.5 w-2.5 mt-1.5 rounded-full shrink-0 ${priorityColor[inc.priority] ?? "bg-slate-300"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{inc.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[inc.status] ?? ""}`}>
                        {statusLabel[inc.status] ?? inc.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {categoryLabel[inc.category] ?? inc.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      {inc.room && <span>{inc.room.name}</span>}
                      <span>Priorité : {priorityLabel[inc.priority]}</span>
                      {inc.assignedTo && (
                        <span>→ {inc.assignedTo.firstName} {inc.assignedTo.lastName}</span>
                      )}
                    </div>
                  </div>
                  <a href="/dashboard/incidents" className="text-[11px] text-primary hover:underline shrink-0">
                    Traiter →
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Accès rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Tous les incidents", href: "/dashboard/incidents" },
            { label: "État HVAC", href: "/dashboard/hvac" },
            { label: "Éclairage", href: "/dashboard/lighting" },
            { label: "Bâtiments", href: "/dashboard/buildings" },
          ].map((item) => (
            <a key={item.href} href={item.href} className="rounded-lg border p-3 text-sm font-medium hover:bg-muted transition-colors text-center">
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
