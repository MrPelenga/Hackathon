"use client";

import { useState, useTransition } from "react";
import { recordAccessSummaryToXrpl } from "../_actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, CheckCircle2, AlertTriangle, ExternalLink, Link2 } from "lucide-react";

type Result = Awaited<ReturnType<typeof recordAccessSummaryToXrpl>>;

export function XrplRecorder({
  totalEvents, granted, denied,
}: {
  totalEvents: number; granted: number; denied: number;
}) {
  const [isPending, start] = useTransition();
  const [result, setResult]   = useState<Result | null>(null);
  const [error,  setError]    = useState<string | null>(null);

  function handleRecord() {
    setError(null);
    setResult(null);
    start(async () => {
      try {
        setResult(await recordAccessSummaryToXrpl());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  }

  return (
    <Card className="border-violet-200 bg-violet-50/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Link2 className="h-4 w-4 text-violet-600" />
          Ancrage XRP Ledger — Testnet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Enregistrez un résumé cryptographique du journal d'accès sur le <strong>XRP Ledger Testnet</strong> pour créer une preuve d'intégrité immuable, horodatée et vérifiable publiquement.
        </p>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-background rounded-lg border px-2 py-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Total</p>
            <p className="text-xl font-bold tabular-nums">{totalEvents}</p>
          </div>
          <div className="bg-background rounded-lg border px-2 py-2">
            <p className="text-[10px] text-green-600 font-medium mb-0.5">Autorisés</p>
            <p className="text-xl font-bold tabular-nums text-green-600">{granted}</p>
          </div>
          <div className="bg-background rounded-lg border px-2 py-2">
            <p className="text-[10px] text-red-600 font-medium mb-0.5">Refusés</p>
            <p className="text-xl font-bold tabular-nums text-red-600">{denied}</p>
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground bg-muted/50 rounded-md px-3 py-2 space-y-0.5">
          <p>✓ Données enregistrées en tant que <em>Memo</em> dans une transaction XRPL</p>
          <p>✓ Résumé du cumul + journée en cours + pointeur de chaîne locale</p>
          <p>✓ Vérifiable publiquement via l'explorateur Testnet</p>
        </div>

        <button
          onClick={handleRecord}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-md hover:bg-violet-700 active:scale-[0.98] disabled:opacity-60 transition-all"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Connexion au Testnet XRP…</>
          ) : (
            <><Shield className="h-4 w-4" />Enregistrer sur XRP Ledger</>
          )}
        </button>

        {isPending && (
          <div className="space-y-1 text-center">
            <p className="text-xs text-muted-foreground animate-pulse">Génération du wallet · Signature · Soumission au ledger…</p>
            <p className="text-[10px] text-muted-foreground">Durée estimée : 15-30 secondes</p>
          </div>
        )}

        {result?.success && (
          <div className="rounded-lg border border-green-200 bg-green-50/60 p-3 space-y-2.5">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Transaction confirmée sur XRP Testnet
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground shrink-0">TX Hash</span>
                <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer"
                   className="font-mono text-violet-700 hover:underline flex items-center gap-1 break-all text-right">
                  {result.txHash.slice(0, 20)}…
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Wallet émetteur</span>
                <span className="font-mono text-muted-foreground">{result.wallet.slice(0, 14)}…</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Ancré le</span>
                <span>{new Date().toLocaleString("fr-FR")}</span>
              </div>
            </div>
            <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
              Immuable · XRP Ledger Testnet
            </Badge>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-700">Erreur de connexion au Testnet</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
