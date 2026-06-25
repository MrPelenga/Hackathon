"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "RESOLVED", label: "Résolu" },
  { value: "CLOSED", label: "Fermé" },
];

export function UpdateStatusButton({ incidentId, currentStatus }: { incidentId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  async function update(status: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Statut mis à jour : ${status}`);
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(data.error ?? "Erreur.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  const next = STATUS_OPTIONS.find((s) => s.value !== currentStatus);
  if (!next || currentStatus === "CLOSED") return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-[11px] h-7 px-2"
      disabled={loading}
      onClick={() => update(next.value)}
    >
      {loading ? "…" : `→ ${next.label}`}
    </Button>
  );
}
