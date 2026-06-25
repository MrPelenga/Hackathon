import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, TrendingDown, Leaf, Factory } from "lucide-react";
import { EnergyCharts } from "./_components/EnergyCharts";

const KG_CO2_PER_KWH = 0.0571;
const PRICE_PER_KWH = 0.18;

function round2(n: number) { return Math.round(n * 100) / 100; }

export default async function EnergyPage() {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now); monthStart.setDate(monthStart.getDate() - 30);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [buildings, today, yesterday, weekAgg, monthAgg] = await Promise.all([
    prisma.building.findMany({ select: { id: true, name: true, shortName: true } }),
    prisma.sensorReading.aggregate({ where: { type: "ENERGY", timestamp: { gte: todayStart } }, _sum: { value: true } }),
    prisma.sensorReading.aggregate({ where: { type: "ENERGY", timestamp: { gte: yesterdayStart, lt: todayStart } }, _sum: { value: true } }),
    prisma.sensorReading.aggregate({ where: { type: "ENERGY", timestamp: { gte: weekStart } }, _sum: { value: true } }),
    prisma.sensorReading.aggregate({ where: { type: "ENERGY", timestamp: { gte: monthStart } }, _sum: { value: true } }),
  ]);

  const kWhToday = round2((today._sum.value ?? 0) / 1000);
  const kWhYesterday = round2((yesterday._sum.value ?? 0) / 1000);
  const kWhWeek = round2((weekAgg._sum.value ?? 0) / 1000);
  const kWhMonth = round2((monthAgg._sum.value ?? 0) / 1000);
  const deltaPercent = kWhYesterday > 0 ? Math.round((kWhToday - kWhYesterday) / kWhYesterday * 100) : 0;

  const co2Today = round2(kWhToday * KG_CO2_PER_KWH);
  const co2Avoided = round2(kWhMonth * 0.05 * KG_CO2_PER_KWH);
  const costToday = round2(kWhToday * PRICE_PER_KWH);
  const savings = round2(kWhMonth * 0.05 * PRICE_PER_KWH);

  // ─── Energy by building ────────────────────────────────────────────────────
  const byBuilding = await Promise.all(
    buildings.map(async b => {
      const agg = await prisma.sensorReading.aggregate({
        where: { type: "ENERGY", buildingId: b.id, timestamp: { gte: weekStart } },
        _sum: { value: true },
      });
      return { name: b.shortName, kWh: round2((agg._sum.value ?? 0) / 1000) };
    })
  );
  const totalByBuilding = byBuilding.reduce((s, b) => s + b.kWh, 0) || 1;

  // ─── Energy by hour today ──────────────────────────────────────────────────
  const byHour: { hour: string; kWh: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const hStart = new Date(todayStart); hStart.setHours(h);
    const hEnd = new Date(todayStart); hEnd.setHours(h + 1);
    const agg = await prisma.sensorReading.aggregate({
      where: { type: "ENERGY", timestamp: { gte: hStart, lt: hEnd } },
      _sum: { value: true },
    });
    byHour.push({ hour: `${h}h`, kWh: round2((agg._sum.value ?? 0) / 1000) });
  }

  // ─── Energy by day (30 days) ───────────────────────────────────────────────
  const byDay: { label: string; kWh: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const dStart = new Date(now); dStart.setDate(dStart.getDate() - i); dStart.setHours(0, 0, 0, 0);
    const dEnd = new Date(dStart); dEnd.setDate(dEnd.getDate() + 1);
    const agg = await prisma.sensorReading.aggregate({
      where: { type: "ENERGY", timestamp: { gte: dStart, lt: dEnd } },
      _sum: { value: true },
    });
    byDay.push({
      label: dStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      kWh: round2((agg._sum.value ?? 0) / 1000),
    });
  }

  // ─── Consumption by category (simulated from device types) ────────────────
  const [hvacW, lightW, rfidCount, sensorCount] = await Promise.all([
    prisma.hvacUnit.aggregate({ where: { isOnline: true }, _sum: { powerWatts: true } }),
    prisma.streetLight.aggregate({ where: { status: "ON" }, _sum: { powerWatts: true } }),
    prisma.rfidReader.count({ where: { isOnline: true } }),
    prisma.equipment.count({ where: { isOnline: true } }),
  ]);
  const hvacKw = (hvacW._sum.powerWatts ?? 0) / 1000;
  const lightKw = (lightW._sum.powerWatts ?? 0) / 1000;
  const rfidKw = rfidCount * 4 / 1000;
  const sensorKw = sensorCount * 3 / 1000;
  const otherKw = Math.max(0, kWhToday - hvacKw - lightKw - rfidKw - sensorKw) * 0.1;
  const byCategory = [
    { name: "Climatisation", kWh: round2(hvacKw), color: "#3b82f6" },
    { name: "Éclairage ext.", kWh: round2(lightKw), color: "#f59e0b" },
    { name: "Contrôle accès", kWh: round2(rfidKw), color: "#8b5cf6" },
    { name: "Capteurs", kWh: round2(sensorKw), color: "#10b981" },
    { name: "Autre", kWh: round2(otherKw || 1), color: "#94a3b8" },
  ].filter(c => c.kWh > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Énergie</h1>
        <p className="text-sm text-muted-foreground">Tableau de bord de consommation énergétique du campus</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Aujourd'hui</p>
                <p className="text-2xl font-bold mt-0.5">{kWhToday}<span className="text-sm font-normal ml-1">kWh</span></p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-50"><Zap className="h-4 w-4 text-yellow-600" /></div>
            </div>
            <p className={`text-xs mt-2 font-medium ${deltaPercent > 0 ? "text-red-500" : "text-green-600"}`}>
              {deltaPercent > 0 ? "+" : ""}{deltaPercent}% vs hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">7 jours</p>
                <p className="text-2xl font-bold mt-0.5">{kWhWeek}<span className="text-sm font-normal ml-1">kWh</span></p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50"><Zap className="h-4 w-4 text-blue-600" /></div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">≈ {round2(kWhWeek / 7)} kWh/jour</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Coût du jour</p>
                <p className="text-2xl font-bold mt-0.5">{costToday}<span className="text-sm font-normal ml-1">€</span></p>
              </div>
              <div className="p-2 rounded-lg bg-green-50"><TrendingDown className="h-4 w-4 text-green-600" /></div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">à {PRICE_PER_KWH}€/kWh</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">CO₂ aujourd'hui</p>
                <p className="text-2xl font-bold mt-0.5">{co2Today}<span className="text-sm font-normal ml-1">kg</span></p>
              </div>
              <div className="p-2 rounded-lg bg-red-50"><Factory className="h-4 w-4 text-red-600" /></div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">{KG_CO2_PER_KWH} kg CO₂/kWh</p>
          </CardContent>
        </Card>
      </div>

      {/* Savings + CO2 avoided */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50/40">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-100">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Économies réalisées (30j)</p>
                <p className="text-2xl font-bold text-green-700">{savings} €</p>
                <p className="text-xs text-muted-foreground">grâce aux optimisations intelligentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-100">
                <Leaf className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">CO₂ évité (30j)</p>
                <p className="text-2xl font-bold text-emerald-700">{co2Avoided} kg</p>
                <p className="text-xs text-muted-foreground">grâce aux modes Éco et gestion automatique</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <EnergyCharts
        byHour={byHour}
        byDay={byDay}
        byBuilding={byBuilding}
        byCategory={byCategory}
        totalByBuilding={totalByBuilding}
      />
    </div>
  );
}
