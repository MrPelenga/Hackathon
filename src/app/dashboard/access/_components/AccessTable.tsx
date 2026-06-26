"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Search } from "lucide-react";

export type AccessEventRow = {
  id: string;
  badgeNumber: string;
  holderName: string;
  holderRole: string;
  readerName: string;
  location: string;
  result: string;
  reason: string | null;
  timestamp: string;
  blockIndex: number;
  blockHash: string;
};

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATEUR: "Admin",
  RESPONSABLE_SECURITE: "Sécu.",
  RESPONSABLE_IOT: "IoT",
  RESPONSABLE_ENERGIE: "Énergie",
  AGENT_MAINTENANCE: "Maint.",
  PERSONNEL_TECHNIQUE: "Tech.",
  PERSONNEL_ADMINISTRATIF: "Adm.",
  ENSEIGNANT: "Enseignant",
  AGENT_ENTRETIEN: "Entretien",
  ETUDIANT: "Étudiant",
  PRESTATAIRE: "Presta.",
  VISITEUR: "Visiteur",
  INCONNU: "Inconnu",
};

type Filter = "ALL" | "GRANTED" | "DENIED";
const PER_PAGE = 15;

export function AccessTable({ events }: { events: AccessEventRow[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage]  = useState(0);

  const filtered = events.filter(e => {
    if (filter !== "ALL" && e.result !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.holderName.toLowerCase().includes(q) ||
      e.badgeNumber.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.readerName.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const rows = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const grantedTotal = events.filter(e => e.result === "GRANTED").length;
  const deniedTotal  = events.filter(e => e.result === "DENIED").length;

  function handleFilter(f: Filter) { setFilter(f); setPage(0); }
  function handleSearch(v: string) { setSearch(v); setPage(0); }

  return (
    <div className="space-y-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Badge, nom, lieu…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1">
          {(["ALL", "GRANTED", "DENIED"] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === f
                  ? f === "GRANTED" ? "bg-green-600 text-white"
                  : f === "DENIED"  ? "bg-red-600 text-white"
                  : "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f === "ALL"     ? `Tous (${events.length})`
               : f === "GRANTED" ? `Autorisés (${grantedTotal})`
               : `Refusés (${deniedTotal})`}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {["Horodatage","Badge","Titulaire","Rôle","Lieu","Résultat","Raison","Bloc #"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun événement</td></tr>
            ) : rows.map(e => (
              <tr key={e.id} className={`hover:bg-muted/30 transition-colors ${e.result === "DENIED" ? "bg-red-50/40" : ""}`}>
                <td className="px-3 py-2 text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                  {new Date(e.timestamp).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{e.badgeNumber}</td>
                <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">{e.holderName}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[e.holderRole] ?? e.holderRole}</Badge>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground max-w-[130px] truncate">{e.location}</td>
                <td className="px-3 py-2">
                  {e.result === "GRANTED"
                    ? <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="h-3 w-3" />Autorisé</span>
                    : <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><XCircle className="h-3 w-3" />Refusé</span>
                  }
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {e.reason
                    ? <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />{e.reason.replace(/_/g," ")}</span>
                    : "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">#{e.blockIndex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} événement{filtered.length > 1 ? "s" : ""} · page {page + 1}/{totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted">←</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted">→</button>
          </div>
        </div>
      )}
    </div>
  );
}
