export const dynamic = "force-dynamic";
import { requirePermission } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Zap, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default async function EnergyPage() {
  await requirePermission("energy", "view");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const [buildings, todayReadings, yesterdayReadings, weekReadings] = await Promise.all([
    prisma.building.findMany({
      select: { id: true, name: true, shortName: true },
      orderBy: { name: "asc" },
    }),
    prisma.sensorReading.findMany({
      where: { type: "ENERGY", timestamp: { gte: today } },
      select: { value: true, buildingId: true },
    }),
    prisma.sensorReading.findMany({
      where: { type: "ENERGY", timestamp: { gte: yesterday, lt: today } },
      select: { value: true, buildingId: true },
    }),
    prisma.sensorReading.findMany({
      where: { type: "ENERGY", timestamp: { gte: weekAgo } },
      select: { value: true, buildingId: true, timestamp: true },
    }),
  ]);

  const sum = (arr: { value: number }[]) => arr.reduce((s, r) => s + r.value, 0);

  const todayTotal = Math.round(sum(todayReadings) * 10) / 10;
  const yesterdayTotal = Math.round(sum(yesterdayReadings) * 10) / 10;
  const weekTotal = Math.round(sum(weekReadings) * 10) / 10;
  const trendPct = yesterdayTotal > 0
    ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)
    : 0;

  // Per-building breakdown today
  const byBuilding = buildings.map((b) => {
    const reading = sum(todayReadings.filter((r) => r.buildingId === b.id));
    return { ...b, kwh: Math.round(reading * 10) / 10 };
  });
  const maxKwh = Math.max(...byBuilding.map((b) => b.kwh), 1);

  // Heuristic prediction: average of last 3 days * 1.05 (simple growth estimate)
  const last3DaysTotal = weekReadings.filter((r) => {
    const ts = new Date(r.timestamp);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    return ts >= threeDaysAgo;
  });
  const predicted = Math.round((sum(last3DaysTotal) / 3) * 1.05 * 10) / 10;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Énergie</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Consommation électrique du campus</p>
      </div>

      {/* AI prediction banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Prédiction IA (heuristique)</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Sur la base des 3 derniers jours, la consommation prévue demain est d&apos;environ{" "}
              <span className="font-semibold">{predicted} kWh</span>.
              Modèle : moyenne glissante + facteur de croissance 5%.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Aujourd'hui" value={`${todayTotal} kWh`} icon={Zap} color="blue" />
        <StatCard title="Hier" value={`${yesterdayTotal} kWh`} icon={Zap} />
        <StatCard title="7 derniers jours" value={`${weekTotal} kWh`} icon={Zap} />
        <StatCard
          title="Tendance"
          value={`${trendPct > 0 ? "+" : ""}${trendPct}%`}
          icon={trendPct > 10 ? AlertTriangle : trendPct > 0 ? TrendingUp : TrendingDown}
          color={trendPct > 10 ? "red" : trendPct > 0 ? "yellow" : "green"}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Consommation par bâtiment — aujourd&apos;hui</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {byBuilding.filter((b) => b.kwh > 0).map((b) => (
            <div key={b.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{b.name}</span>
                <span className="tabular-nums text-muted-foreground">{b.kwh} kWh</span>
              </div>
              <Progress value={(b.kwh / maxKwh) * 100} className="h-2" />
            </div>
          ))}
          {byBuilding.every((b) => b.kwh === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucune donnée de capteur pour aujourd&apos;hui.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">À venir :</span> graphiques recharts (7/30/90 jours), alertes de consommation anormale, recommandations d&apos;optimisation, export CSV.
        </CardContent>
      </Card>
    </div>
  );
}
