"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyIntegrity, type IntegrityResult } from "../_integrity-actions";
import { simulateBadge, type SimulationResult } from "../_demo-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Loader2, CheckCircle2, ShieldAlert, ExternalLink, Scan, XCircle,
} from "lucide-react";

export function IntegrityVerifier() {
  const router = useRouter();
  const [busy, setBusy] = useState<"grant" | "deny" | "verify" | null>(null);
  const [, start] = useTransition();
  const [sim, setSim] = useState<SimulationResult | null>(null);
  const [result, setResult] = useState<IntegrityResult | null>(null);

  function simulate(granted: boolean) {
    setBusy(granted ? "grant" : "deny");
    setResult(null);
    start(async () => {
      try {
        const r = await simulateBadge(granted);
        setSim(r);
        router.refresh();
      } finally {
        setBusy(null);
      }
    });
  }

  function verify() {
    setBusy("verify");
    start(async () => {
      try {
        setResult(await verifyIntegrity());
      } finally {
        setBusy(null);
      }
    });
  }

  return (
    <Card className="border-emerald-200 bg-emerald-50/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Démo blockchain — passage &amp; intégrité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Step 1 — simulate a badge scan */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
            <Scan className="h-3 w-3" /> 1. Simuler un passage de badge
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => simulate(true)}
              disabled={busy !== null}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 disabled:opacity-60 transition-all"
            >
              {busy === "grant" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Badge validé
            </button>
            <button
              onClick={() => simulate(false)}
              disabled={busy !== null}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-md hover:bg-red-100 disabled:opacity-60 transition-all"
            >
              {busy === "deny" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Badge refusé
            </button>
          </div>

          {sim && (
            <div className="rounded-md border bg-background p-2.5 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <Badge className={`text-[10px] ${sim.result === "GRANTED" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"} hover:bg-transparent`}>
                  Bloc #{sim.blockIndex}
                </Badge>
                <span>{sim.holderName} · {sim.result === "GRANTED" ? "Validé" : "Refusé"}</span>
              </div>
              <p className="text-muted-foreground">{sim.location}</p>
              <a href={sim.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-violet-700 hover:underline">
                <ExternalLink className="h-3 w-3" /> Ancré sur XRPL — voir la preuve
              </a>
            </div>
          )}
        </div>

        {/* Step 2 — verify integrity + history */}
        <div className="border-t pt-3 space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> 2. Vérifier l&apos;intégrité du journal
          </p>
          <button
            onClick={verify}
            disabled={busy !== null}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-md hover:bg-emerald-700 disabled:opacity-60 transition-all"
          >
            {busy === "verify" ? <><Loader2 className="h-4 w-4 animate-spin" />Vérification…</> : <><ShieldCheck className="h-4 w-4" />Vérifier l&apos;intégrité</>}
          </button>

          {result && (
            <div className="space-y-2">
              <div className={`rounded-md border p-2.5 flex items-center gap-2 text-sm font-semibold ${result.valid ? "border-emerald-200 bg-emerald-50/60 text-emerald-700" : "border-red-200 bg-red-50/60 text-red-700"}`}>
                {result.valid ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                {result.valid ? `Journal intègre — ${result.count} blocs` : `Altération au bloc #${result.broken?.blockIndex}`}
              </div>

              {/* Verified history */}
              <div className="rounded-md border divide-y max-h-56 overflow-y-auto">
                <p className="px-2.5 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground bg-muted/40">
                  Historique vérifié (12 derniers blocs)
                </p>
                {result.history.map((b) => (
                  <div key={b.blockIndex} className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="font-mono text-muted-foreground shrink-0">#{b.blockIndex}</span>
                    <span className="font-medium truncate flex-1">{b.holderName}</span>
                    <span className={`text-[10px] shrink-0 ${b.result === "GRANTED" ? "text-emerald-600" : "text-red-600"}`}>
                      {b.result === "GRANTED" ? "Validé" : "Refusé"}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground hidden sm:inline shrink-0">{b.hashShort}…</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
