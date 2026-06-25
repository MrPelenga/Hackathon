export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertTriangle, Clock, CheckCircle, Activity } from "lucide-react";

const statusLabel: Record<string, string> = {
  OPEN: "Ouvert", IN_PROGRESS: "En cours", RESOLVED: "Résolu", CLOSED: "Fermé",
};
const statusColor: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  RESOLVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  CLOSED: "bg-slate-100 text-slate-600",
};
const priorityColor: Record<string, string> = {
  LOW: "bg-slate-300", MEDIUM: "bg-amber-400", HIGH: "bg-orange-500", CRITICAL: "bg-red-600",
};
const categoryLabel: Record<string, string> = {
  LIGHTING: "Éclairage", HVAC: "Climatisation", BLIND: "Volet", EQUIPMENT: "Équipement",
  ACCESS: "Accès", PARKING: "Parking", OTHER: "Autre",
};

async function IncidentsOverview() {
  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      room: { select: { name: true } },
      reportedBy: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });

  const open = incidents.filter((i) => i.status === "OPEN").length;
  const inProgress = incidents.filter((i) => i.status === "IN_PROGRESS").length;
  const resolved = incidents.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length;
  const critical = incidents.filter((i) => i.priority === "CRITICAL" || i.priority === "HIGH").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Incidents & Maintenance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Suivi des signalements et de leur traitement</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Ouverts" value={open} icon={AlertTriangle} color={open > 0 ? "red" : "green"} />
        <StatCard title="En cours" value={inProgress} icon={Clock} color={inProgress > 0 ? "yellow" : "green"} />
        <StatCard title="Résolus" value={resolved} icon={CheckCircle} color="green" />
        <StatCard title="Priorité haute" value={critical} icon={Activity} color={critical > 0 ? "red" : "green"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tous les incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {incidents.map((inc) => (
              <div key={inc.id} className="flex items-start gap-3 rounded-md border px-3 py-3">
                <span className={`h-2.5 w-2.5 mt-1.5 rounded-full shrink-0 ${priorityColor[inc.priority] ?? "bg-slate-300"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{inc.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[inc.status]}`}>
                      {statusLabel[inc.status]}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {categoryLabel[inc.category]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{inc.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    {inc.room && <span>{inc.room.name}</span>}
                    <span>Par {inc.reportedBy.firstName} {inc.reportedBy.lastName}</span>
                    {inc.assignedTo && <span>→ {inc.assignedTo.firstName} {inc.assignedTo.lastName}</span>}
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-0.5">
                  {new Date(inc.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
            {incidents.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">Aucun incident enregistré.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function IncidentsPage() {
  return <IncidentsOverview />;
}
