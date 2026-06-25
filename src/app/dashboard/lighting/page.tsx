import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Zap, Wifi, WifiOff, Eye } from "lucide-react";
import { LightingControls } from "./_components/LightingControls";

export default async function LightingPage() {
  const lights = await prisma.streetLight.findMany({
    include: { building: true },
    orderBy: [{ building: { name: "asc" } }, { identifier: "asc" }],
  });

  const total = lights.length;
  const on = lights.filter(l => l.status === "ON").length;
  const off = lights.filter(l => l.status === "OFF").length;
  const fault = lights.filter(l => l.status === "FAULT").length;
  const auto = lights.filter(l => l.mode === "AUTO").length;
  const totalW = lights.filter(l => l.status === "ON").reduce((s, l) => s + l.powerWatts, 0);
  const kW = totalW / 1000;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Éclairage extérieur</h1>
        <p className="text-sm text-muted-foreground">Gestion des lampadaires connectés du campus</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground font-medium">Total</p>
            <p className="text-2xl font-bold mt-0.5">{total}</p>
            <p className="text-xs text-muted-foreground">lampadaires</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground font-medium">Allumés</p>
            <p className="text-2xl font-bold mt-0.5 text-green-600">{on}</p>
            <p className="text-xs text-muted-foreground">{Math.round(on / total * 100)}% du parc</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground font-medium">Éteints</p>
            <p className="text-2xl font-bold mt-0.5 text-muted-foreground">{off}</p>
            <p className="text-xs text-muted-foreground">hors service</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground font-medium">En panne</p>
            <p className="text-2xl font-bold mt-0.5 text-red-600">{fault}</p>
            <p className="text-xs text-muted-foreground">à réparer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground font-medium">Mode Auto</p>
            <p className="text-2xl font-bold mt-0.5 text-blue-600">{auto}</p>
            <p className="text-xs text-muted-foreground">lampadaires</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 mb-0.5">
              <Zap className="h-3 w-3 text-yellow-500" />
              <p className="text-xs text-muted-foreground font-medium">Consommation</p>
            </div>
            <p className="text-2xl font-bold mt-0.5">{kW.toFixed(1)}<span className="text-base font-normal"> kW</span></p>
            <p className="text-xs text-muted-foreground">instantanée</p>
          </CardContent>
        </Card>
      </div>

      {/* Lights table with controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Parc de lampadaires ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Identifiant</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Localisation</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">État</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Mode</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Présence</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Puissance</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Connecté</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Contrôle</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lights.map(light => {
                  const presenceDetected = light.status === "ON" && light.mode === "AUTO" &&
                    (light.id.charCodeAt(light.id.length - 1) % 3 === 0);
                  return (
                    <tr key={light.id} className={`hover:bg-muted/30 transition-colors ${light.status === "FAULT" ? "bg-red-50/60" : ""}`}>
                      <td className="px-4 py-2.5 font-mono text-xs font-medium">{light.identifier}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {light.building?.name ?? "Périmètre campus"}
                      </td>
                      <td className="px-4 py-2.5">
                        {light.status === "ON" && <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Allumé</Badge>}
                        {light.status === "OFF" && <Badge variant="outline" className="text-[10px] text-muted-foreground">Éteint</Badge>}
                        {light.status === "FAULT" && <Badge variant="destructive" className="text-[10px]">Panne</Badge>}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={light.mode === "AUTO" ? "secondary" : "outline"} className="text-[10px]">
                          {light.mode === "AUTO" ? "Auto" : "Manuel"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        {presenceDetected
                          ? <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><Eye className="h-3 w-3" />Détectée</span>
                          : <span className="text-xs text-muted-foreground">—</span>
                        }
                      </td>
                      <td className="px-4 py-2.5 text-xs text-right tabular-nums font-medium">
                        {light.status === "ON" ? `${light.powerWatts}W` : "0W"}
                      </td>
                      <td className="px-4 py-2.5">
                        {light.isOnline
                          ? <span className="flex items-center gap-1 text-xs text-green-600"><Wifi className="h-3 w-3" />En ligne</span>
                          : <span className="flex items-center gap-1 text-xs text-muted-foreground"><WifiOff className="h-3 w-3" />Hors ligne</span>
                        }
                      </td>
                      <td className="px-4 py-2.5">
                        <LightingControls id={light.id} status={light.status} mode={light.mode} disabled={!light.isOnline} />
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
