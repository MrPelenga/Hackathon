"use client";

import { useState, useTransition } from "react";
import { updateLightStatus, updateLightMode } from "../_actions";

interface Props {
  id: string;
  status: string;
  mode: string;
  disabled?: boolean;
}

export function LightingControls({ id, status: initialStatus, mode: initialMode, disabled }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [mode, setMode] = useState(initialMode);
  const [isPending, startTransition] = useTransition();

  function toggleStatus() {
    if (status === "FAULT") return;
    const next = status === "ON" ? "OFF" : "ON";
    setStatus(next);
    startTransition(() => updateLightStatus(id, next));
  }

  function toggleMode() {
    const next = mode === "AUTO" ? "MANUAL" : "AUTO";
    setMode(next);
    startTransition(() => updateLightMode(id, next));
  }

  if (disabled) {
    return <span className="text-xs text-muted-foreground italic">Hors ligne</span>;
  }

  if (status === "FAULT") {
    return <span className="text-xs text-red-500 italic">En panne</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleStatus}
        disabled={isPending}
        className={`text-[10px] font-semibold px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
          status === "ON"
            ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
        }`}
      >
        {status === "ON" ? "Éteindre" : "Allumer"}
      </button>
      <button
        onClick={toggleMode}
        disabled={isPending}
        className="text-[10px] px-2 py-1 rounded border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        {mode === "AUTO" ? "→ Manuel" : "→ Auto"}
      </button>
    </div>
  );
}
