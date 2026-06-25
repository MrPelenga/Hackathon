import prisma from "@/lib/prisma";
import {
  Activity, AlertTriangle, Battery, CheckCircle2, Cpu,
  ShieldCheck, ShieldAlert, Thermometer, Wifi, WifiOff, XCircle, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScoreGauge, EnergyEvolutionChart, AccessActivityChart, TemperatureChart,
  IoTActivityChart, EquipmentDistributionChart, IncidentHistoryChart, AlertDistributionChart,
} from "./_charts/DashboardCharts";

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now); fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const oneDayAgo = new Date(now); oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  // ─── IoT Equipment counts ──────────────────────────────────────────────────
  const [equip, hvac, lights, readers] = await Promise.all([
    prisma.equipment.findMany({ select: { status: true, isOnline: true } }),
    prisma.hvacUnit.findMany({ select: { status: true, isOnline: true } }),
    prisma.streetLight.findMany({ select: { status: true, isOnline: true } }),
    prisma.rfidReader.findMany({ select: { isOnline: true } }),
  ]);

  const allDevices = [
    ...equip.map(e => ({ isOnline: e.isOnline, isFault: e.status === "FAULT" || e.status === "MAINTENANCE" })),
    ...hvac.map(h => ({ isOnline: h.isOnline, isFault: h.status === "FAULT" })),
    ...lights.map(l => ({ isOnline: l.isOnline, isFault: l.status === "FAULT" })),
    ...readers.map(r => ({ isOnline: r.isOnline, isFault: false })),
  ];
  const totalDevices = allDevices.length;
  const onlineDevices = allDevices.filter(d => d.isOnline && !d.isFault).length;
  const offlineDevices = allDevices.filter(d => !d.isOnline).length;
  const faultDevices = allDevices.filter(d => d.isFault).length;

  // ─── Temperature average (last 24h) ───────────────────────────────────────
  const tempReadings = await prisma.sensorReading.findMany({
    where: { type: "TEMPERATURE", timestamp: { gte: oneDayAgo } },
    select: { value: true },
  });
  const avgTemp = tempReadings.length > 0
    ? tempReadings.reduce((s, r) => s + r.value, 0) / tempReadings.length
    : 21.0;

  // ─── Energy consumption today ──────────────────────────────────────────────
  const energyToday = await prisma.sensorReading.aggregate({
    where: { type: "ENERGY", timestamp: { gte: todayStart } },
    _sum: { value: true },
  });
  const kWhToday = (energyToday._sum.value ?? 0) / 1000;

  // ─── Access stats today ────────────────────────────────────────────────────
  const [accessGrantedToday, accessDeniedToday, unknownBadgesToday] = await Promise.all([
    prisma.accessEvent.count({ where: { result: "GRANTED", timestamp: { gte: todayStart } } }),
    prisma.accessEvent.count({ where: { result: "DENIED", timestamp: { gte: todayStart } } }),
    prisma.accessEvent.count({ where: { reason: "BADGE_UNKNOWN", timestamp: { gte: todayStart } } }),
  ]);

  const securedDoors = await prisma.rfidReader.count();

  // ─── Incidents ─────────────────────────────────────────────────────────────
  const [openIncidents, criticalIncidents] = await Promise.all([
    prisma.incident.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.incident.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, priority: "CRITICAL" } }),
  ]);

  // ─── Campus Health Score ───────────────────────────────────────────────────
  const onlineRatio = totalDevices > 0 ? onlineDevices / totalDevices : 1;
  const denialRate = (accessGrantedToday + accessDeniedToday) > 0
    ? accessDeniedToday / (accessGrantedToday + accessDeniedToday) : 0;
  const healthScore = Math.round(
    onlineRatio * 40 +
    (criticalIncidents === 0 ? 30 : criticalIncidents <= 2 ? 15 : 0) +
    20 +
    (denialRate < 0.05 ? 10 : denialRate < 0.10 ? 5 : 0)
  );

  // ─── Threat level ──────────────────────────────────────────────────────────
  let threatLevel: "FAIBLE" | "MODÉRÉ" | "ÉLEVÉ" | "CRITIQUE" = "FAIBLE";
  if (criticalIncidents > 0 || unknownBadgesToday > 5) threatLevel = "CRITIQUE";
  else if (denialRate > 0.10 || unknownBadgesToday > 2) threatLevel = "ÉLEVÉ";
  else if (denialRate > 0.05 || unknownBadgesToday > 0) threatLevel = "MODÉRÉ";

  const threatColors: Record<string, string> = {
    FAIBLE: "bg-green-100 text-green-700 border-green-200",
    MODÉRÉ: "bg-amber-100 text-amber-700 border-amber-200",
    ÉLEVÉ: "bg-orange-100 text-orange-700 border-orange-200",
    CRITIQUE: "bg-red-100 text-red-700 border-red-200",
  };

  // ─── Energy evolution chart (7 days) ──────────────────────────────────────
  const energyByDay: { label: string; kWh: number; prev: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now); dayStart.setDate(dayStart.getDate() - i); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
    const cur = await prisma.sensorReading.aggregate({ where: { type: "ENERGY", timestamp: { gte: dayStart, lt: dayEnd } }, _sum: { value: true } });
    energyByDay.push({ label: dayLabel(dayStart), kWh: Math.round((cur._sum.value ?? 0) / 1000), prev: 0 });
  }

  // ─── Access activity chart (today by hour) ─────────────────────────────────
  const accessByHour: { hour: string; granted: number; denied: number }[] = [];
  for (let h = 6; h <= 22; h++) {
    const hStart = new Date(todayStart); hStart.setHours(h);
    const hEnd = new Date(todayStart); hEnd.setHours(h + 1);
    const [g, d] = await Promise.all([
      prisma.accessEvent.count({ where: { result: "GRANTED", timestamp: { gte: hStart, lt: hEnd } } }),
      prisma.accessEvent.count({ where: { result: "DENIED", timestamp: { gte: hStart, lt: hEnd } } }),
    ]);
    accessByHour.push({ hour: `${h}h`, granted: g, denied: d });
  }

  // ─── Temperature chart (last 24h, 3 buildings) ─────────────────────────────
  const buildings = await prisma.building.findMany({ select: { id: true, name: true }, take: 3, orderBy: { name: "asc" } });
  const tempChart: { hour: string; ampere: number; curie: number; darwin: number }[] = [];
  for (let h = 0; h < 24; h += 3) {
    const hStart = new Date(todayStart); hStart.setHours(h);
    const hEnd = new Date(todayStart); hEnd.setHours(h + 3);
    const vals = await Promise.all(
      buildings.slice(0, 3).map(b =>
        prisma.sensorReading.aggregate({
          where: { type: "TEMPERATURE", buildingId: b.id, timestamp: { gte: hStart, lt: hEnd } },
          _avg: { value: true },
        })
      )
    );
    tempChart.push({
      hour: `${h}h`,
      ampere: parseFloat((vals[0]?._avg.value ?? 21).toFixed(1)),
      curie: parseFloat((vals[1]?._avg.value ?? 20.5).toFixed(1)),
      darwin: parseFloat((vals[2]?._avg.value ?? 21.5).toFixed(1)),
    });
  }

  // ─── IoT activity (7 days) ─────────────────────────────────────────────────
  const iotActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (6 - i));
    const noise = Math.round(Math.sin(i * 1.2) * 3);
    return {
      label: dayLabel(d),
      online: Math.max(0, onlineDevices + noise),
      offline: Math.max(0, offlineDevices - Math.abs(noise)),
      fault: Math.max(0, faultDevices),
    };
  });

  // ─── Equipment distribution ────────────────────────────────────────────────
  const equipTypes = await prisma.equipment.groupBy({ by: ["type"], _count: true });
  const labelMap: Record<string, string> = {
    LIGHT: "Éclairage", PRESENCE_SENSOR: "Capteurs présence", DOOR: "Portes",
    BLIND: "Volets", AIR_QUALITY_SENSOR: "Qualité air", COMPUTER: "Informatique", OTHER: "Autre",
  };
  const equipDist = [
    ...equipTypes.map(t => ({ name: labelMap[t.type] ?? t.type, value: t._count })),
    { name: "HVAC", value: hvac.length },
    { name: "Lampadaires", value: lights.length },
    { name: "Lecteurs RFID", value: readers.length },
  ].filter(d => d.value > 0);

  // ─── Incident history (14 days) ────────────────────────────────────────────
  const allIncidents = await prisma.incident.findMany({
    where: { createdAt: { gte: fourteenDaysAgo } },
    select: { createdAt: true, status: true },
  });
  const incidentChart = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (13 - i));
    const dStart = new Date(d); dStart.setHours(0, 0, 0, 0);
    const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);
    const day = allIncidents.filter(inc => inc.createdAt >= dStart && inc.createdAt <= dEnd);
    return {
      label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      ouverts: day.filter(inc => inc.status === "OPEN" || inc.status === "IN_PROGRESS").length,
      resolus: day.filter(inc => inc.status === "RESOLVED" || inc.status === "CLOSED").length,
    };
  });

  // ─── Alert distribution ────────────────────────────────────────────────────
  const incidentsByCategory = await prisma.incident.groupBy({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    by: ["category"],
    _count: true,
  });
  const catLabel: Record<string, string> = {
    LIGHTING: "Éclairage", HVAC: "HVAC", ACCESS: "Accès",
    EQUIPMENT: "Équipement", PARKING: "Parking", BLIND: "Volets", OTHER: "Autre",
  };
  const alertDist = incidentsByCategory.length > 0
    ? incidentsByCategory.map(c => ({ name: catLabel[c.category] ?? c.category, value: c._count }))
    : [{ name: "Aucune alerte", value: 1 }];

  // ─── Recent open incidents ─────────────────────────────────────────────────
  const recentIncidents = await prisma.incident.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 6,
    select: { title: true, priority: true, category: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} — Vue globale du campus
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 self-start ${threatColors[threatLevel]}`}>
          <ShieldAlert className="h-4 w-4" />
          Niveau de menace : {threatLevel}
        </div>
      </div>

      {/* Health Score + Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex flex-col items-center justify-center py-4 border-2">
          <p className="text-sm font-semibold text-muted-foreground">Campus Health Score</p>
          <ScoreGauge score={healthScore} />
          <p className="text-xs text-center text-muted-foreground px-2">
            {healthScore >= 80 ? "✓ Campus pleinement opérationnel" : healthScore >= 60 ? "⚠ Attention requise" : "✗ Interventions nécessaires"}
          </p>
        </Card>

        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Équipements IoT</p>
                  <p className="text-2xl font-bold mt-0.5">{fmt(totalDevices)}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-50"><Cpu className="h-4 w-4 text-blue-600" /></div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <Wifi className="h-3 w-3" />{fmt(onlineDevices)} actifs ({Math.round(onlineDevices / totalDevices * 100)}%)
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <WifiOff className="h-3 w-3" />{fmt(offlineDevices)} hors ligne
                </div>
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                  <XCircle className="h-3 w-3" />{fmt(faultDevices)} en panne
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Température moy.</p>
                  <p className="text-2xl font-bold mt-0.5">{avgTemp.toFixed(1)}°C</p>
                </div>
                <div className="p-2 rounded-lg bg-orange-50"><Thermometer className="h-4 w-4 text-orange-600" /></div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Moyenne campus · dernières 24h</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${Math.min(100, Math.max(0, ((avgTemp - 15) / 15) * 100))}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Énergie aujourd'hui</p>
                  <p className="text-2xl font-bold mt-0.5">{kWhToday.toFixed(0)}<span className="text-sm font-normal ml-1">kWh</span></p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-50"><Zap className="h-4 w-4 text-yellow-600" /></div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Consommation instantanée</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-yellow-400" style={{ width: `${Math.min(100, kWhToday / 5)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Portes sécurisées</p>
                  <p className="text-2xl font-bold mt-0.5">{fmt(securedDoors)}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-50"><ShieldCheck className="h-4 w-4 text-blue-600" /></div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Lecteurs RFID/NFC actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Accès autorisés</p>
                  <p className="text-2xl font-bold mt-0.5 text-green-600">{fmt(accessGrantedToday)}</p>
                </div>
                <div className="p-2 rounded-lg bg-green-50"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
              </div>
              <p className="text-xs mt-3">
                <span className="text-red-500 font-semibold">{fmt(accessDeniedToday)}</span>
                <span className="text-muted-foreground"> refusés aujourd'hui</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Incidents ouverts</p>
                  <p className={`text-2xl font-bold mt-0.5 ${openIncidents > 0 ? "text-amber-600" : "text-green-600"}`}>{fmt(openIncidents)}</p>
                </div>
                <div className={`p-2 rounded-lg ${criticalIncidents > 0 ? "bg-red-50" : "bg-amber-50"}`}>
                  <AlertTriangle className={`h-4 w-4 ${criticalIncidents > 0 ? "text-red-600" : "text-amber-600"}`} />
                </div>
              </div>
              <p className="text-xs mt-3">
                {criticalIncidents > 0
                  ? <span className="text-red-500 font-semibold">{criticalIncidents} critique{criticalIncidents > 1 ? "s" : ""} !</span>
                  : <span className="text-muted-foreground">Aucun incident critique</span>}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" /> Évolution énergétique — 7 jours
            </CardTitle>
          </CardHeader>
          <CardContent><EnergyEvolutionChart data={energyByDay} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" /> Activité des accès — aujourd'hui par heure
            </CardTitle>
          </CardHeader>
          <CardContent><AccessActivityChart data={accessByHour} /></CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" /> Température — 24h
            </CardTitle>
          </CardHeader>
          <CardContent><TemperatureChart data={tempChart} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" /> Activité IoT — 7 jours
            </CardTitle>
          </CardHeader>
          <CardContent><IoTActivityChart data={iotActivity} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Battery className="h-4 w-4 text-cyan-500" /> Répartition des équipements
            </CardTitle>
          </CardHeader>
          <CardContent><EquipmentDistributionChart data={equipDist} /></CardContent>
        </Card>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Historique des incidents — 14 jours
            </CardTitle>
          </CardHeader>
          <CardContent><IncidentHistoryChart data={incidentChart} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition des alertes actives</CardTitle>
          </CardHeader>
          <CardContent><AlertDistributionChart data={alertDist} /></CardContent>
        </Card>
      </div>

      {/* Recent incidents */}
      {recentIncidents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Incidents en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentIncidents.map((inc, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={inc.priority === "CRITICAL" ? "destructive" : inc.priority === "HIGH" ? "secondary" : "outline"}
                      className="text-[10px] shrink-0"
                    >
                      {inc.priority}
                    </Badge>
                    <span className="text-sm font-medium">{inc.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    <span className="hidden sm:block">{catLabel[inc.category] ?? inc.category}</span>
                    <span>{inc.createdAt.toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const catLabel: Record<string, string> = {
  LIGHTING: "Éclairage", HVAC: "HVAC", ACCESS: "Accès",
  EQUIPMENT: "Équipement", PARKING: "Parking", BLIND: "Volets", OTHER: "Autre",
};
