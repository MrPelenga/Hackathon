export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck } from "lucide-react";

export default async function StudentsPage() {
  const user = await requireAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (user.role === "TEACHER") {
    // Show students enrolled in my courses (those with attendance records in my sessions)
    const sessions = await prisma.courseSession.findMany({
      where: { course: { teacherId: user.id } },
      include: {
        course: { select: { code: true, name: true } },
        attendances: {
          include: {
            student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    // Unique students across all sessions
    const studentMap = new Map<string, { firstName: string; lastName: string; email: string; present: number; total: number }>();
    for (const session of sessions) {
      for (const att of session.attendances) {
        const id = att.studentId;
        const existing = studentMap.get(id) ?? {
          firstName: att.student.user.firstName,
          lastName: att.student.user.lastName,
          email: att.student.user.email,
          present: 0,
          total: 0,
        };
        existing.total++;
        if (att.isPresent) existing.present++;
        studentMap.set(id, existing);
      }
    }
    const students = [...studentMap.values()];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Étudiants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Présence dans mes cours</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Étudiants suivis" value={students.length} icon={Users} color="blue" />
          <StatCard title="Sessions analysées" value={sessions.length} icon={UserCheck} />
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Présence par étudiant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.map((s, i) => {
                const rate = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                      <p className="text-[11px] text-muted-foreground">{s.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm tabular-nums">{s.present}/{s.total}</p>
                      <p className={`text-[11px] font-medium ${rate < 60 ? "text-red-600" : rate < 80 ? "text-amber-600" : "text-emerald-600"}`}>
                        {rate}% présence
                      </p>
                    </div>
                  </div>
                );
              })}
              {students.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">Aucune donnée de présence.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ADMIN: all students
  const [students, presentToday] = await Promise.all([
    prisma.student.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true, isActive: true, createdAt: true } },
        dormAssignment: { where: { isActive: true }, select: { room: { select: { name: true } } } },
      },
      orderBy: [{ user: { lastName: "asc" } }],
    }),
    prisma.campusPresence.count({ where: { checkedOutAt: null, checkedInAt: { gte: today } } }),
  ]);

  const byProgram = students.reduce<Record<string, number>>((acc, s) => {
    acc[s.program] = (acc[s.program] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Étudiants & Présence</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{students.length} étudiants inscrits</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard title="Étudiants inscrits" value={students.length} icon={Users} color="blue" />
        <StatCard title="Présents aujourd'hui" value={presentToday} icon={UserCheck}
          color={presentToday > 0 ? "green" : "yellow"} />
        <StatCard title="Programmes" value={Object.keys(byProgram).length} icon={Users} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Répartition par programme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byProgram).sort((a, b) => b[1] - a[1]).map(([prog, count]) => (
              <Badge key={prog} variant="secondary" className="text-xs">
                {prog} · {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Liste des étudiants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {students.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.user.firstName} {s.user.lastName}</p>
                  <p className="text-[11px] text-muted-foreground">{s.user.email}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{s.program} · L{s.year}</span>
                <span className="text-[10px] font-mono text-muted-foreground hidden sm:block shrink-0">{s.studentNumber}</span>
                {s.dormAssignment && (
                  <span className="text-[10px] text-muted-foreground hidden md:block shrink-0">{s.dormAssignment.room.name}</span>
                )}
                {!s.user.isActive && (
                  <Badge variant="destructive" className="text-[10px]">Inactif</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
