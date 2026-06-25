export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Thermometer, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

async function HvacOverview() {
  const units = await prisma.hvacUnit.findMany({
    include: {
      zone: { include: { building: { select: { name: true, shortName: true } } } },
      room: { select: { name: true } },
    },
    orderBy: { lastUpdated: "desc" },
  });

  const faults = units.filter((u) => u.status === "FAULT").length;
  const avgTemp = units.length > 0 ? units.reduce((s, u) => s + u.currentTemperature, 0) / units.length : 0;
  const emptyButOn = units.filter((u) => u.status !== "OFF" && u.status !== "IDLE" && u.status !== "FAULT");

  const modeColors: Record<string, string> = {
    AUTO: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    ECO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    MANUAL: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    OFF: "bg-slate-100 text-slate-600 dark:bg-slate-800",
  };
  const statusColors: Record<string, string> = {
    HEATING: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    COOLING: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    IDLE: "bg-slate-100 text-slate-600 dark:bg-slate-800",
    OFF: "bg-slate-100 text-slate-500 dark:bg-slate-800",
    FAULT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };
  const statusLabels: Record<string, string> = {
    HEATING: "Chauffe", COOLING: "Refroidit", IDLE: "Veille", OFF: "Arrêt", FAULT: "Panne",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Climatisation & Température</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pilotage des unités HVAC par zone et par salle</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Unités totales" value={units.length} icon={Thermometer} />
        <StatCard title="Temp. moy. mesurée" value={`${Math.round(avgTemp * 10) / 10}°C`} icon={Thermometer} color="blue" />
        <StatCard title="En panne" value={faults} icon={AlertTriangle} color={faults > 0 ? "red" : "green"} />
        <StatCard title="Alertes salle vide" value={emptyButOn.length} icon={AlertTriangle} color={emptyButOn.length > 0 ? "yellow" : "green"} />
      </div>

      {emptyButOn.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {emptyButOn.length} zone(s) potentiellement climatisée(s) à vide
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Vérifiez les zones actives sans présence détectée pour optimiser la consommation.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Unités HVAC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {units.map((unit) => {
              const drift = Math.abs(unit.currentTemperature - unit.setTemperature);
              return (
                <div key={unit.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    unit.status === "FAULT" ? "bg-red-500 animate-pulse" :
                    unit.status === "HEATING" ? "bg-orange-400" :
                    unit.status === "COOLING" ? "bg-blue-400" : "bg-slate-300"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{unit.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {unit.zone?.building?.name ?? unit.room?.name ?? ""}
                    </p>
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <p className="font-semibold">{unit.currentTemperature.toFixed(1)}°C</p>
                    <p className="text-[11px] text-muted-foreground">consigne {unit.setTemperature}°C</p>
                  </div>
                  {drift > 2 && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${modeColors[unit.mode]}`}>
                    {unit.mode}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${statusColors[unit.status]}`}>
                    {statusLabels[unit.status]}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Fonctionnalités à venir : contrôle manuel de la consigne, planning de régulation, historique de température, détection de dérive automatique.
        </CardContent>
      </Card>
    </div>
  );
}

export default function HvacPage() {
  return <HvacOverview />;
}
