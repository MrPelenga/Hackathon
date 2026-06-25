"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "LIGHTING", label: "Éclairage" },
  { value: "HVAC", label: "Climatisation" },
  { value: "BLIND", label: "Volet" },
  { value: "EQUIPMENT", label: "Équipement" },
  { value: "ACCESS", label: "Accès" },
  { value: "PARKING", label: "Parking" },
  { value: "OTHER", label: "Autre" },
];

export function ReportIncidentForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "OTHER", priority: "MEDIUM" });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Incident signalé avec succès.");
        setOpen(false);
        setForm({ title: "", description: "", category: "OTHER", priority: "MEDIUM" });
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(data.error ?? "Erreur lors du signalement.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <Plus className="h-4 w-4" />
        Signaler un incident
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-800">Signaler un incident</h3>
        <button type="button" onClick={() => setOpen(false)} className="ml-auto text-amber-600 hover:text-amber-800 text-sm">
          Annuler
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label className="text-xs text-amber-800">Titre *</Label>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ex : Lumière cassée en A201"
            className="mt-1 bg-white"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-amber-800">Catégorie *</Label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs text-amber-800">Priorité</Label>
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm"
            >
              <option value="LOW">Basse</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Haute</option>
              <option value="CRITICAL">Critique</option>
            </select>
          </div>
        </div>
        <div>
          <Label className="text-xs text-amber-800">Description *</Label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Décrivez le problème en détail…"
            rows={3}
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm resize-none"
            required
          />
        </div>
        <Button type="submit" disabled={loading} size="sm" className="w-full">
          {loading ? "Envoi…" : "Envoyer le signalement"}
        </Button>
      </form>
    </div>
  );
}
