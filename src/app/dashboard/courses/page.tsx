export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

async function CoursesOverview() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [courses, todaySessions] = await Promise.all([
    prisma.course.findMany({
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.courseSession.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: {
        course: { select: { code: true, name: true } },
        room: { select: { name: true, capacity: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cours & Emploi du temps</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Sessions du jour et catalogue des cours</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Sessions aujourd&apos;hui ({todaySessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucune session planifiée aujourd&apos;hui.</p>
          ) : (
            <div className="space-y-2">
              {todaySessions.map((s) => (
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
          <CardTitle className="text-base">Catalogue des cours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {courses.map((c) => (
              <div key={c.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{c.code}</p>
                    <p className="text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Prof. {c.teacher.firstName} {c.teacher.lastName} · {c.credits} crédits
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {c._count.sessions} sessions
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CoursesPage() {
  return <CoursesOverview />;
}
