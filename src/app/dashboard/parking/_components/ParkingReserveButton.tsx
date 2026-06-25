"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import { toast } from "sonner";

interface Spot { id: string; number: string; type: string }

const typeLabel: Record<string, string> = {
  STANDARD: "Standard", DISABLED: "PMR", ELECTRIC: "Électrique",
};

export function ParkingReserveButton({ spots, lotName }: { spots: Spot[]; lotName: string }) {
  const [open, setOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(spots[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setMinutes(0, 0, 0);
  defaultStart.setHours(now.getHours() + 1);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultStart.getHours() + 2);

  const [startTime, setStartTime] = useState(defaultStart.toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(defaultEnd.toISOString().slice(0, 16));

  async function handleReserve() {
    if (!selectedSpot) return;
    setLoading(true);
    try {
      const res = await fetch("/api/parking/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId: selectedSpot, startTime, endTime }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Place réservée avec succès !");
        setOpen(false);
        setTimeout(() => window.location.reload(), 600);
      } else {
        toast.error(data.error ?? "Erreur lors de la réservation.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => setOpen(true)}>
        <Car className="h-3.5 w-3.5" />
        Réserver une place
      </Button>
    );
  }

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-2.5">
      <p className="text-xs font-medium">{lotName} — Réserver</p>
      <div>
        <label className="text-[11px] text-muted-foreground">Place</label>
        <select
          value={selectedSpot}
          onChange={(e) => setSelectedSpot(e.target.value)}
          className="mt-0.5 w-full rounded border bg-white px-2 py-1.5 text-xs"
        >
          {spots.map((s) => (
            <option key={s.id} value={s.id}>
              N° {s.number} — {typeLabel[s.type] ?? s.type}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-muted-foreground">Début</label>
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
            className="mt-0.5 w-full rounded border bg-white px-2 py-1.5 text-xs" />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Fin</label>
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)}
            className="mt-0.5 w-full rounded border bg-white px-2 py-1.5 text-xs" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 text-xs h-7" disabled={loading} onClick={handleReserve}>
          {loading ? "…" : "Confirmer"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
