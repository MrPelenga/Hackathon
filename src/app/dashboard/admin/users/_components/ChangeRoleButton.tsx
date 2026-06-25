"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Étudiant",
  TEACHER: "Enseignant",
  MAINTENANCE: "Maintenance",
  ADMIN: "Admin",
};

export function ChangeRoleButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  async function save() {
    if (role === currentRole) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Rôle mis à jour.");
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(data.error ?? "Erreur.");
        setRole(currentRole);
      }
    } catch {
      toast.error("Erreur réseau.");
      setRole(currentRole);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="rounded border px-2 py-1 text-xs bg-background"
      >
        {Object.entries(ROLE_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      {role !== currentRole && (
        <Button size="sm" className="h-7 text-xs px-2" disabled={loading} onClick={save}>
          {loading ? "…" : "Sauv."}
        </Button>
      )}
    </div>
  );
}
