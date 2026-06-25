"use client";

import { useState, useTransition } from "react";
import { updateHvacMode, updateHvacTemperature } from "../_actions";

const MODES = ["AUTO", "MANUAL", "ECO", "OFF"] as const;
const MODE_LABELS: Record<string, string> = {
  AUTO: "Auto", MANUAL: "Manuel", ECO: "Éco", OFF: "Éteint",
};

interface Props {
  id: string;
  mode: string;
  setTemperature: number;
  disabled?: boolean;
}

export function HvacControls({ id, mode: initialMode, setTemperature: initialTemp, disabled }: Props) {
  const [mode, setMode] = useState(initialMode);
  const [temp, setTemp] = useState(initialTemp);
  const [isPending, startTransition] = useTransition();

  function handleModeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setMode(next);
    startTransition(() => updateHvacMode(id, next));
  }

  function handleTempChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTemp(Number(e.target.value));
  }

  function handleTempBlur() {
    startTransition(() => updateHvacTemperature(id, temp));
  }

  if (disabled) {
    return <span className="text-xs text-muted-foreground italic">Indisponible</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={mode}
        onChange={handleModeChange}
        disabled={isPending}
        className="text-xs border rounded px-1.5 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      >
        {MODES.map(m => (
          <option key={m} value={m}>{MODE_LABELS[m]}</option>
        ))}
      </select>
      <input
        type="number"
        value={temp}
        onChange={handleTempChange}
        onBlur={handleTempBlur}
        disabled={isPending || mode === "OFF"}
        min={15}
        max={30}
        step={0.5}
        className="w-16 text-xs border rounded px-1.5 py-1 text-center bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 tabular-nums"
      />
      <span className="text-xs text-muted-foreground">°C</span>
    </div>
  );
}
