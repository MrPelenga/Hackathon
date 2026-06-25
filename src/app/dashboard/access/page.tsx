import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Wifi, WifiOff, Users, KeyRound, Hash } from "lucide-react";
import { AccessTable, type AccessEventRow } from "./_components/AccessTable";
import { XrplRecorder } from "./_components/XrplRecorder";

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATEUR: "Administrateur",
  RESPONSABLE_SECURITE: "Resp. Sécurité",
  RESPONSABLE_IOT: "Resp. IoT",
  RESPONSABLE_ENERGIE: "Resp. Énergie",
  AGENT_MAINTENANCE: "Agent Maintenance",
  PERSONNEL_TECHNIQUE: "Pers. Technique",
  PERSONNEL_ADMINISTRATIF: "Pers. Adm.",
  ENSEIGNANT: "Enseignant",
  AGENT_ENTRETIEN: "Entretien",
  ETUDIANT: "Étudiant",
  PRESTATAIRE: "Prestataire",
  VISITEUR: "Visiteur",
};

const LEVEL_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  STANDARD: "bg-blue-100 text-blue-700 border-blue-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function AccessPage() {
  const [rawEvents, readers] = await Promise.all([
    prisma.accessEvent.findMany({
      orderBy: { timestamp: "desc" },
      take: 500,
      select: {
        id: true, badgeNumber: true, holderName: true, holderRole: true,
        readerName: true, location: true, result: true, reason: true,
        timestamp: true, blockIndex: true, blockHash: true,
      },
    }),
    prisma.rfidReader.findMany({ orderBy: { building: "asc" } }),
  ]);

  // Serialize dates for client components
  const events: AccessEventRow[] = rawEvents.map(e => ({
    ...e,
    timestamp: e.timestamp.toISOString(),
  }));

  const granted = events.filter(e => e.result === "GRANTED").length;
  const denied  = events.filter(e => e.result === "DENIED").length;
  const unknown = events.filter(e => e.reason === "BADGE_UNKNOWN").length;

  // Build unique badge holders from event history
  const badgeMap = new Map<string, {
    holderName: string; holderRole: string;
    grantedCount: number; deniedCount: number; lastSeen: string;
  }>();
  for (const e of events) {
    const cur = badgeMap.get(e.badgeNumber);
    if (!cur) {
      badgeMap.set(e.badgeNumber, {
        holderName: e.holderName, holderRole: e.holderRole,
        grantedCount: e.result === "GRANTED" ? 1 : 0,
        deniedCount:  e.result === "DENIED"  ? 1 : 0,
        lastSeen: e.timestamp,
      });
    } else {
      if (e.result === "GRANTED") cur.grantedCount++;
      else cur.deniedCount++;
    }
  }
  const badges = Array.from(badgeMap.entries())
    .map(([num, d]) => ({ badgeNumber: num, ...d }))
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

  const onlineReaders = readers.filter(r => r.isOnline).length;
  const lastBlock     = rawEvents[rawEvents.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contrôle d'accès</h1>
        <p className="text-sm text-muted-foreground">
          Supervision RFID · Journal d'accès · Ancrage XRP Ledger
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Lecteurs RFID</p>
                <p className="text-2xl font-bold">{readers.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50"><KeyRound className="h-4 w-4 text-blue-600" /></div>
            </div>
            <p className="text-xs mt-2">
              <span className="text-green-600 font-semibold">{onlineReaders} en ligne</span>
              <span className="text-muted-foreground"> · {readers.length - onlineReaders} hors ligne</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Badges connus</p>
                <p className="text-2xl font-bold">{badges.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50"><Users className="h-4 w-4 text-purple-600" /></div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">{events.length} événements enregistrés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Accès autorisés</p>
                <p className="text-2xl font-bold text-green-600">{granted}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50"><ShieldCheck className="h-4 w-4 text-green-600" /></div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">
              {events.length > 0 ? Math.round(granted / events.length * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Accès refusés</p>
                <p className="text-2xl font-bold text-red-600">{denied}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-50"><ShieldAlert className="h-4 w-4 text-red-600" /></div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">
              {unknown} badge{unknown > 1 ? "s" : ""} inconnu{unknown > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">

          {/* RFID Readers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-blue-500" />
                Lecteurs RFID ({readers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {readers.map(r => (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.location}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge className={`text-[10px] border ${LEVEL_COLORS[r.securityLevel] ?? "bg-muted"}`}>
                      {r.securityLevel}
                    </Badge>
                    {r.isOnline
                      ? <Wifi className="h-3 w-3 text-green-500" />
                      : <WifiOff className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Badge holders */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                Badges actifs ({badges.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {badges.map(b => (
                <div key={b.badgeNumber} className="flex items-center justify-between py-1.5 border-b last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{b.holderName}</p>
                    <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[b.holderRole] ?? b.holderRole}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono text-[10px] text-muted-foreground">{b.badgeNumber}</span>
                    {b.deniedCount > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">{b.deniedCount}✗</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Blockchain integrity */}
          {lastBlock && (
            <Card className="border-slate-200 bg-slate-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-500" />
                  Intégrité de la chaîne locale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Longueur</span>
                  <span className="font-mono font-semibold">{lastBlock.blockIndex + 1} blocs</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Dernier hash</span>
                  <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">{lastBlock.blockHash.slice(0, 16)}…</span>
                </div>
                <Badge className="text-[10px] bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">
                  Chaîne append-only vérifiée
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* XRPL Recorder */}
          <XrplRecorder totalEvents={events.length} granted={granted} denied={denied} />
        </div>

        {/* Right: event log */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Journal des accès — {events.length} événements (derniers 500)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AccessTable events={events} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
