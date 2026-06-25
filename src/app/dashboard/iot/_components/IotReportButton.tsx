"use client";

import { FileText } from "lucide-react";

export type Recommendation = {
  priority: "CRITIQUE" | "ÉLEVÉE" | "MOYENNE" | "FAIBLE";
  category: string;
  title: string;
  description: string;
  savings?: string;
};

export type ReportData = {
  generatedAt: string;
  healthScore: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  faultDevices: number;
  hvac: { total: number; active: number; eco: number; fault: number; offline: number; avgSetpoint: number; avgCurrent: number; totalKw: number };
  lights: { total: number; on: number; off: number; fault: number; auto: number; manual: number; totalKw: number };
  rfid: { total: number; online: number; offline: number };
  equipByType: Array<{ type: string; label: string; total: number; online: number; fault: number }>;
  energyTodayKwh: number;
  energyWeekKwh: number;
  hvacDetails: Array<{ name: string; location: string; mode: string; status: string; setTemp: number; currentTemp: number; kw: number | null }>;
  recommendations: Recommendation[];
};

const PRIO_COLORS: Record<string, string> = {
  "CRITIQUE": "#dc2626",
  "ÉLEVÉE":   "#ea580c",
  "MOYENNE":  "#d97706",
  "FAIBLE":   "#2563eb",
};

const PRIO_BG: Record<string, string> = {
  "CRITIQUE": "#fef2f2",
  "ÉLEVÉE":   "#fff7ed",
  "MOYENNE":  "#fffbeb",
  "FAIBLE":   "#eff6ff",
};

function buildHtml(d: ReportData): string {
  const date = new Date(d.generatedAt).toLocaleString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const onlineRate = d.totalDevices > 0 ? Math.round(d.onlineDevices / d.totalDevices * 100) : 0;
  const costPerKwh = 0.18;
  const weekCost   = Math.round(d.energyWeekKwh * costPerKwh);
  const monthEstim = Math.round(weekCost / 7 * 30);

  const recsHtml = d.recommendations.map(r => `
    <div style="margin:6px 0;padding:10px 12px;border-left:4px solid ${PRIO_COLORS[r.priority]};background:${PRIO_BG[r.priority]};border-radius:0 6px 6px 0;page-break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <strong style="font-size:9.5pt;color:#1a1a1a">${r.title}</strong>
        <span style="font-size:8pt;font-weight:700;color:${PRIO_COLORS[r.priority]};background:white;padding:2px 6px;border-radius:4px;border:1px solid ${PRIO_COLORS[r.priority]}">${r.priority}</span>
      </div>
      <p style="font-size:8.5pt;color:#555;margin:0 0 3px">${r.description}</p>
      ${r.savings ? `<p style="font-size:8pt;color:#059669;font-weight:600;margin:0">💰 Économie estimée : ${r.savings}</p>` : ""}
    </div>`).join("");

  const hvacRows = d.hvacDetails.map(u => `
    <tr>
      <td>${u.name}</td>
      <td>${u.location}</td>
      <td>${u.mode}</td>
      <td style="color:${u.status==="FAULT"?"#dc2626":u.status==="HEATING"?"#ea580c":u.status==="COOLING"?"#2563eb":"#64748b"}">${u.status}</td>
      <td style="text-align:center">${u.setTemp.toFixed(1)}°C</td>
      <td style="text-align:center">${u.currentTemp.toFixed(1)}°C</td>
      <td style="text-align:right">${u.kw != null ? u.kw.toFixed(1)+" kW" : "—"}</td>
    </tr>`).join("");

  const equipRows = d.equipByType.map(e => `
    <tr>
      <td>${e.label}</td>
      <td style="text-align:center">${e.total}</td>
      <td style="text-align:center;color:#16a34a">${e.online}</td>
      <td style="text-align:center;color:#94a3b8">${e.total - e.online - e.fault}</td>
      <td style="text-align:center;color:${e.fault>0?"#dc2626":"#64748b"}">${e.fault}</td>
      <td style="text-align:center">${e.total>0?Math.round(e.online/e.total*100):0}%</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport IoT — Smart Campus</title>
<style>
  @page { margin: 18mm; size: A4; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #1a1a1a; line-height: 1.4; }
  h1 { font-size: 17pt; color: #1e3a8a; margin: 0 0 2px; }
  h2 { font-size: 11pt; color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; margin: 18px 0 8px; page-break-after: avoid; }
  h3 { font-size: 9.5pt; color: #374151; margin: 12px 0 5px; }
  p  { margin: 0 0 5px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 8.5pt; }
  th { background: #eff6ff; color: #1e40af; padding: 5px 8px; text-align: left; font-weight: 700; border-bottom: 2px solid #bfdbfe; }
  td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f8fafc; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 8px 0; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; text-align: center; }
  .kpi-val { font-size: 18pt; font-weight: 800; color: #1e40af; }
  .kpi-lbl { font-size: 7.5pt; color: #64748b; margin-top: 1px; }
  .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 8px 0; }
  .cat { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; }
  .cat-title { font-size: 8pt; font-weight: 700; color: #374151; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0; }
  .cat-row { display: flex; justify-content: space-between; font-size: 8pt; padding: 1px 0; }
  .good { color: #16a34a; font-weight: 600; }
  .warn { color: #d97706; font-weight: 600; }
  .bad  { color: #dc2626; font-weight: 600; }
  .muted { color: #94a3b8; }
  .score-bar { height: 8px; border-radius: 4px; background: #e2e8f0; overflow: hidden; margin: 4px 0; }
  .score-fill { height: 100%; border-radius: 4px; }
  .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 7.5pt; color: #94a3b8; text-align: center; }
  .no-break { page-break-inside: avoid; }
  .header-banner { background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%); color: white; padding: 14px 16px; border-radius: 8px; margin-bottom: 16px; }
  .header-sub { font-size: 8pt; opacity: 0.8; margin-top: 3px; }
</style>
</head>
<body>

<!-- Header -->
<div class="header-banner">
  <h1 style="color:white">📊 Rapport IoT — Smart Campus</h1>
  <div class="header-sub">Généré le ${date} · Campus Health Score : <strong>${d.healthScore}/100</strong></div>
</div>

<!-- Score global -->
<div class="no-break">
<h2>Score de santé du campus</h2>
<div style="display:flex;align-items:center;gap:16px;margin:8px 0">
  <div style="font-size:28pt;font-weight:900;color:${d.healthScore>=80?"#16a34a":d.healthScore>=60?"#d97706":"#dc2626"}">${d.healthScore}<span style="font-size:12pt;font-weight:400">/100</span></div>
  <div style="flex:1">
    <div class="score-bar"><div class="score-fill" style="width:${d.healthScore}%;background:${d.healthScore>=80?"#16a34a":d.healthScore>=60?"#d97706":"#dc2626"}"></div></div>
    <p style="font-size:8.5pt;color:#64748b;margin:4px 0">${d.healthScore>=80?"✓ Campus pleinement opérationnel":d.healthScore>=60?"⚠ Attention requise sur certains équipements":"✗ Interventions prioritaires nécessaires"}</p>
  </div>
</div>

<div class="kpi-grid">
  <div class="kpi"><div class="kpi-val">${d.totalDevices}</div><div class="kpi-lbl">Équipements total</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#16a34a">${d.onlineDevices}</div><div class="kpi-lbl">En ligne (${onlineRate}%)</div></div>
  <div class="kpi"><div class="kpi-val" style="color:${d.faultDevices>0?"#dc2626":"#94a3b8"}">${d.faultDevices}</div><div class="kpi-lbl">En panne</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#d97706">${d.offlineDevices}</div><div class="kpi-lbl">Hors ligne</div></div>
</div>
</div>

<!-- Énergie -->
<div class="no-break">
<h2>Consommation énergétique</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-val" style="color:#d97706">${d.energyTodayKwh.toFixed(0)}</div><div class="kpi-lbl">kWh aujourd'hui</div></div>
  <div class="kpi"><div class="kpi-val">${d.energyWeekKwh.toFixed(0)}</div><div class="kpi-lbl">kWh cette semaine</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#16a34a">${weekCost}€</div><div class="kpi-lbl">Coût semaine (${costPerKwh}€/kWh)</div></div>
  <div class="kpi"><div class="kpi-val">${monthEstim}€</div><div class="kpi-lbl">Projection mensuelle</div></div>
</div>
<p style="font-size:8pt;color:#64748b">Consommation instantanée HVAC : <strong>${d.hvac.totalKw.toFixed(1)} kW</strong> · Éclairage extérieur : <strong>${d.lights.totalKw.toFixed(1)} kW</strong></p>
</div>

<!-- Par catégorie -->
<div class="no-break">
<h2>Répartition par catégorie d'équipements</h2>
<div class="cat-grid">
  <div class="cat">
    <div class="cat-title">🌡️ HVAC (${d.hvac.total})</div>
    <div class="cat-row"><span>Actifs</span><span class="good">${d.hvac.active}</span></div>
    <div class="cat-row"><span>Mode Éco</span><span class="${d.hvac.eco>0?"good":"warn"}">${d.hvac.eco}</span></div>
    <div class="cat-row"><span>Pannes</span><span class="${d.hvac.fault>0?"bad":"muted"}">${d.hvac.fault}</span></div>
    <div class="cat-row"><span>Hors ligne</span><span class="muted">${d.hvac.offline}</span></div>
    <div class="cat-row"><span>Consigne moy.</span><span>${d.hvac.avgSetpoint.toFixed(1)}°C</span></div>
    <div class="cat-row"><span>Temp. moy.</span><span>${d.hvac.avgCurrent.toFixed(1)}°C</span></div>
  </div>
  <div class="cat">
    <div class="cat-title">💡 Lampadaires (${d.lights.total})</div>
    <div class="cat-row"><span>Allumés</span><span class="good">${d.lights.on}</span></div>
    <div class="cat-row"><span>Mode Auto</span><span class="${d.lights.auto>=d.lights.total*0.7?"good":"warn"}">${d.lights.auto}</span></div>
    <div class="cat-row"><span>Mode Manuel</span><span class="${d.lights.manual>0?"warn":"muted"}">${d.lights.manual}</span></div>
    <div class="cat-row"><span>Pannes</span><span class="${d.lights.fault>0?"bad":"muted"}">${d.lights.fault}</span></div>
    <div class="cat-row"><span>Puissance</span><span>${d.lights.totalKw.toFixed(1)} kW</span></div>
  </div>
  <div class="cat">
    <div class="cat-title">🔐 Lecteurs RFID (${d.rfid.total})</div>
    <div class="cat-row"><span>En ligne</span><span class="good">${d.rfid.online}</span></div>
    <div class="cat-row"><span>Hors ligne</span><span class="${d.rfid.offline>0?"warn":"muted"}">${d.rfid.offline}</span></div>
    <div class="cat-row"><span>Disponibilité</span><span class="${d.rfid.total>0&&d.rfid.online/d.rfid.total>=0.9?"good":"warn"}">${d.rfid.total>0?Math.round(d.rfid.online/d.rfid.total*100):0}%</span></div>
  </div>
  <div class="cat">
    <div class="cat-title">⚙️ Équipements IoT</div>
    ${d.equipByType.map(e=>`<div class="cat-row"><span>${e.label}</span><span>${e.total} <span class="muted">(${e.total>0?Math.round(e.online/e.total*100):0}%↑)</span></span></div>`).join("")}
  </div>
</div>
</div>

<!-- Recommandations -->
<div class="no-break">
<h2>⚡ Recommandations énergétiques & IoT</h2>
<p style="font-size:8.5pt;color:#64748b;margin-bottom:8px">Analyse basée sur les données temps réel du campus. ${d.recommendations.length} recommandation${d.recommendations.length>1?"s":""} identifiée${d.recommendations.length>1?"s":""}.</p>
${recsHtml.length ? recsHtml : '<p style="color:#64748b;font-style:italic">Aucune recommandation — le campus fonctionne de manière optimale.</p>'}
</div>

<!-- HVAC Details -->
<div class="no-break" style="page-break-before:auto">
<h2>Détail des unités HVAC</h2>
<table>
  <thead><tr>
    <th>Unité</th><th>Localisation</th><th>Mode</th><th>État</th>
    <th style="text-align:center">Consigne</th><th style="text-align:center">Actuelle</th><th style="text-align:right">Puissance</th>
  </tr></thead>
  <tbody>${hvacRows}</tbody>
</table>
</div>

<!-- Equipment Details -->
<div class="no-break">
<h2>Détail par type d'équipement</h2>
<table>
  <thead><tr>
    <th>Type</th><th style="text-align:center">Total</th>
    <th style="text-align:center">En ligne</th><th style="text-align:center">Hors ligne</th>
    <th style="text-align:center">Pannes</th><th style="text-align:center">Dispo.</th>
  </tr></thead>
  <tbody>${equipRows}</tbody>
</table>
</div>

<!-- Footer -->
<div class="footer">
  Smart Campus IoT Report · Généré automatiquement le ${date}<br>
  Ce rapport est basé sur les données collectées par les capteurs du campus. Les estimations financières sont indicatives.
</div>

</body></html>`;
}

export function IotReportButton({ data }: { data: ReportData }) {
  function handleGenerate() {
    const html = buildHtml(data);
    const win  = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Autorisez les popups pour générer le PDF."); return; }
    win.document.write(html);
    win.document.close();
    // Small delay to ensure fonts/styles are loaded
    setTimeout(() => { win.focus(); win.print(); }, 400);
  }

  return (
    <button
      onClick={handleGenerate}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
    >
      <FileText className="h-4 w-4" />
      Générer rapport PDF
    </button>
  );
}
