import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createHash } from "crypto";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:dev.db" });
const prisma = new PrismaClient({ adapter } as never);

function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function rndInt(min: number, max: number) { return Math.floor(rnd(min, max + 1)); }
function pick<T>(arr: readonly T[]): T { return arr[rndInt(0, arr.length - 1)]; }
function sha256(data: string): string { return createHash("sha256").update(data).digest("hex"); }

// ─── ROLE / LEVEL RULES ───────────────────────────────────────────────────────

const ROLES_FOR_LEVEL: Record<string, string[]> = {
  CRITICAL: ["ADMINISTRATEUR", "RESPONSABLE_SECURITE", "RESPONSABLE_IOT"],
  HIGH: ["ADMINISTRATEUR", "RESPONSABLE_SECURITE", "RESPONSABLE_IOT", "RESPONSABLE_ENERGIE", "AGENT_MAINTENANCE", "PERSONNEL_TECHNIQUE"],
  STANDARD: ["ADMINISTRATEUR", "RESPONSABLE_SECURITE", "RESPONSABLE_IOT", "RESPONSABLE_ENERGIE", "AGENT_MAINTENANCE", "PERSONNEL_TECHNIQUE", "PERSONNEL_ADMINISTRATIF", "ENSEIGNANT"],
  LOW: ["ADMINISTRATEUR", "RESPONSABLE_SECURITE", "RESPONSABLE_IOT", "RESPONSABLE_ENERGIE", "AGENT_MAINTENANCE", "PERSONNEL_TECHNIQUE", "PERSONNEL_ADMINISTRATIF", "ENSEIGNANT", "AGENT_ENTRETIEN", "ETUDIANT", "PRESTATAIRE", "VISITEUR"],
};

async function main() {
  console.log("🌱 Smart Campus — Seed démarré…");

  // ── Buildings ─────────────────────────────────────────────────────────────
  const [ampere, curie, darwin, residence] = await Promise.all([
    prisma.building.create({ data: { name: "Bâtiment Ampère", shortName: "A", address: "1 Allée des Sciences", floorCount: 3, isOpen: true } }),
    prisma.building.create({ data: { name: "Bâtiment Curie", shortName: "C", address: "3 Allée des Sciences", floorCount: 3, isOpen: true } }),
    prisma.building.create({ data: { name: "Bâtiment Darwin", shortName: "D", address: "5 Allée des Sciences", floorCount: 2, isOpen: true } }),
    prisma.building.create({ data: { name: "Résidence Campus", shortName: "R", address: "7 Rue du Campus", floorCount: 4, isOpen: true } }),
  ]);

  // ── Zones ─────────────────────────────────────────────────────────────────
  const [zA0, zA1, zA2, zC0, zC1, zD0, zD1, zR] = await Promise.all([
    prisma.zone.create({ data: { buildingId: ampere.id, name: "Ampère RDC", floor: 0 } }),
    prisma.zone.create({ data: { buildingId: ampere.id, name: "Ampère Étage 1", floor: 1 } }),
    prisma.zone.create({ data: { buildingId: ampere.id, name: "Ampère Étage 2", floor: 2 } }),
    prisma.zone.create({ data: { buildingId: curie.id, name: "Curie RDC", floor: 0 } }),
    prisma.zone.create({ data: { buildingId: curie.id, name: "Curie Étage 1", floor: 1 } }),
    prisma.zone.create({ data: { buildingId: darwin.id, name: "Darwin RDC", floor: 0 } }),
    prisma.zone.create({ data: { buildingId: darwin.id, name: "Darwin Étage 1", floor: 1 } }),
    prisma.zone.create({ data: { buildingId: residence.id, name: "Résidence Hall", floor: 0 } }),
  ]);

  // ── Rooms ─────────────────────────────────────────────────────────────────
  type RoomDef = { buildingId: string; zoneId: string; name: string; type: "CLASSROOM"|"LAB"|"OFFICE"|"CAFETERIA"|"DORM"|"COMMON"|"OTHER"; capacity: number; floor: number };
  const roomDefs: RoomDef[] = [
    { buildingId: ampere.id, zoneId: zA0.id, name: "Ampère A101", type: "CLASSROOM", capacity: 30, floor: 0 },
    { buildingId: ampere.id, zoneId: zA0.id, name: "Ampère A102", type: "CLASSROOM", capacity: 30, floor: 0 },
    { buildingId: ampere.id, zoneId: zA0.id, name: "Ampère Hall", type: "COMMON", capacity: 100, floor: 0 },
    { buildingId: ampere.id, zoneId: zA1.id, name: "Lab Info A201", type: "LAB", capacity: 24, floor: 1 },
    { buildingId: ampere.id, zoneId: zA1.id, name: "Lab Info A202", type: "LAB", capacity: 24, floor: 1 },
    { buildingId: ampere.id, zoneId: zA1.id, name: "Bureau Profs A", type: "OFFICE", capacity: 8, floor: 1 },
    { buildingId: ampere.id, zoneId: zA2.id, name: "Salle Serveurs A301", type: "OTHER", capacity: 2, floor: 2 },
    { buildingId: curie.id, zoneId: zC0.id, name: "Curie C101", type: "CLASSROOM", capacity: 35, floor: 0 },
    { buildingId: curie.id, zoneId: zC0.id, name: "Curie C102", type: "CLASSROOM", capacity: 35, floor: 0 },
    { buildingId: curie.id, zoneId: zC0.id, name: "Curie Hall", type: "COMMON", capacity: 80, floor: 0 },
    { buildingId: curie.id, zoneId: zC1.id, name: "Labo Chimie C201", type: "LAB", capacity: 16, floor: 1 },
    { buildingId: curie.id, zoneId: zC1.id, name: "Labo Physique C202", type: "LAB", capacity: 16, floor: 1 },
    { buildingId: curie.id, zoneId: zC1.id, name: "Stockage C203", type: "OTHER", capacity: 2, floor: 1 },
    { buildingId: darwin.id, zoneId: zD0.id, name: "Bibliothèque D101", type: "COMMON", capacity: 60, floor: 0 },
    { buildingId: darwin.id, zoneId: zD0.id, name: "Darwin D102", type: "CLASSROOM", capacity: 30, floor: 0 },
    { buildingId: darwin.id, zoneId: zD0.id, name: "Cafétéria D103", type: "CAFETERIA", capacity: 120, floor: 0 },
    { buildingId: darwin.id, zoneId: zD1.id, name: "Salle Info D201", type: "LAB", capacity: 20, floor: 1 },
    { buildingId: darwin.id, zoneId: zD1.id, name: "Salle Info D202", type: "LAB", capacity: 20, floor: 1 },
    { buildingId: residence.id, zoneId: zR.id, name: "Salle Commune R", type: "COMMON", capacity: 30, floor: 0 },
    { buildingId: residence.id, zoneId: zR.id, name: "Chambre R101", type: "DORM", capacity: 2, floor: 1 },
  ];
  const rooms = await Promise.all(roomDefs.map(r => prisma.room.create({ data: r })));
  const roomMap: Record<string, typeof rooms[0]> = {};
  rooms.forEach(r => { roomMap[r.name] = r; });

  // ── Equipment (avec consommation en watts) ────────────────────────────────
  console.log("  Création des équipements…");
  const powerW: Record<string, number> = {
    LIGHT: 25, BLIND: 8, PRESENCE_SENSOR: 2, AIR_QUALITY_SENSOR: 3, COMPUTER: 120, DOOR: 5, OTHER: 10,
  };
  for (const room of rooms) {
    const isLab = room.type === "LAB";
    const isOffice = room.type === "OFFICE";
    const isTech = room.type === "OTHER";

    await prisma.equipment.createMany({ data: [
      { roomId: room.id, name: `Lumière — ${room.name}`, type: "LIGHT", status: pick(["ON","ON","ON","OFF"] as const), isOnline: Math.random() > 0.07, powerWatts: 25, lastUpdated: new Date() },
      { roomId: room.id, name: `Capteur présence — ${room.name}`, type: "PRESENCE_SENSOR", status: "ON", isOnline: Math.random() > 0.05, powerWatts: 2, lastUpdated: new Date() },
    ]});

    if (isLab || isOffice) {
      await prisma.equipment.createMany({ data: [
        { roomId: room.id, name: `Volet — ${room.name}`, type: "BLIND", status: pick(["ON","OFF","OFF"] as const), isOnline: Math.random() > 0.10, powerWatts: 8, lastUpdated: new Date() },
        { roomId: room.id, name: `Capteur CO₂ — ${room.name}`, type: "AIR_QUALITY_SENSOR", status: "ON", isOnline: Math.random() > 0.05, powerWatts: 3, lastUpdated: new Date() },
      ]});
    }

    if (isLab) {
      await prisma.equipment.create({ data: { roomId: room.id, name: `Ordinateur — ${room.name}`, type: "COMPUTER", status: pick(["ON","ON","OFF"] as const), isOnline: Math.random() > 0.08, powerWatts: 120, lastUpdated: new Date() } });
    }

    if (isTech) {
      await prisma.equipment.create({ data: { roomId: room.id, name: `Système contrôle — ${room.name}`, type: "OTHER", status: "ON", isOnline: true, powerWatts: 45, lastUpdated: new Date() } });
    }
  }

  // ── 20 Unités HVAC (climatiseurs) ─────────────────────────────────────────
  console.log("  Création des 20 climatiseurs HVAC…");
  type HvacDef = { name: string; zoneId?: string; roomId?: string; set: number; mode: "AUTO"|"ECO"|"MANUAL"|"OFF"; powerW: number };
  const hvacDefs: HvacDef[] = [
    { name: "HVAC Ampère Hall RDC",         zoneId: zA0.id, set: 21, mode: "AUTO",   powerW: 2200 },
    { name: "HVAC Ampère Salles Cours RDC", zoneId: zA0.id, set: 21, mode: "AUTO",   powerW: 3500 },
    { name: "HVAC Ampère Lab Info A201",    roomId: roomMap["Lab Info A201"].id, set: 20, mode: "ECO",    powerW: 1800 },
    { name: "HVAC Ampère Lab Info A202",    roomId: roomMap["Lab Info A202"].id, set: 20, mode: "ECO",    powerW: 1800 },
    { name: "HVAC Ampère Serveurs A301",    roomId: roomMap["Salle Serveurs A301"].id, set: 18, mode: "MANUAL", powerW: 4000 },
    { name: "HVAC Curie Hall RDC",          zoneId: zC0.id, set: 21, mode: "AUTO",   powerW: 2200 },
    { name: "HVAC Curie Salles Cours",      zoneId: zC0.id, set: 21, mode: "AUTO",   powerW: 3000 },
    { name: "HVAC Curie Labo Chimie",       roomId: roomMap["Labo Chimie C201"].id, set: 19, mode: "MANUAL", powerW: 2500 },
    { name: "HVAC Curie Labo Physique",     roomId: roomMap["Labo Physique C202"].id, set: 20, mode: "ECO",    powerW: 2200 },
    { name: "HVAC Curie Étage 1",           zoneId: zC1.id, set: 20, mode: "AUTO",   powerW: 2000 },
    { name: "HVAC Darwin Bibliothèque",     roomId: roomMap["Bibliothèque D101"].id, set: 21, mode: "AUTO",   powerW: 2000 },
    { name: "HVAC Darwin Cafétéria",        roomId: roomMap["Cafétéria D103"].id, set: 22, mode: "AUTO",   powerW: 3500 },
    { name: "HVAC Darwin Info D201",        roomId: roomMap["Salle Info D201"].id, set: 20, mode: "ECO",    powerW: 1800 },
    { name: "HVAC Darwin Info D202",        roomId: roomMap["Salle Info D202"].id, set: 20, mode: "ECO",    powerW: 1800 },
    { name: "HVAC Darwin RDC",              zoneId: zD0.id, set: 21, mode: "AUTO",   powerW: 2200 },
    { name: "HVAC Résidence Hall",          zoneId: zR.id,  set: 20, mode: "AUTO",   powerW: 2000 },
    { name: "HVAC Résidence Aile A",        zoneId: zR.id,  set: 19, mode: "ECO",    powerW: 3500 },
    { name: "HVAC Résidence Aile B",        zoneId: zR.id,  set: 19, mode: "ECO",    powerW: 3500 },
    { name: "HVAC Résidence Aile C",        zoneId: zR.id,  set: 20, mode: "AUTO",   powerW: 3000 },
    { name: "HVAC Salle Commune Résid.",    roomId: roomMap["Salle Commune R"].id, set: 21, mode: "AUTO",   powerW: 1500 },
  ];

  const hvacStatuses = ["HEATING","COOLING","IDLE","IDLE","IDLE","OFF"] as const;
  for (const h of hvacDefs) {
    const isFault = Math.random() < 0.05;
    await prisma.hvacUnit.create({
      data: {
        zoneId: h.zoneId ?? null,
        roomId: h.roomId ?? null,
        name: h.name,
        mode: isFault ? "OFF" : h.mode,
        status: isFault ? "FAULT" : pick(hvacStatuses),
        setTemperature: h.set,
        currentTemperature: parseFloat((h.set + rnd(-2.5, 2.5)).toFixed(1)),
        isOnline: !isFault,
        powerWatts: h.powerW,
        lastUpdated: new Date(),
      },
    });
  }

  // ── Lampadaires extérieurs ────────────────────────────────────────────────
  console.log("  Création des lampadaires…");
  const lightGroups = [
    { prefix: "AMP", buildingId: ampere.id, count: 8 },
    { prefix: "CUR", buildingId: curie.id,  count: 8 },
    { prefix: "DAR", buildingId: darwin.id, count: 6 },
    { prefix: "RES", buildingId: residence.id, count: 6 },
    { prefix: "EXT", buildingId: null,       count: 8 },
  ];
  for (const g of lightGroups) {
    for (let i = 1; i <= g.count; i++) {
      const isFault = Math.random() < 0.08;
      await prisma.streetLight.create({ data: {
        buildingId: g.buildingId,
        identifier: `${g.prefix}-${String(i).padStart(2, "0")}`,
        status: isFault ? "FAULT" : pick(["ON","ON","ON","OFF"] as const),
        mode: pick(["AUTO","AUTO","MANUAL"] as const),
        powerWatts: pick([70, 100, 150] as const),
        isOnline: !isFault && Math.random() > 0.06,
        lastUpdated: new Date(),
      }});
    }
  }

  // ── 20 Lecteurs RFID (portes sécurisées) ─────────────────────────────────
  console.log("  Création des 20 portes RFID sécurisées…");
  type ReaderDef = { name: string; location: string; building: string; zone: string; floor: number; level: "LOW"|"STANDARD"|"HIGH"|"CRITICAL"; offline?: true };
  const readerDefs: ReaderDef[] = [
    { name: "Portail Nord",              location: "Entrée principale Nord",         building: "Extérieur",        zone: "Périmètre",   floor: 0,  level: "LOW" },
    { name: "Portail Sud",               location: "Entrée principale Sud",          building: "Extérieur",        zone: "Périmètre",   floor: 0,  level: "LOW" },
    { name: "Ampère — Hall RDC",         location: "Hall d'entrée Ampère",           building: "Bâtiment Ampère",  zone: "RDC",         floor: 0,  level: "LOW" },
    { name: "Ampère — A101",             location: "Salle de cours A101",            building: "Bâtiment Ampère",  zone: "RDC",         floor: 0,  level: "STANDARD" },
    { name: "Ampère — A102",             location: "Salle de cours A102",            building: "Bâtiment Ampère",  zone: "RDC",         floor: 0,  level: "STANDARD" },
    { name: "Ampère — Lab Info A201",    location: "Laboratoire Informatique A201",  building: "Bâtiment Ampère",  zone: "Étage 1",     floor: 1,  level: "HIGH" },
    { name: "Ampère — Lab Info A202",    location: "Laboratoire Informatique A202",  building: "Bâtiment Ampère",  zone: "Étage 1",     floor: 1,  level: "HIGH" },
    { name: "Ampère — Salle Serveurs",   location: "Salle des serveurs A301",        building: "Bâtiment Ampère",  zone: "Étage 2",     floor: 2,  level: "CRITICAL" },
    { name: "Curie — Hall RDC",          location: "Hall d'entrée Curie",            building: "Bâtiment Curie",   zone: "RDC",         floor: 0,  level: "LOW" },
    { name: "Curie — C101",              location: "Salle de cours C101",            building: "Bâtiment Curie",   zone: "RDC",         floor: 0,  level: "STANDARD" },
    { name: "Curie — Labo Chimie",       location: "Laboratoire Chimie C201",        building: "Bâtiment Curie",   zone: "Étage 1",     floor: 1,  level: "HIGH" },
    { name: "Curie — Labo Physique",     location: "Laboratoire Physique C202",      building: "Bâtiment Curie",   zone: "Étage 1",     floor: 1,  level: "HIGH", offline: true },
    { name: "Curie — Stockage Produits", location: "Stockage produits dangereux",    building: "Bâtiment Curie",   zone: "Étage 1",     floor: 1,  level: "CRITICAL" },
    { name: "Darwin — Hall RDC",         location: "Hall d'entrée Darwin",           building: "Bâtiment Darwin",  zone: "RDC",         floor: 0,  level: "LOW" },
    { name: "Darwin — Bibliothèque",     location: "Bibliothèque universitaire",     building: "Bâtiment Darwin",  zone: "RDC",         floor: 0,  level: "LOW" },
    { name: "Darwin — Salle Info D201",  location: "Salle Informatique D201",        building: "Bâtiment Darwin",  zone: "Étage 1",     floor: 1,  level: "HIGH" },
    { name: "Darwin — Salle Info D202",  location: "Salle Informatique D202",        building: "Bâtiment Darwin",  zone: "Étage 1",     floor: 1,  level: "HIGH" },
    { name: "Résidence — Entrée",        location: "Entrée principale résidence",    building: "Résidence Campus", zone: "RDC",         floor: 0,  level: "LOW" },
    { name: "Résidence — Salle Commune", location: "Salle commune résidence",        building: "Résidence Campus", zone: "RDC",         floor: 0,  level: "LOW" },
    { name: "Service Informatique",      location: "DSI — Support informatique",     building: "Bâtiment Ampère",  zone: "Étage 2",     floor: 2,  level: "HIGH" },
  ];

  const createdReaders: { id: string; name: string; location: string; level: string }[] = [];
  for (const def of readerDefs) {
    const lastSeen = new Date();
    if (def.offline) lastSeen.setHours(lastSeen.getHours() - rndInt(3, 48));
    const r = await prisma.rfidReader.create({ data: {
      name: def.name, location: def.location, building: def.building,
      zone: def.zone, floor: def.floor, securityLevel: def.level,
      isOnline: !def.offline, lastSeen,
      allowedRoles: JSON.stringify(ROLES_FOR_LEVEL[def.level]),
    }});
    createdReaders.push({ id: r.id, name: r.name, location: r.location, level: def.level });
  }
  console.log(`  ${createdReaders.length} portes RFID créées.`);

  // ── Incidents ─────────────────────────────────────────────────────────────
  const now = new Date();
  const incidentDefs = [
    { title: "Lampadaire EXT-03 en panne",               category: "LIGHTING",   priority: "HIGH",     status: "OPEN",        daysAgo: 2 },
    { title: "HVAC Curie Labo Chimie — surchauffe",      category: "HVAC",       priority: "MEDIUM",   status: "IN_PROGRESS", daysAgo: 1 },
    { title: "Salle Serveurs : alerte température",      category: "EQUIPMENT",  priority: "CRITICAL", status: "OPEN",        daysAgo: 0 },
    { title: "Lecteur RFID Curie Labo Physique HS",      category: "ACCESS",     priority: "HIGH",     status: "OPEN",        daysAgo: 3 },
    { title: "Capteur CO₂ A101 — valeur aberrante",      category: "EQUIPMENT",  priority: "MEDIUM",   status: "OPEN",        daysAgo: 5 },
    { title: "Badge inconnu — tentatives répétées",      category: "ACCESS",     priority: "HIGH",     status: "OPEN",        daysAgo: 1 },
    { title: "Volet bloqué Ampère A102",                 category: "BLIND",      priority: "LOW",      status: "RESOLVED",    daysAgo: 8 },
    { title: "Éclairage cafétéria Darwin défaillant",    category: "LIGHTING",   priority: "MEDIUM",   status: "RESOLVED",    daysAgo: 12 },
    { title: "HVAC Résidence Aile A — bruit anormal",    category: "HVAC",       priority: "LOW",      status: "IN_PROGRESS", daysAgo: 4 },
    { title: "Tentative accès Salle Serveurs refusée",   category: "ACCESS",     priority: "CRITICAL", status: "OPEN",        daysAgo: 0 },
  ] as const;
  for (const inc of incidentDefs) {
    const createdAt = new Date(now); createdAt.setDate(createdAt.getDate() - inc.daysAgo);
    await prisma.incident.create({ data: {
      title: inc.title,
      description: "Incident détecté automatiquement par le système de supervision du campus.",
      category: inc.category,
      priority: inc.priority,
      status: inc.status,
      createdAt,
      resolvedAt: inc.status === "RESOLVED" ? new Date(createdAt.getTime() + 48 * 3600_000) : null,
    }});
  }

  // ── Sensor Readings : Énergie + Température (30 jours) ───────────────────
  console.log("  Génération des relevés énergétiques (30 jours)…");
  const buildings = [ampere, curie, darwin, residence];
  const energyRows: { buildingId: string; type: "ENERGY"; value: number; unit: string; timestamp: Date }[] = [];
  const tempRows:   { buildingId: string; type: "TEMPERATURE"; value: number; unit: string; timestamp: Date }[] = [];

  // Base consommation horaire par bâtiment (Wh) — inclut HVAC + éclairage + équipements
  const buildingBaseW: Record<string, { day: number; night: number }> = {
    [ampere.id]:   { day: 3500, night: 450 },  // serveurs + labs
    [curie.id]:    { day: 3000, night: 400 },  // labos chimie/physique
    [darwin.id]:   { day: 2200, night: 300 },  // bibli + cafét
    [residence.id]:{ day: 1200, night: 800 },  // résidence 24h
  };

  for (let dayAgo = 30; dayAgo >= 0; dayAgo--) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() - dayAgo);
    dayDate.setHours(0, 0, 0, 0);
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

    for (const b of buildings) {
      const base = buildingBaseW[b.id];
      for (let h = 0; h < 24; h++) {
        const ts = new Date(dayDate); ts.setHours(h, rndInt(0, 59));
        const isDay = h >= 7 && h <= 20;
        const wkFactor = isWeekend ? 0.4 : 1;
        const baseVal = isDay ? base.day : base.night;
        const noise = rnd(0.85, 1.15);
        energyRows.push({ buildingId: b.id, type: "ENERGY", value: parseFloat((baseVal * wkFactor * noise).toFixed(0)), unit: "Wh", timestamp: ts });
      }

      // Température toutes les 3h
      for (let h = 0; h < 24; h += 3) {
        const ts = new Date(dayDate); ts.setHours(h, rndInt(0, 59));
        const isNight = h < 7 || h > 21;
        const baseTemp = isNight ? rnd(17.5, 19.5) : rnd(19.5, 23.0);
        tempRows.push({ buildingId: b.id, type: "TEMPERATURE", value: parseFloat(baseTemp.toFixed(1)), unit: "°C", timestamp: ts });
      }
    }
  }

  // Insert en batch de 500
  const BATCH = 500;
  for (let i = 0; i < energyRows.length; i += BATCH) {
    await prisma.sensorReading.createMany({ data: energyRows.slice(i, i + BATCH) });
  }
  for (let i = 0; i < tempRows.length; i += BATCH) {
    await prisma.sensorReading.createMany({ data: tempRows.slice(i, i + BATCH) });
  }
  console.log(`  ${energyRows.length} relevés énergie + ${tempRows.length} relevés température insérés.`);

  // ── Porteurs de badges (pool de 40 personnes) ─────────────────────────────
  const badgeHolders = [
    { badge: "BADGE-0001", name: "Sophie Martin",      role: "ADMINISTRATEUR" },
    { badge: "BADGE-0002", name: "Luc Bernard",        role: "ADMINISTRATEUR" },
    { badge: "BADGE-0003", name: "Fatima Benali",      role: "RESPONSABLE_SECURITE" },
    { badge: "BADGE-0004", name: "Marc Dupont",        role: "RESPONSABLE_IOT" },
    { badge: "BADGE-0005", name: "Claire Rousseau",    role: "RESPONSABLE_ENERGIE" },
    { badge: "BADGE-0006", name: "Antoine Moreau",     role: "AGENT_MAINTENANCE" },
    { badge: "BADGE-0007", name: "Sarah Lefebvre",     role: "AGENT_MAINTENANCE" },
    { badge: "BADGE-0008", name: "Karim Mansouri",     role: "AGENT_MAINTENANCE" },
    { badge: "BADGE-0009", name: "Julie Vincent",      role: "PERSONNEL_TECHNIQUE" },
    { badge: "BADGE-0010", name: "Thomas Garcia",      role: "PERSONNEL_TECHNIQUE" },
    { badge: "BADGE-0011", name: "Marie Leclerc",      role: "PERSONNEL_ADMINISTRATIF" },
    { badge: "BADGE-0012", name: "Pierre Blanchard",   role: "PERSONNEL_ADMINISTRATIF" },
    { badge: "BADGE-0013", name: "Emma Durand",        role: "PERSONNEL_ADMINISTRATIF" },
    { badge: "BADGE-0014", name: "Prof. Dubois J.",    role: "ENSEIGNANT" },
    { badge: "BADGE-0015", name: "Prof. Leroy M.",     role: "ENSEIGNANT" },
    { badge: "BADGE-0016", name: "Prof. Garcia C.",    role: "ENSEIGNANT" },
    { badge: "BADGE-0017", name: "Prof. Zhang W.",     role: "ENSEIGNANT" },
    { badge: "BADGE-0018", name: "Nadia Chevalier",    role: "AGENT_ENTRETIEN" },
    { badge: "BADGE-0019", name: "Omar Dridi",         role: "AGENT_ENTRETIEN" },
    { badge: "BADGE-0020", name: "Alex Robert",        role: "PRESTATAIRE" },
    { badge: "BADGE-0021", name: "Iris Fontaine",      role: "VISITEUR" },
    { badge: "BADGE-0022", name: "Alice Morel",        role: "ETUDIANT" },
    { badge: "BADGE-0023", name: "Baptiste Simon",     role: "ETUDIANT" },
    { badge: "BADGE-0024", name: "Camille Laurent",    role: "ETUDIANT" },
    { badge: "BADGE-0025", name: "David Petit",        role: "ETUDIANT" },
    { badge: "BADGE-0026", name: "Emma Garnier",       role: "ETUDIANT" },
    { badge: "BADGE-0027", name: "François Roux",      role: "ETUDIANT" },
    { badge: "BADGE-0028", name: "Gabrielle André",    role: "ETUDIANT" },
    { badge: "BADGE-0029", name: "Hugo Michel",        role: "ETUDIANT" },
    { badge: "BADGE-0030", name: "Inès Faure",         role: "ETUDIANT" },
    { badge: "BADGE-0031", name: "Jules Bonnet",       role: "ETUDIANT" },
    { badge: "BADGE-0032", name: "Kenza Lambert",      role: "ETUDIANT" },
    { badge: "BADGE-0033", name: "Léo Martinez",       role: "ETUDIANT" },
    { badge: "BADGE-0034", name: "Manon Richard",      role: "ETUDIANT" },
    { badge: "BADGE-0035", name: "Nathan Girard",      role: "ETUDIANT" },
    { badge: "BADGE-0036", name: "Océane Legrand",     role: "ETUDIANT" },
    { badge: "BADGE-0037", name: "Paul Fournier",      role: "ETUDIANT" },
    { badge: "BADGE-0038", name: "Rania Bouaziz",      role: "ETUDIANT" },
    // Badge inconnu simulé (ne figure pas dans le pool)
    { badge: "BADGE-UNKN", name: "Inconnu",            role: "ETUDIANT" },
  ];

  // ── ~200 Événements d'accès avec blockchain ───────────────────────────────
  console.log("  Génération des événements d'accès (7 jours)…");

  type RawEvent = {
    badgeNumber: string; holderName: string; holderRole: string;
    readerId: string; readerName: string; location: string;
    result: string; reason: string | null; timestamp: Date;
  };

  const rawEvents: RawEvent[] = [];

  // Pondération horaire (pic 8h-10h, 13h-17h)
  const hourW = [0,0,0,0,0,0, 0.5,1.5,3,2.5, 1.5,1.5,2,2.5,2,1.5, 1.5,2,1.5,0.8, 0.3,0.1,0,0];
  const totalHW = hourW.reduce((s, w) => s + w, 0);

  function pickHour(): number {
    let r = Math.random() * totalHW;
    for (let h = 0; h < 24; h++) { r -= hourW[h]; if (r <= 0) return h; }
    return 8;
  }

  for (let dayAgo = 6; dayAgo >= 0; dayAgo--) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() - dayAgo);
    dayDate.setHours(0, 0, 0, 0);
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
    const count = isWeekend ? rndInt(18, 30) : rndInt(30, 40);

    for (let e = 0; e < count; e++) {
      const holder = pick(badgeHolders);
      const reader = pick(createdReaders);
      const allowed: string[] = ROLES_FOR_LEVEL[reader.level] ?? [];

      const hour = pickHour();
      const ts = new Date(dayDate);
      ts.setHours(hour, rndInt(0, 59), rndInt(0, 59));

      let result = "GRANTED";
      let reason: string | null = null;

      // Badge inconnu → toujours refusé
      if (holder.badge === "BADGE-UNKN") {
        result = "DENIED"; reason = "BADGE_UNKNOWN";
      } else if (!allowed.includes(holder.role)) {
        result = "DENIED"; reason = "ROLE_INSUFFICIENT";
      } else {
        const rand = Math.random();
        if (rand < 0.008)       { result = "DENIED"; reason = "BADGE_DISABLED"; }
        else if (rand < 0.014)  { result = "DENIED"; reason = "BADGE_EXPIRED"; }
        else if (rand < 0.018)  { result = "DENIED"; reason = "ACCESS_FORBIDDEN"; }
        else if ((holder.role === "VISITEUR" || holder.role === "PRESTATAIRE") && (hour < 8 || hour >= 20)) {
          result = "DENIED"; reason = "OUT_OF_HOURS";
        }
      }

      rawEvents.push({
        badgeNumber: holder.badge, holderName: holder.name, holderRole: holder.role,
        readerId: reader.id, readerName: reader.name, location: reader.location,
        result, reason, timestamp: ts,
      });
    }
  }

  // Ajouter quelques événements critiques fixes pour alimenter les alertes
  const serverReader = createdReaders.find(r => r.name === "Ampère — Salle Serveurs")!;
  const extraCritical: RawEvent[] = [
    { badgeNumber: "BADGE-UNKN", holderName: "Inconnu", holderRole: "ETUDIANT", readerId: serverReader.id, readerName: serverReader.name, location: serverReader.location, result: "DENIED", reason: "BADGE_UNKNOWN", timestamp: new Date(now.getTime() - 1 * 3600_000) },
    { badgeNumber: "BADGE-0033", holderName: "Léo Martinez",  holderRole: "ETUDIANT", readerId: serverReader.id, readerName: serverReader.name, location: serverReader.location, result: "DENIED", reason: "ROLE_INSUFFICIENT", timestamp: new Date(now.getTime() - 2 * 3600_000) },
    { badgeNumber: "BADGE-UNKN", holderName: "Inconnu", holderRole: "ETUDIANT", readerId: serverReader.id, readerName: serverReader.name, location: serverReader.location, result: "DENIED", reason: "BADGE_UNKNOWN", timestamp: new Date(now.getTime() - 30 * 60_000) },
    { badgeNumber: "BADGE-0020", holderName: "Alex Robert",   holderRole: "PRESTATAIRE", readerId: serverReader.id, readerName: serverReader.name, location: serverReader.location, result: "DENIED", reason: "ROLE_INSUFFICIENT", timestamp: new Date(now.getTime() - 45 * 60_000) },
  ];
  rawEvents.push(...extraCritical);

  // Trier par timestamp
  rawEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Calcul des hashes blockchain
  const GENESIS = "0000000000000000000000000000000000000000000000000000000000000000";
  let prevHash = GENESIS;
  const finalEvents = rawEvents.map((e, index) => {
    const blockData = JSON.stringify({
      index, prevHash,
      timestamp: e.timestamp.toISOString(),
      badgeNumber: e.badgeNumber,
      holderName: e.holderName,
      holderRole: e.holderRole,
      readerId: e.readerId,
      result: e.result,
      reason: e.reason,
      location: e.location,
    });
    const blockHash = sha256(blockData);
    const event = { ...e, blockIndex: index, blockHash, prevHash, blockData };
    prevHash = blockHash;
    return event;
  });

  // Insert en batch de 50
  for (let i = 0; i < finalEvents.length; i += 50) {
    await prisma.accessEvent.createMany({ data: finalEvents.slice(i, i + 50) });
  }
  const denied = finalEvents.filter(e => e.result === "DENIED").length;
  console.log(`  ${finalEvents.length} événements d'accès créés (${denied} refusés).`);

  // ─── Résumé ────────────────────────────────────────────────────────────────
  console.log("\n✅ Base de données initialisée avec succès!\n");
  console.log("  • 4 bâtiments");
  console.log("  • 8 zones");
  console.log(`  • ${rooms.length} salles`);
  console.log("  • 20 climatiseurs HVAC");
  console.log(`  • ${36} lampadaires`);
  console.log("  • 20 portes sécurisées RFID");
  console.log(`  • ${finalEvents.length} événements d'accès blockchain`);
  console.log(`  • ${energyRows.length} relevés énergétiques (30j)`);
  console.log(`  • ${tempRows.length} relevés température (30j)`);
  console.log("  • 10 incidents campus");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
