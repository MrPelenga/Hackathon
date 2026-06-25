export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { ShieldCheck, ShieldAlert, LogIn, LogOut } from "lucide-react";

async function SecurityOverview() {
  const logs = await prisma.accessLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 50,
    include: { user: { select: { firstName: true, lastName: true, role: true } } },
  });

  const entries = logs.filter((l) => l.action === "ENTRY").length;
  const exits = logs.filter((l) => l.action === "EXIT").length;
  const denied = logs.filter((l) => l.action === "DENIED" || !l.isSuccess).length;

  const actionLabel: Record<string, string> = { ENTRY: "Entrée", EXIT: "Sortie", DENIED: "Refusé" };
  const actionColor: Record<string, string> = {
    ENTRY: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    EXIT: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    DENIED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sécurité & Contrôle d&apos;accès</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Journal d&apos;accès horodaté — lecture seule, append-only, infalsifiable
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Axe Cybersécurité</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Le journal d&apos;accès est en mode append-only : aucune ligne ne peut être modifiée ou supprimée.
              Chaque accès est horodaté côté serveur. Les tentatives d&apos;accès refusées sont systématiquement enregistrées.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard title="Entrées" value={entries} icon={LogIn} color="green" />
        <StatCard title="Sorties" value={exits} icon={LogOut} color="blue" />
        <StatCard title="Accès refusés" value={denied} icon={ShieldAlert} color={denied > 0 ? "red" : "green"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Journal d&apos;accès
            <span className="text-[10px] font-normal text-muted-foreground">(50 entrées récentes)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                  !log.isSuccess || log.action === "DENIED"
                    ? actionColor.DENIED
                    : actionColor[log.action]
                }`}>
                  {!log.isSuccess ? "Refusé" : actionLabel[log.action]}
                </span>
                <span className="font-medium">
                  {log.user.firstName} {log.user.lastName}
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {log.user.role}
                </span>
                <span className="flex-1 text-xs text-muted-foreground truncate">{log.location}</span>
                {log.badgeId && (
                  <span className="text-[10px] text-muted-foreground font-mono hidden sm:block">{log.badgeId}</span>
                )}
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SecurityPage() {
  return <SecurityOverview />;
}
