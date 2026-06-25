export const dynamic = "force-dynamic";
import { Lightbulb } from "lucide-react";
import { ModulePlaceholder } from "../_placeholder/ModulePlaceholder";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Activity, AlertTriangle } from "lucide-react";

async function LightingOverview() {
  const [lights, buildings] = await Promise.all([
    prisma.streetLight.findMany({ include: { building: { select: { shortName: true, name: true } } } }),
    prisma.building.findMany({ select: { id: true, name: true, shortName: true } }),
  ]);

  const total = lights.length;
  const on = lights.filter((l) => l.status === "ON").length;
  const off = lights.filter((l) => l.status === "OFF").length;
  const fault = lights.filter((l) => l.status === "FAULT").length;
  const auto = lights.filter((l) => l.mode === "AUTO").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Éclairage extérieur</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Surveillance et contrôle des lampadaires du campus</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Total" value={total} icon={Activity} />
        <StatCard title="Allumés" value={on} icon={Lightbulb} color="green" />
        <StatCard title="Éteints" value={off} icon={Lightbulb} color="default" />
        <StatCard title="En panne" value={fault} icon={AlertTriangle} color={fault > 0 ? "red" : "green"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Liste des lampadaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {lights.slice(0, 20).map((light) => (
              <div key={light.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  light.status === "ON" ? "bg-emerald-500" :
                  light.status === "FAULT" ? "bg-red-500 animate-pulse" : "bg-slate-300"
                }`} />
                <span className="text-sm font-medium w-16">{light.identifier}</span>
                <span className="text-xs text-muted-foreground flex-1">{light.building?.name ?? "Campus"}</span>
                <Badge variant="outline" className="text-[10px]">{light.mode}</Badge>
                <span className="text-xs text-muted-foreground">{light.powerWatts}W</span>
                <Badge
                  className={`text-[10px] ${
                    light.status === "ON" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" :
                    light.status === "FAULT" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                  variant="secondary"
                >
                  {light.status === "ON" ? "Allumé" : light.status === "FAULT" ? "Panne" : "Éteint"}
                </Badge>
              </div>
            ))}
            {lights.length > 20 && (
              <p className="text-xs text-muted-foreground text-center pt-2">… et {lights.length - 20} autres</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Fonctionnalités à venir : contrôle on/off manuel, mode auto (présence + luminosité), carte interactive, consommation par lampadaire.
        </CardContent>
      </Card>
    </div>
  );
}

export default function LightingPage() {
  return <LightingOverview />;
}
