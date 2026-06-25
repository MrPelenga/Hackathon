import { CalendarDays, Users, BookOpen, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";

async function getData(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const teacher = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  const [todaySessions, myCourses, myIncidents] = await Promise.all([
    prisma.courseSession.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        course: { teacherId: userId },
      },
      include: {
        course: { select: { code: true, name: true } },
        room: { select: { name: true, capacity: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.course.findMany({
      where: { teacherId: userId },
      include: { _count: { select: { sessions: true } } },
    }),
    prisma.incident.findMany({
      where: { reportedById: userId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { room: { select: { name: true } } },
    }),
  ]);

  return { teacher, todaySessions, myCourses, myIncidents };
}

const statusColor: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
};
const statusLabel: Record<string, string> = { OPEN: "Ouvert", IN_PROGRESS: "En cours" };

export default async function TeacherDashboard({ userId }: { userId: string }) {
  const d = await getData(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour, {d.teacher?.firstName} {d.teacher?.lastName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard title="Cours aujourd'hui" value={d.todaySessions.length} icon={CalendarDays} color="blue" />
        <StatCard title="Mes cours" value={d.myCourses.length} icon={BookOpen} />
        <StatCard title="Incidents signalés" value={d.myIncidents.length} icon={AlertTriangle}
          color={d.myIncidents.length > 0 ? "yellow" : "green"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Mes sessions aujourd&apos;hui
          </CardTitle>
        </CardHeader>
        <CardContent>
          {d.todaySessions.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <p className="text-sm">Aucune session planifiée aujourd&apos;hui.</p>
            </div>
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
                  <span className="text-xs text-muted-foreground shrink-0">
                    {s._count.attendances}/{s.room.capacity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Mes cours ({d.myCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {d.myCourses.map((c) => (
              <div key={c.id} className="rounded-md border p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{c.code}</p>
                  <p className="text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c._count.sessions} sessions planifiées</p>
                </div>
                <a href="/dashboard/courses" className="text-[11px] text-primary hover:underline shrink-0">
                  Voir →
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {d.myIncidents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Mes incidents signalés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.myIncidents.map((inc) => (
              <div key={inc.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[inc.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {statusLabel[inc.status] ?? inc.status}
                </span>
                <p className="text-sm flex-1 truncate">{inc.title}</p>
                {inc.room && <span className="text-xs text-muted-foreground shrink-0">{inc.room.name}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Accès rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Mes cours", href: "/dashboard/courses" },
            { label: "Réserver une salle", href: "/dashboard/reservations" },
            { label: "Signaler un incident", href: "/dashboard/incidents" },
            { label: "Affluence resto U", href: "/dashboard/affluence" },
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
