import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Zap, Wifi, WifiOff, Wind } from "lucide-react";
import { HvacControls } from "./_components/HvacControls";

const STATUS_LABELS: Record<string, string> = {
  HEATING: "Chauffe", COOLING: "Refroidit", IDLE: "Veille", OFF: "Éteint", FAULT: "Panne",
};
const MODE_LABELS: Record<string, string> = {
  AUTO: "Auto", MANUAL: "Manuel", ECO: "Éco", OFF: "Éteint",
};

export default async function HvacPage() {
  const units = await prisma.hvacUnit.findMany({
    include: {
      zone: { include: { building: true } },
      room: { include: { building: true } },
    },
    orderBy: { name: "asc" },
  });

  const total = units.length;
  const activeUnits = units.filter(u => u.status === "HEATING" || u.status === "COOLING").length;
  const idleUnits = units.filter(u => u.status === "IDLE").length;
  const faultUnits = units.filter(u => u.status === "FAULT").length;
  const ecoUnits = units.filter(u => u.mode === "ECO").length;
  const totalW = units.filter(u => u.status !== "OFF" && u.status !== "FAULT")
    .reduce((s, u) => s + (u.powerWatts ?? 0), 0);
  const avgTemp = units.length > 0
    ? units.reduce((s, u) => s + u.currentTemperature, 0) / units.length
    : 21;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Climatisation</h1>
        <p className="text-sm text-muted-foreground">Gestion des unités HVAC du campus</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground font-medium">Total</p>
            <p className="text-2xl font-bold mt-0.5">{total}</p>
            <p className="text-xs text-muted-foreground">unités HVAC</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground font-medium">Actives</p>
            <p className="text-2xl font-bold mt-0.5 text-blue-600">{activeUnits}</p>
            <p className="text-xs text-muted-foreground">en fonctionnement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground font-medium">Veille</p>
            <p className="text-2xl font-bold mt-0.5 text-muted-foreground">{idleUnits}</p>
            <p className="text-xs text-muted-foreground">en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground font-medium">Pannes</p>
            <p className="text-2xl font-bold mt-0.5 text-red-600">{faultUnits}</p>
            <p className="text-xs text-muted-foreground">à réparer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground font-medium">Temp. moy.</p>
            <p className="text-2xl font-bold mt-0.5">{avgTemp.toFixed(1)}°C</p>
            <p className="text-xs text-muted-foreground">campus</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 mb-0.5">
              <Zap className="h-3 w-3 text-yellow-500" />
              <p className="text-xs text-muted-foreground font-medium">Puissance</p>
            </div>
            <p className="text-2xl font-bold mt-0.5">{(totalW / 1000).toFixed(1)}<span className="text-base font-normal"> kW</span></p>
            <p className="text-xs text-muted-foreground">instantanée</p>
          </CardContent>
        </Card>
      </div>

      {/* Units table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-500" />
            Unités HVAC ({total}) — {ecoUnits} en mode Éco
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Unité</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Localisation</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">État</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Mode</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">Temp. actuelle</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">Consigne</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Puissance</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Connexion</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Contrôle</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {units.map(unit => {
                  const location = unit.zone
                    ? `${unit.zone.building?.name ?? "?"} — ${unit.zone.name}`
                    : unit.room
                    ? `${unit.room.building?.name ?? "?"} — ${unit.room.name}`
                    : "Campus";
                  const diff = unit.currentTemperature - unit.setTemperature;
                  return (
                    <tr key={unit.id} className={`hover:bg-muted/30 transition-colors ${unit.status === "FAULT" ? "bg-red-50/60" : ""}`}>
                      <td className="px-4 py-2.5 font-medium">{unit.name}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[160px] truncate">{location}</td>
                      <td className="px-4 py-2.5">
                        {unit.status === "HEATING" && <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Chauffe</Badge>}
                        {unit.status === "COOLING" && <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Refroidit</Badge>}
                        {unit.status === "IDLE" && <Badge variant="outline" className="text-[10px]">Veille</Badge>}
                        {unit.status === "OFF" && <Badge variant="outline" className="text-[10px] text-muted-foreground">Éteint</Badge>}
                        {unit.status === "FAULT" && <Badge variant="destructive" className="text-[10px]">Panne</Badge>}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={unit.mode === "ECO" ? "secondary" : "outline"}
                          className={`text-[10px] ${unit.mode === "AUTO" ? "border-blue-200 text-blue-700" : ""}`}
                        >
                          {MODE_LABELS[unit.mode]}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`font-semibold text-sm tabular-nums ${Math.abs(diff) > 2 ? "text-orange-600" : "text-foreground"}`}>
                          {unit.currentTemperature.toFixed(1)}°C
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-sm tabular-nums text-muted-foreground">{unit.setTemperature.toFixed(1)}°C</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums font-medium">
                        {unit.powerWatts ? `${(unit.powerWatts / 1000).toFixed(1)} kW` : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {unit.isOnline
                          ? <span className="flex items-center gap-1 text-xs text-green-600"><Wifi className="h-3 w-3" />En ligne</span>
                          : <span className="flex items-center gap-1 text-xs text-muted-foreground"><WifiOff className="h-3 w-3" />Hors ligne</span>
                        }
                      </td>
                      <td className="px-4 py-2.5">
                        <HvacControls
                          id={unit.id}
                          mode={unit.mode}
                          setTemperature={unit.setTemperature}
                          disabled={!unit.isOnline || unit.status === "FAULT"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
