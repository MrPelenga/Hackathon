import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Cpu, Thermometer, Lightbulb, ShieldCheck,
  Wifi, WifiOff, Zap, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { IotReportButton, type ReportData, type Recommendation } from "./_components/IotReportButton";

const EQUIP_LABELS: Record<string, string> = {
  LIGHT: "Éclairage int.", PRESENCE_SENSOR: "Capteurs présence", DOOR: "Portes",
  BLIND: "Volets", AIR_QUALITY_SENSOR: "Qualité air", COMPUTER: "Informatique", OTHER: "Autre",
};

function computeHealthScore(data: {
  totalDevices: number; onlineDevices: number;
  criticalIncidents: number; denialRate: number;
}) {
  const { totalDevices, onlineDevices, criticalIncidents, denialRate } = data;
  const onlineRatio = totalDevices > 0 ? onlineDevices / totalDevices : 1;
  return Math.round(
    onlineRatio * 40 +
    (criticalIncidents === 0 ? 30 : criticalIncidents <= 2 ? 15 : 0) +
    20 +
    (denialRate < 0.05 ? 10 : denialRate < 0.10 ? 5 : 0)
  );
}

function generateRecommendations(data: {
  hvac: Awaited<ReturnType<typeof prisma.hvacUnit.findMany>>;
  lights: Awaited<ReturnType<typeof prisma.streetLight.findMany>>;
  equipment: Awaited<ReturnType<typeof prisma.equipment.findMany>>;
  rfid: Awaited<ReturnType<typeof prisma.rfidReader.findMany>>;
}): Recommendation[] {
  const recs: Recommendation[] = [];
  const now   = new Date();
  const month = now.getMonth(); // 0-based
  const isSummer = month >= 5 && month <= 8;

  // HVAC eco
  const hvacActive  = data.hvac.filter(u => u.status !== "OFF" && u.status !== "FAULT" && u.isOnline);
  const hvacNotEco  = hvacActive.filter(u => u.mode !== "ECO").length;
  if (hvacNotEco > 0) {
    const savings = Math.round(hvacNotEco * 45);
    recs.push({
      priority: "ÉLEVÉE", category: "HVAC",
      title: `Activer le mode Éco sur ${hvacNotEco} unité${hvacNotEco > 1 ? "s" : ""} HVAC`,
      description: `${hvacNotEco} unité${hvacNotEco > 1 ? "s" : ""} HVAC active${hvacNotEco > 1 ? "s" : ""} fonctionnent en mode non-Éco. Ce mode réduit la consommation de 15-20% en adaptant automatiquement la consigne selon l'occupation des espaces.`,
      savings: `~${savings}€/mois`,
    });
  }

  // HVAC fault
  const hvacFault = data.hvac.filter(u => u.status === "FAULT").length;
  if (hvacFault > 0) {
    recs.push({
      priority: "CRITIQUE", category: "Maintenance",
      title: `${hvacFault} unité${hvacFault > 1 ? "s" : ""} HVAC en panne`,
      description: `Une panne HVAC force les unités voisines à compenser, augmentant la consommation de 10-25%. Planifier une intervention corrective dans les 24-48h.`,
    });
  }

  // Heating in summer
  if (isSummer) {
    const heatingNow = data.hvac.filter(u => u.status === "HEATING").length;
    if (heatingNow > 0) {
      recs.push({
        priority: "ÉLEVÉE", category: "HVAC",
        title: `${heatingNow} unité${heatingNow > 1 ? "s" : ""} en mode CHAUFFAGE en été`,
        description: `En pleine saison estivale, des unités HVAC chauffent au lieu de refroidir. Vérifier les consignes et passer en mode AUTO ou ECO pour corriger cette anomalie.`,
      });
    }
  }

  // HVAC setpoint
  if (data.hvac.length > 0) {
    const avg = data.hvac.reduce((s, u) => s + u.setTemperature, 0) / data.hvac.length;
    if (isSummer && avg < 24) {
      recs.push({
        priority: "MOYENNE", category: "HVAC",
        title: `Climatisation trop froide (consigne moy. ${avg.toFixed(1)}°C)`,
        description: `La consigne de ${avg.toFixed(1)}°C est inférieure aux 24°C recommandés en été. Remonter la consigne à 24-26°C réduit la consommation de climatisation de 6-10%.`,
        savings: `6-10% sur la climatisation`,
      });
    }
    if (!isSummer && avg > 21) {
      recs.push({
        priority: "MOYENNE", category: "HVAC",
        title: `Chauffage trop élevé (consigne moy. ${avg.toFixed(1)}°C)`,
        description: `En hiver, chaque degré au-dessus de 20°C augmente la facture de chauffage d'environ 7%. Réduire la consigne à 20°C est recommandé.`,
        savings: `~${Math.round((avg - 20) * 7)}% sur le chauffage`,
      });
    }
  }

  // Manual lights on
  const manualOn = data.lights.filter(l => l.mode === "MANUAL" && l.status === "ON").length;
  if (manualOn > 0) {
    const wasteCost = Math.round(manualOn * 0.1 * 24 * 30 * 0.18);
    recs.push({
      priority: "MOYENNE", category: "Éclairage",
      title: `${manualOn} lampadaire${manualOn > 1 ? "s" : ""} en mode Manuel`,
      description: `Les lampadaires en mode Manuel ne s'adaptent pas à la luminosité ambiante ni aux horaires. Ils peuvent rester allumés inutilement en pleine journée.`,
      savings: `Jusqu'à ${wasteCost}€/mois évités`,
    });
  }

  // Faulty lights
  const faultLights = data.lights.filter(l => l.status === "FAULT").length;
  if (faultLights > 0) {
    recs.push({
      priority: "ÉLEVÉE", category: "Éclairage",
      title: `${faultLights} lampadaire${faultLights > 1 ? "s" : ""} en panne`,
      description: `${faultLights} lampadaire${faultLights > 1 ? "s" : ""} ne fonctionnent plus, compromettant la sécurité nocturne des zones extérieures. Maintenance urgente recommandée.`,
    });
  }

  // Offline devices
  const offlineAll = [
    ...data.equipment.filter(e => !e.isOnline),
    ...data.hvac.filter(u => !u.isOnline),
    ...data.lights.filter(l => !l.isOnline),
    ...data.rfid.filter(r => !r.isOnline),
  ].length;
  if (offlineAll > 0) {
    recs.push({
      priority: offlineAll > 10 ? "ÉLEVÉE" : "FAIBLE", category: "IoT",
      title: `${offlineAll} équipement${offlineAll > 1 ? "s" : ""} hors ligne`,
      description: `Ces équipements ne remontent plus de données, créant des angles morts dans la supervision. Vérifier la connectivité réseau et l'alimentation électrique.`,
    });
  }

  // Equipment faults
  const equipFault = data.equipment.filter(e => e.status === "FAULT" || e.status === "MAINTENANCE").length;
  if (equipFault > 0) {
    recs.push({
      priority: "MOYENNE", category: "Maintenance",
      title: `${equipFault} capteur${equipFault > 1 ? "s" : ""}/équipement${equipFault > 1 ? "s" : ""} en panne`,
      description: `Des équipements en panne peuvent fausser les mesures et provoquer des décisions de contrôle incorrectes (HVAC, éclairage). Planifier la maintenance préventive.`,
    });
  }

  // Sort: CRITIQUE > ÉLEVÉE > MOYENNE > FAIBLE
  const ORDER = { "CRITIQUE": 0, "ÉLEVÉE": 1, "MOYENNE": 2, "FAIBLE": 3 };
  return recs.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
}

export default async function IotPage() {
  const now        = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart  = new Date(now); weekStart.setDate(weekStart.getDate() - 7);

  const [equipment, hvacUnits, streetLights, rfidReaders, energyToday, energyWeek, openIncidents, accessEvents] =
    await Promise.all([
      prisma.equipment.findMany({ include: { room: { include: { building: true } } } }),
      prisma.hvacUnit.findMany({ include: { zone: { include: { building: true } }, room: { include: { building: true } } } }),
      prisma.streetLight.findMany({ include: { building: true } }),
      prisma.rfidReader.findMany(),
      prisma.sensorReading.aggregate({ where: { type: "ENERGY", timestamp: { gte: todayStart } }, _sum: { value: true } }),
      prisma.sensorReading.aggregate({ where: { type: "ENERGY", timestamp: { gte: weekStart } },  _sum: { value: true } }),
      prisma.incident.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, priority: "CRITICAL" } }),
      prisma.accessEvent.findMany({ where: { timestamp: { gte: todayStart } }, select: { result: true } }),
    ]);

  // Derived stats
  const allDevices = [
    ...equipment.map(e => ({ isOnline: e.isOnline, isFault: e.status === "FAULT" || e.status === "MAINTENANCE" })),
    ...hvacUnits.map(h  => ({ isOnline: h.isOnline, isFault: h.status === "FAULT" })),
    ...streetLights.map(l => ({ isOnline: l.isOnline, isFault: l.status === "FAULT" })),
    ...rfidReaders.map(r  => ({ isOnline: r.isOnline, isFault: false })),
  ];

  const totalDevices   = allDevices.length;
  const onlineDevices  = allDevices.filter(d => d.isOnline && !d.isFault).length;
  const offlineDevices = allDevices.filter(d => !d.isOnline).length;
  const faultDevices   = allDevices.filter(d => d.isFault).length;

  const accessGranted  = accessEvents.filter(e => e.result === "GRANTED").length;
  const accessDenied   = accessEvents.filter(e => e.result === "DENIED").length;
  const denialRate     = (accessGranted + accessDenied) > 0 ? accessDenied / (accessGranted + accessDenied) : 0;
  const healthScore    = computeHealthScore({ totalDevices, onlineDevices, criticalIncidents: openIncidents, denialRate });

  const energyTodayKwh = (energyToday._sum.value ?? 0) / 1000;
  const energyWeekKwh  = (energyWeek._sum.value  ?? 0) / 1000;

  // HVAC summary
  const hvacActive  = hvacUnits.filter(u => u.status === "HEATING" || u.status === "COOLING").length;
  const hvacEco     = hvacUnits.filter(u => u.mode === "ECO").length;
  const hvacFault   = hvacUnits.filter(u => u.status === "FAULT").length;
  const hvacOffline = hvacUnits.filter(u => !u.isOnline).length;
  const hvacTotalKw = hvacUnits.filter(u => u.status !== "OFF" && u.status !== "FAULT")
    .reduce((s, u) => s + (u.powerWatts ?? 0), 0) / 1000;
  const hvacAvgSet  = hvacUnits.length > 0 ? hvacUnits.reduce((s, u) => s + u.setTemperature, 0) / hvacUnits.length : 21;
  const hvacAvgCur  = hvacUnits.length > 0 ? hvacUnits.reduce((s, u) => s + u.currentTemperature, 0) / hvacUnits.length : 20;

  // Lights summary
  const lightsOn     = streetLights.filter(l => l.status === "ON").length;
  const lightsOff    = streetLights.filter(l => l.status === "OFF").length;
  const lightsFault  = streetLights.filter(l => l.status === "FAULT").length;
  const lightsAuto   = streetLights.filter(l => l.mode === "AUTO").length;
  const lightsManual = streetLights.filter(l => l.mode === "MANUAL").length;
  const lightsTotalKw = streetLights.filter(l => l.status === "ON").reduce((s, l) => s + l.powerWatts, 0) / 1000;

  // Equipment by type
  const typeMap = new Map<string, { total: number; online: number; fault: number }>();
  for (const e of equipment) {
    const cur = typeMap.get(e.type) ?? { total: 0, online: 0, fault: 0 };
    cur.total++;
    if (e.isOnline) cur.online++;
    if (e.status === "FAULT" || e.status === "MAINTENANCE") cur.fault++;
    typeMap.set(e.type, cur);
  }
  const equipByType = Array.from(typeMap.entries())
    .map(([type, stats]) => ({ type, label: EQUIP_LABELS[type] ?? type, ...stats }))
    .sort((a, b) => b.total - a.total);

  // Recommendations
  const recommendations = generateRecommendations({ hvac: hvacUnits, lights: streetLights, equipment, rfid: rfidReaders });

  // HVAC details for report
  const hvacDetails = hvacUnits.map(u => ({
    name: u.name,
    location: u.zone ? `${u.zone.building?.name ?? "?"} — ${u.zone.name}`
              : u.room ? `${u.room.building?.name ?? "?"} — ${u.room.name}` : "Campus",
    mode: u.mode, status: u.status,
    setTemp: u.setTemperature, currentTemp: u.currentTemperature,
    kw: u.powerWatts ? u.powerWatts / 1000 : null,
  }));

  const reportData: ReportData = {
    generatedAt: now.toISOString(),
    healthScore, totalDevices, onlineDevices, offlineDevices, faultDevices,
    hvac: { total: hvacUnits.length, active: hvacActive, eco: hvacEco, fault: hvacFault, offline: hvacOffline, avgSetpoint: hvacAvgSet, avgCurrent: hvacAvgCur, totalKw: hvacTotalKw },
    lights: { total: streetLights.length, on: lightsOn, off: lightsOff, fault: lightsFault, auto: lightsAuto, manual: lightsManual, totalKw: lightsTotalKw },
    rfid: { total: rfidReaders.length, online: rfidReaders.filter(r => r.isOnline).length, offline: rfidReaders.filter(r => !r.isOnline).length },
    equipByType, energyTodayKwh, energyWeekKwh, hvacDetails, recommendations,
  };

  // Status helpers
  const hvacStatusColors: Record<string, string> = {
    HEATING: "bg-orange-100 text-orange-700", COOLING: "bg-blue-100 text-blue-700",
    IDLE: "bg-muted text-muted-foreground", OFF: "bg-muted text-muted-foreground",
    FAULT: "bg-red-100 text-red-700",
  };
  const hvacStatusLabels: Record<string, string> = {
    HEATING: "Chauffe", COOLING: "Refroidit", IDLE: "Veille", OFF: "Éteint", FAULT: "Panne",
  };
  const hvacModeLabels: Record<string, string> = {
    AUTO: "Auto", MANUAL: "Manuel", ECO: "Éco", OFF: "Éteint",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supervision IoT</h1>
          <p className="text-sm text-muted-foreground">Gestion globale des équipements connectés du campus</p>
        </div>
        <IotReportButton data={reportData} />
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Équipements total</p>
                <p className="text-2xl font-bold">{totalDevices}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50"><Cpu className="h-4 w-4 text-blue-600" /></div>
            </div>
            <p className="text-xs mt-2">
              <span className="text-green-600 font-semibold">{onlineDevices} actifs</span>
              <span className="text-muted-foreground"> ({Math.round(onlineDevices / totalDevices * 100)}%)</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Hors ligne</p>
                <p className={`text-2xl font-bold ${offlineDevices > 5 ? "text-amber-600" : "text-muted-foreground"}`}>{offlineDevices}</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-100"><WifiOff className="h-4 w-4 text-slate-500" /></div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">{Math.round(offlineDevices / totalDevices * 100)}% du parc</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">En panne</p>
                <p className={`text-2xl font-bold ${faultDevices > 0 ? "text-red-600" : "text-green-600"}`}>{faultDevices}</p>
              </div>
              <div className={`p-2 rounded-lg ${faultDevices > 0 ? "bg-red-50" : "bg-green-50"}`}>
                <AlertTriangle className={`h-4 w-4 ${faultDevices > 0 ? "text-red-600" : "text-green-600"}`} />
              </div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">Maintenance requise</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Health Score</p>
                <p className={`text-2xl font-bold ${healthScore >= 80 ? "text-green-600" : healthScore >= 60 ? "text-amber-600" : "text-red-600"}`}>{healthScore}<span className="text-sm font-normal">/100</span></p>
              </div>
              <div className={`p-2 rounded-lg ${healthScore >= 80 ? "bg-green-50" : "bg-amber-50"}`}>
                <CheckCircle2 className={`h-4 w-4 ${healthScore >= 80 ? "text-green-600" : "text-amber-600"}`} />
              </div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">Score global campus</p>
          </CardContent>
        </Card>
      </div>

      {/* Category overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* HVAC */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              HVAC ({hvacUnits.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Actifs</span><span className="text-orange-600 font-semibold">{hvacActive}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mode Éco</span><span className={hvacEco > 0 ? "text-green-600 font-semibold" : "text-muted-foreground"}>{hvacEco}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pannes</span><span className={hvacFault > 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}>{hvacFault}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Puissance tot.</span><span className="font-medium">{hvacTotalKw.toFixed(1)} kW</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Consigne moy.</span><span className="font-medium">{hvacAvgSet.toFixed(1)}°C</span></div>
          </CardContent>
        </Card>

        {/* Lights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Éclairage ext. ({streetLights.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Allumés</span><span className="text-green-600 font-semibold">{lightsOn}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Éteints</span><span className="text-muted-foreground">{lightsOff}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pannes</span><span className={lightsFault > 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}>{lightsFault}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mode Auto</span><span className="font-medium">{lightsAuto}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Puissance tot.</span><span className="font-medium">{lightsTotalKw.toFixed(1)} kW</span></div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" />
              Capteurs/Equip. ({equipment.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            {equipByType.slice(0, 5).map(e => (
              <div key={e.type} className="flex justify-between">
                <span className="text-muted-foreground truncate">{e.label}</span>
                <span className="font-medium shrink-0 ml-2">{e.total} <span className="text-muted-foreground">({Math.round(e.online / e.total * 100)}%↑)</span></span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* RFID */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              Lecteurs RFID ({rfidReaders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">En ligne</span><span className="text-green-600 font-semibold">{rfidReaders.filter(r => r.isOnline).length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Hors ligne</span><span className={rfidReaders.filter(r => !r.isOnline).length > 0 ? "text-amber-600 font-semibold" : "text-muted-foreground"}>{rfidReaders.filter(r => !r.isOnline).length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Disponibilité</span><span className="font-medium">{Math.round(rfidReaders.filter(r => r.isOnline).length / rfidReaders.length * 100)}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Énergie jour</span><span className="font-medium">{(energyTodayKwh).toFixed(0)} kWh</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Énergie sem.</span><span className="font-medium">{(energyWeekKwh).toFixed(0)} kWh</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Recommandations énergétiques & IoT — {recommendations.length} point{recommendations.length > 1 ? "s" : ""} d'attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((r, i) => {
              const colors: Record<string, string> = {
                "CRITIQUE": "border-red-400 bg-red-50/50",
                "ÉLEVÉE":   "border-orange-400 bg-orange-50/50",
                "MOYENNE":  "border-amber-400 bg-amber-50/50",
                "FAIBLE":   "border-blue-300 bg-blue-50/50",
              };
              const badgeColors: Record<string, string> = {
                "CRITIQUE": "bg-red-100 text-red-700 border-red-200",
                "ÉLEVÉE":   "bg-orange-100 text-orange-700 border-orange-200",
                "MOYENNE":  "bg-amber-100 text-amber-700 border-amber-200",
                "FAIBLE":   "bg-blue-100 text-blue-700 border-blue-200",
              };
              return (
                <div key={i} className={`flex gap-3 p-3 rounded-lg border-l-4 ${colors[r.priority]}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[10px] border shrink-0 ${badgeColors[r.priority]}`}>{r.priority}</Badge>
                      <Badge variant="outline" className="text-[10px] shrink-0">{r.category}</Badge>
                      <span className="text-xs font-semibold">{r.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                    {r.savings && (
                      <p className="text-xs text-green-600 font-semibold mt-1">💰 {r.savings}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* HVAC Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-500" />
            Détail HVAC — {hvacUnits.length} unités
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Unité","Localisation","Mode","État","Actuelle","Consigne","Puissance","Connexion"].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {hvacUnits.map(u => {
                  const loc = u.zone ? `${u.zone.building?.name ?? "?"} — ${u.zone.name}`
                    : u.room ? `${u.room.building?.name ?? "?"} — ${u.room.name}` : "Campus";
                  return (
                    <tr key={u.id} className={`hover:bg-muted/30 ${u.status === "FAULT" ? "bg-red-50/40" : ""}`}>
                      <td className="px-3 py-2 font-medium text-xs whitespace-nowrap">{u.name}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground max-w-[140px] truncate">{loc}</td>
                      <td className="px-3 py-2">
                        <Badge variant={u.mode === "ECO" ? "secondary" : "outline"} className="text-[10px]">{hvacModeLabels[u.mode]}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={`text-[10px] border ${hvacStatusColors[u.status]} hover:${hvacStatusColors[u.status]}`}>{hvacStatusLabels[u.status]}</Badge>
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums font-semibold">{u.currentTemperature.toFixed(1)}°C</td>
                      <td className="px-3 py-2 text-xs tabular-nums text-muted-foreground">{u.setTemperature.toFixed(1)}°C</td>
                      <td className="px-3 py-2 text-xs tabular-nums">{u.powerWatts ? `${(u.powerWatts / 1000).toFixed(1)} kW` : "—"}</td>
                      <td className="px-3 py-2">
                        {u.isOnline
                          ? <span className="flex items-center gap-1 text-xs text-green-600"><Wifi className="h-3 w-3" />En ligne</span>
                          : <span className="flex items-center gap-1 text-xs text-muted-foreground"><WifiOff className="h-3 w-3" />Hors ligne</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lights table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Éclairage extérieur — {streetLights.length} lampadaires
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Identifiant","Bâtiment","État","Mode","Puissance","Connexion"].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {streetLights.map(l => (
                  <tr key={l.id} className={`hover:bg-muted/30 ${l.status === "FAULT" ? "bg-red-50/40" : ""}`}>
                    <td className="px-3 py-2 font-mono text-xs">{l.identifier}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{l.building?.name ?? "Périmètre campus"}</td>
                    <td className="px-3 py-2">
                      {l.status === "ON"    && <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Allumé</Badge>}
                      {l.status === "OFF"   && <Badge variant="outline" className="text-[10px] text-muted-foreground">Éteint</Badge>}
                      {l.status === "FAULT" && <Badge variant="destructive" className="text-[10px]">Panne</Badge>}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={l.mode === "AUTO" ? "secondary" : "outline"} className="text-[10px]">{l.mode === "AUTO" ? "Auto" : "Manuel"}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs tabular-nums">{l.status === "ON" ? `${l.powerWatts}W` : "0W"}</td>
                    <td className="px-3 py-2">
                      {l.isOnline
                        ? <span className="flex items-center gap-1 text-xs text-green-600"><Wifi className="h-3 w-3" />En ligne</span>
                        : <span className="flex items-center gap-1 text-xs text-muted-foreground"><WifiOff className="h-3 w-3" />Hors ligne</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* RFID Readers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            Lecteurs RFID — {rfidReaders.length} dispositifs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Nom","Localisation","Bâtiment","Zone","Niveau","Connexion"].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rfidReaders.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 text-xs font-medium">{r.name}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.location}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.building}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.zone}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">{r.securityLevel}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      {r.isOnline
                        ? <span className="flex items-center gap-1 text-xs text-green-600"><Wifi className="h-3 w-3" />En ligne</span>
                        : <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="h-3 w-3" />Hors ligne</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
