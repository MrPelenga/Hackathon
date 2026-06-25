"use client";

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── Colours ─────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6"];

// ─── ScoreGauge ───────────────────────────────────────────────────────────────
export function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const data = [{ name: "score", value: score, fill: color }, { name: "rest", value: 100 - score, fill: "#f1f5f9" }];
  return (
    <div className="relative flex items-center justify-center my-2">
      <RadialBarChart
        width={140} height={100}
        cx={70} cy={90}
        innerRadius={55} outerRadius={75}
        startAngle={180} endAngle={0}
        data={data}
        barSize={14}
      >
        <RadialBar dataKey="value" cornerRadius={6} />
      </RadialBarChart>
      <div className="absolute bottom-1 flex flex-col items-center">
        <span className="text-3xl font-black" style={{ color }}>{score}</span>
        <span className="text-[10px] text-muted-foreground -mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ─── EnergyEvolutionChart ─────────────────────────────────────────────────────
export function EnergyEvolutionChart({ data }: { data: { label: string; kWh: number; prev: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="egGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" kWh" />
        <Tooltip formatter={(v: number) => [`${v} kWh`, "Consommation"]} />
        <Area type="monotone" dataKey="kWh" stroke="#f59e0b" strokeWidth={2} fill="url(#egGrad)" dot={{ r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── AccessActivityChart ──────────────────────────────────────────────────────
export function AccessActivityChart({ data }: { data: { hour: string; granted: number; denied: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="granted" name="Autorisés" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={20} />
        <Bar dataKey="denied" name="Refusés" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── TemperatureChart ─────────────────────────────────────────────────────────
export function TemperatureChart({ data }: { data: { hour: string; ampere: number; curie: number; darwin: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="°C" domain={["auto", "auto"]} />
        <Tooltip formatter={(v: number) => [`${v}°C`]} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="ampere" name="Ampère" stroke="#f97316" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="curie" name="Curie" stroke="#6366f1" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="darwin" name="Darwin" stroke="#22c55e" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── IoTActivityChart ─────────────────────────────────────────────────────────
export function IoTActivityChart({ data }: { data: { label: string; online: number; offline: number; fault: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="online" name="En ligne" stackId="a" fill="#22c55e" />
        <Bar dataKey="offline" name="Hors ligne" stackId="a" fill="#94a3b8" />
        <Bar dataKey="fault" name="Panne" stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── EquipmentDistributionChart ───────────────────────────────────────────────
export function EquipmentDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false} fontSize={10}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number) => [v, "Équipements"]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── IncidentHistoryChart ─────────────────────────────────────────────────────
export function IncidentHistoryChart({ data }: { data: { label: string; ouverts: number; resolus: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="ouverts" name="Ouverts" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="resolus" name="Résolus" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── AlertDistributionChart ───────────────────────────────────────────────────
export function AlertDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number) => [v, "Incidents"]} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
