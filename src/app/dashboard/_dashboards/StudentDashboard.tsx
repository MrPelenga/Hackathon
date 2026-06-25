import { CalendarDays, Car, BedDouble, Bell, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";

async function getData(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: { select: { firstName: true, lastName: true } },
      dormAssignment: {
        where: { isActive: true },
        include: { room: { select: { name: true, floor: true, building: { select: { name: true } } } } },
      },
    },
  });

  const [todaySessions, freeSpots, notifications, totalSpots] = await Promise.all([
    prisma.courseSession.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        attendances: { some: { studentId: student?.id ?? "" } },
      },
      include: {
        course: { select: { code: true, name: true } },
        room: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.parkingSpot.count({ where: { status: "FREE" } }),
    prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { title: true, body: true, type: true, createdAt: true },
    }),
    prisma.parkingSpot.count(),
  ]);

  const parkingRate = totalSpots > 0 ? Math.round(((totalSpots - freeSpots) / totalSpots) * 100) : 0;

  return { student, todaySessions, freeSpots, parkingRate, notifications };
}

const typeColor: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-700",
  WARNING: "bg-amber-100 text-amber-700",
  ALERT: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export default async function StudentDashboard({ userId }: { userId: string }) {
  const d = await getData(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour, {d.student?.user.firstName} {d.student?.user.lastName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard title="Cours aujourd'hui" value={d.todaySessions.length} icon={CalendarDays} color="blue" />
        <StatCard title="Places parking libres" value={d.freeSpots}
          icon={Car} color={d.freeSpots < 10 ? "red" : d.freeSpots < 30 ? "yellow" : "green"} />
        <StatCard title="Notifs non lues" value={d.notifications.length} icon={Bell}
          color={d.notifications.length > 0 ? "yellow" : "green"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Mon emploi du temps aujourd&apos;hui
          </CardTitle>
        </CardHeader>
        <CardContent>
          {d.todaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucune session aujourd&apos;hui.</p>
          ) : (
            <div className="space-y-2">
              {d.todaySessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                  <div className="w-16 text-center shrink-0">
                    <p className="text-sm font-bold tabular-nums">{s.startTime}</p>
                    <p className="text-[10px] text-muted-foreground">{s.endTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.course.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.room.name}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{s.course.code}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              Ma chambre
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.student?.dormAssignment ? (
              <div className="space-y-1">
                <p className="font-medium">{d.student.dormAssignment.room.name}</p>
                <p className="text-sm text-muted-foreground">
                  {d.student.dormAssignment.room.building.name} · Étage {d.student.dormAssignment.room.floor}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Depuis le {new Date(d.student.dormAssignment.startDate).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Aucune chambre attribuée.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">Aucune notification.</p>
            ) : (
              <div className="space-y-2">
                {d.notifications.map((n, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${typeColor[n.type] ?? "bg-slate-100 text-slate-600"}`}>
                      {n.type}
                    </span>
                    <p className="text-xs">{n.title}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Accès rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Mon emploi du temps", href: "/dashboard/courses" },
            { label: "Réserver un parking", href: "/dashboard/parking" },
            { label: "Affluence resto U", href: "/dashboard/affluence" },
            { label: "Signaler un incident", href: "/dashboard/incidents" },
          ].map((item) => (
            <a key={item.href} href={item.href} className="rounded-lg border p-3 text-sm font-medium hover:bg-muted transition-colors text-center">
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
