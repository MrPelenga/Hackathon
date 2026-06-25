export const dynamic = "force-dynamic";
import {
  Users, Car, AlertTriangle, Zap, Thermometer, Building2,
  TrendingUp, ShieldCheck, Activity, Clock,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import prisma from "@/lib/prisma";
import { Suspense } from "react";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    studentsOnCampus,
    openIncidents,
    parkingSpots,
    hvacUnits,
    notifications,
    recentIncidents,
    buildings,
    latestSensorReadings,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.campusPresence.count({ where: { checkedOutAt: null, checkedInAt: { gte: today } } }),
    prisma.incident.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.parkingSpot.findMany({ select: { status: true } }),
    prisma.hvacUnit.findMany({ select: { currentTemperature: true, mode: true, status: true, isOnline: true } }),
    prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { type: true, title: true, body: true, createdAt: true },
    }),
    prisma.incident.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { room: { select: { name: true } }, reportedBy: { select: { firstName: true, lastName: true } } },
    }),
    prisma.building.findMany({ include: { rooms: { select: { capacity: true } }, _count: { select: { rooms: true } } } }),
    prisma.sensorReading.findMany({
      where: { type: "ENERGY", timestamp: { gte: today } },
      select: { value: true },
    }),
  ]);

  const totalSpots = parkingSpots.length;
  const freeSpots = parkingSpots.filter((s) => s.status === "FREE").length;
  const parkingOccupancy = totalSpots > 0 ? Math.round(((totalSpots - freeSpots) / totalSpots) * 100) : 0;

  const energyToday = latestSensorReadings.reduce((sum, r) => sum + r.value, 0);
  const avgTemp = hvacUnits.length > 0
    ? hvacUnits.reduce((s, u) => s + u.currentTemperature, 0) / hvacUnits.length
    : 0;

  const lightFaults = await prisma.streetLight.count({ where: { status: "FAULT" } });
  const totalLights = await prisma.streetLight.count();

  return {
    totalStudents,
    studentsOnCampus,
    openIncidents,
    parkingOccupancy,
    freeSpots,
    totalSpots,
    energyToday: Math.round(energyToday * 10) / 10,
    avgTemp: Math.round(avgTemp * 10) / 10,
    hvacFaults: hvacUnits.filter((u) => u.status === "FAULT").length,
    lightFaults,
    totalLights,
    notifications,
    recentIncidents,
    buildings,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function IncidentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  };
  const labels: Record<string, string> = { OPEN: "Ouvert", IN_PROGRESS: "En cours", RESOLVED: "Résolu" };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${map[status] ?? ""}`}>{labels[status] ?? status}</span>;
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { LOW: "bg-slate-400", MEDIUM: "bg-amber-400", HIGH: "bg-orange-500", CRITICAL: "bg-red-600" };
  return <span className={`h-2 w-2 rounded-full ${colors[priority] ?? "bg-slate-400"} shrink-0`} />;
}

// ── Page ─────────────────────────────────────────────────────────────────────

async function DashboardContent() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vue d&apos;ensemble du campus · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard
          title="Étudiants présents"
          value={data.studentsOnCampus}
          sub={`/ ${data.totalStudents} inscrits`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Parking"
          value={`${data.parkingOccupancy}%`}
          sub={`${data.freeSpots} places libres`}
          icon={Car}
          color={data.parkingOccupancy > 85 ? "red" : data.parkingOccupancy > 65 ? "yellow" : "green"}
        />
        <StatCard
          title="Incidents ouverts"
          value={data.openIncidents}
          sub="à traiter"
          icon={AlertTriangle}
          color={data.openIncidents > 3 ? "red" : data.openIncidents > 0 ? "yellow" : "green"}
        />
        <StatCard
          title="Énergie aujourd&apos;hui"
          value={`${data.energyToday} kWh`}
          sub="tous bâtiments"
          icon={Zap}
          color="blue"
        />
        <StatCard
          title="Temp. moyenne"
          value={`${data.avgTemp}°C`}
          sub={`${data.hvacFaults} unité(s) en panne`}
          icon={Thermometer}
          color={data.hvacFaults > 0 ? "red" : "green"}
        />
        <StatCard
          title="Éclairage"
          value={`${data.totalLights - data.lightFaults}/${data.totalLights}`}
          sub={`${data.lightFaults} panne(s)`}
          icon={Activity}
          color={data.lightFaults > 0 ? "yellow" : "green"}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent incidents */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Incidents récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun incident ouvert.</p>
            ) : (
              <div className="space-y-3">
                {data.recentIncidents.map((inc) => (
                  <div key={inc.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <PriorityDot priority={inc.priority} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{inc.title}</p>
                        <IncidentStatusBadge status={inc.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {inc.room?.name && <span>{inc.room.name} · </span>}
                        Signalé par {inc.reportedBy.firstName} {inc.reportedBy.lastName}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                      {new Date(inc.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Alertes système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.notifications.map((notif, i) => (
                <AlertCard
                  key={i}
                  type={notif.type}
                  title={notif.title}
                  body={notif.body}
                  time={new Date(notif.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                />
              ))}
              {data.notifications.length === 0 && (
                <p className="text-sm text-muted-foreground py-2 text-center">Aucune alerte.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Buildings overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Bâtiments du campus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.buildings.map((b) => {
              const totalCap = b.rooms.reduce((s, r) => s + r.capacity, 0);
              const simulatedOcc = Math.floor(Math.random() * 60 + 20);
              return (
                <div key={b.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground">{b._count.rooms} salle(s) · {b.floorCount} étage(s)</p>
                    </div>
                    <Badge variant={b.isOpen ? "outline" : "destructive"} className="text-[10px] shrink-0">
                      {b.isOpen ? "Ouvert" : "Fermé"}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Occupation</span>
                      <span>{simulatedOcc}%</span>
                    </div>
                    <Progress value={simulatedOcc} className="h-1.5" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Capacité totale : {totalCap} personnes</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Module quick-links */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Accès rapide aux modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {[
            { label: "Parkings", href: "/dashboard/parking", icon: Car, color: "text-blue-600" },
            { label: "Éclairage", href: "/dashboard/lighting", icon: Activity, color: "text-amber-600" },
            { label: "Climatisation", href: "/dashboard/hvac", icon: Thermometer, color: "text-red-600" },
            { label: "Gestion espace", href: "/dashboard/space", icon: TrendingUp, color: "text-green-600" },
            { label: "Cours", href: "/dashboard/courses", icon: Clock, color: "text-purple-600" },
            { label: "Énergie", href: "/dashboard/energy", icon: Zap, color: "text-orange-600" },
            { label: "Sécurité", href: "/dashboard/security", icon: ShieldCheck, color: "text-slate-600" },
            { label: "Incidents", href: "/dashboard/incidents", icon: AlertTriangle, color: "text-red-500" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
            >
              <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
              <span className="font-medium truncate">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="lg:col-span-2 h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
