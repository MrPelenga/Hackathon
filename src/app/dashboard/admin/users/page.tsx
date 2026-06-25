export const dynamic = "force-dynamic";
import { requireRole } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Users, UserCog, ShieldCheck } from "lucide-react";
import { ChangeRoleButton } from "./_components/ChangeRoleButton";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", TEACHER: "Enseignant", STUDENT: "Étudiant", MAINTENANCE: "Maintenance",
};
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  TEACHER: "bg-blue-100 text-blue-700",
  STUDENT: "bg-green-100 text-green-700",
  MAINTENANCE: "bg-orange-100 text-orange-700",
};

export default async function AdminUsersPage() {
  const me = await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    include: { student: { select: { studentNumber: true, program: true } } },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });

  const byRole = {
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    TEACHER: users.filter((u) => u.role === "TEACHER").length,
    STUDENT: users.filter((u) => u.role === "STUDENT").length,
    MAINTENANCE: users.filter((u) => u.role === "MAINTENANCE").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {users.length} comptes · Seul un administrateur peut modifier les rôles
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            La modification du rôle d&apos;un utilisateur prend effet immédiatement. Son prochain accès respectera les droits du nouveau rôle.
            Vous ne pouvez pas modifier votre propre rôle.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Admins" value={byRole.ADMIN} icon={UserCog} color="red" />
        <StatCard title="Enseignants" value={byRole.TEACHER} icon={Users} color="blue" />
        <StatCard title="Étudiants" value={byRole.STUDENT} icon={Users} color="green" />
        <StatCard title="Maintenance" value={byRole.MAINTENANCE} icon={UserCog} color="yellow" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tous les comptes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                    {!u.isActive && <Badge variant="destructive" className="text-[10px]">Inactif</Badge>}
                    {u.id === me.id && <span className="text-[10px] text-muted-foreground">(vous)</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                  {u.student && (
                    <p className="text-[10px] text-muted-foreground">
                      {u.student.studentNumber} · {u.student.program}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {u.id === me.id ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ROLE_COLORS[u.role] ?? "bg-muted text-muted-foreground"}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  ) : (
                    <ChangeRoleButton userId={u.id} currentRole={u.role} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
