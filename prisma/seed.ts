import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:dev.db" });
const prisma = new PrismaClient({ adapter } as never);

function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function rndInt(min: number, max: number) { return Math.floor(rnd(min, max + 1)); }
function pick<T>(arr: readonly T[]): T { return arr[rndInt(0, arr.length - 1)]; }
function sha256(data: string): string { return createHash("sha256").update(data).digest("hex"); }
const hash = (p: string) => bcrypt.hashSync(p, 10);

// ─── BADGE ROLE RULES ─────────────────────────────────────────────────────────

const ROLES_FOR_LEVEL: Record<string, string[]> = {
  CRITICAL: ["ADMINISTRATEUR", "RESPONSABLE_SECURITE", "RESPONSABLE_IOT"],
  HIGH: ["ADMINISTRATEUR", "RESPONSABLE_SECURITE", "RESPONSABLE_IOT", "RESPONSABLE_ENERGIE", "AGENT_MAINTENANCE", "PERSONNEL_TECHNIQUE"],
  STANDARD: ["ADMINISTRATEUR", "RESPONSABLE_SECURITE", "RESPONSABLE_IOT", "RESPONSABLE_ENERGIE", "AGENT_MAINTENANCE", "PERSONNEL_TECHNIQUE", "PERSONNEL_ADMINISTRATIF", "ENSEIGNANT", "AGENT_ENTRETIEN", "ETUDIANT"],
  LOW: ["ADMINISTRATEUR", "RESPONSABLE_SECURITE", "RESPONSABLE_IOT", "RESPONSABLE_ENERGIE", "AGENT_MAINTENANCE", "PERSONNEL_TECHNIQUE", "PERSONNEL_ADMINISTRATIF", "ENSEIGNANT", "AGENT_ENTRETIEN", "ETUDIANT", "PRESTATAIRE", "VISITEUR"],
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Smart Campus v2 — Seeding database…");

  // ── Users ──────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { email: "admin@campus.fr", passwordHash: hash("Admin1234!"), firstName: "Sophie", lastName: "Martin", role: "ADMIN" },
  });

  const teacherData = [
    { email: "prof.dubois@campus.fr", firstName: "Jean", lastName: "Dubois" },
    { email: "prof.leroy@campus.fr", firstName: "Marie", lastName: "Leroy" },
    { email: "prof.garcia@campus.fr", firstName: "Carlos", lastName: "Garcia" },
    { email: "prof.zhang@campus.fr", firstName: "Wei", lastName: "Zhang" },
    { email: "prof.petit@campus.fr", firstName: "Claire", lastName: "Petit" },
  ];
  const teachers = await Promise.all(teacherData.map(t =>
    prisma.user.create({ data: { ...t, passwordHash: hash("Prof1234!"), role: "TEACHER" } })
  ));

  const maint1 = await prisma.user.create({ data: { email: "tech1@campus.fr", passwordHash: hash("Tech1234!"), firstName: "Luc", lastName: "Dupont", role: "MAINTENANCE" } });
  const maint2 = await prisma.user.create({ data: { email: "tech2@campus.fr", passwordHash: hash("Tech1234!"), firstName: "Fatima", lastName: "Benali", role: "MAINTENANCE" } });

  const firstNames = ["Alice","Baptiste","Camille","David","Emma","François","Gabrielle","Hugo","Inès","Jules","Kenza","Léo","Manon","Nathan","Océane","Paul","Quentin","Rania","Samuel","Théa","Ugo","Valentin","Wendy","Xavier","Yasmine","Zoé","Adam","Bilal","Chloé","Damien","Elsa","Félix","Gaëlle","Hamid","Iris","Jordan","Karim","Luna","Maxime","Nadia","Omar","Pénélope","Rémi","Sara","Thomas","Ursula","Victor","Wafa","Yann","Zohra"];
  const lastNames = ["Moreau","Bernard","Thomas","Petit","Robert","Richard","Durand","Lefevre","Simon","Laurent","Michel","Garcia","David","Bertrand","Roux","Vincent","Fournier","Morin","Girard","Andre","Lecomte","Blanc","Guerin","Boyer","Garnier","Chevalier","Francois","Legrand","Gauthier","Rousseau"];
  const programs = ["Informatique","Mathématiques","Physique","Génie Civil","Économie","Chimie"];

  const studentUsers: typeof admin[] = [];
  for (let i = 0; i < 50; i++) {
    const u = await prisma.user.create({
      data: { email: `etudiant${i + 1}@campus.fr`, passwordHash: hash("Etudiant123!"), firstName: firstNames[i % firstNames.length], lastName: lastNames[i % lastNames.length], role: "STUDENT" },
    });
    studentUsers.push(u);
    await prisma.student.create({ data: { userId: u.id, studentNumber: `STU${String(2024001 + i).padStart(7, "0")}`, year: rndInt(1, 3), program: pick(programs) } });
  }

  // ── Buildings ─────────────────────────────────────────────────────────────
  const ampere = await prisma.building.create({
    data: { name: "Bâtiment Ampère", shortName: "A", address: "1 Allée des Sciences", floorCount: 3, isOpen: true, latitude: 48.852, longitude: 2.345 },
  });
  const curie = await prisma.building.create({
    data: { name: "Bâtiment Curie", shortName: "C", address: "3 Allée des Sciences", floorCount: 3, isOpen: true, latitude: 48.853, longitude: 2.347 },
  });
  const darwin = await prisma.building.create({
    data: { name: "Bâtiment Darwin", shortName: "D", address: "5 Allée des Sciences", floorCount: 2, isOpen: true, latitude: 48.851, longitude: 2.348 },
  });
  const residence = await prisma.building.create({
    data: { name: "Résidence Campus", shortName: "R", address: "7 Rue du Campus", floorCount: 4, isOpen: true, latitude: 48.850, longitude: 2.343 },
  });

  // ── Zones & Rooms ─────────────────────────────────────────────────────────
  const zoneAmpRDC = await prisma.zone.create({ data: { buildingId: ampere.id, name: "Ampère RDC", floor: 0 } });
  const zoneAmp1 = await prisma.zone.create({ data: { buildingId: ampere.id, name: "Ampère Étage 1", floor: 1 } });
  const zoneAmp2 = await prisma.zone.create({ data: { buildingId: ampere.id, name: "Ampère Étage 2", floor: 2 } });
  const zoneCurieRDC = await prisma.zone.create({ data: { buildingId: curie.id, name: "Curie RDC", floor: 0 } });
  const zoneCurie1 = await prisma.zone.create({ data: { buildingId: curie.id, name: "Curie Étage 1", floor: 1 } });
  const zoneDarwinRDC = await prisma.zone.create({ data: { buildingId: darwin.id, name: "Darwin RDC", floor: 0 } });
  const zoneDarwin1 = await prisma.zone.create({ data: { buildingId: darwin.id, name: "Darwin Étage 1", floor: 1 } });
  const zoneResidence = await prisma.zone.create({ data: { buildingId: residence.id, name: "Résidence", floor: 0 } });

  type RoomInput = { buildingId: string; zoneId: string; name: string; type: "CLASSROOM" | "LAB" | "OFFICE" | "CAFETERIA" | "DORM" | "COMMON" | "OTHER"; capacity: number; floor: number };
  const roomsData: RoomInput[] = [
    // Ampère RDC
    { buildingId: ampere.id, zoneId: zoneAmpRDC.id, name: "Ampère A101", type: "CLASSROOM", capacity: 30, floor: 0 },
    { buildingId: ampere.id, zoneId: zoneAmpRDC.id, name: "Ampère A102", type: "CLASSROOM", capacity: 30, floor: 0 },
    { buildingId: ampere.id, zoneId: zoneAmpRDC.id, name: "Ampère A103", type: "CLASSROOM", capacity: 40, floor: 0 },
    { buildingId: ampere.id, zoneId: zoneAmpRDC.id, name: "Ampère Hall", type: "COMMON", capacity: 100, floor: 0 },
    // Ampère Étage 1
    { buildingId: ampere.id, zoneId: zoneAmp1.id, name: "Lab Informatique A201", type: "LAB", capacity: 24, floor: 1 },
    { buildingId: ampere.id, zoneId: zoneAmp1.id, name: "Lab Informatique A202", type: "LAB", capacity: 24, floor: 1 },
    { buildingId: ampere.id, zoneId: zoneAmp1.id, name: "Bureau Profs A", type: "OFFICE", capacity: 8, floor: 1 },
    // Ampère Étage 2
    { buildingId: ampere.id, zoneId: zoneAmp2.id, name: "Salle Serveurs A301", type: "OTHER", capacity: 2, floor: 2 },
    { buildingId: ampere.id, zoneId: zoneAmp2.id, name: "Local Technique A302", type: "OTHER", capacity: 2, floor: 2 },
    // Curie RDC
    { buildingId: curie.id, zoneId: zoneCurieRDC.id, name: "Curie C101", type: "CLASSROOM", capacity: 35, floor: 0 },
    { buildingId: curie.id, zoneId: zoneCurieRDC.id, name: "Curie C102", type: "CLASSROOM", capacity: 35, floor: 0 },
    { buildingId: curie.id, zoneId: zoneCurieRDC.id, name: "Curie C103", type: "CLASSROOM", capacity: 35, floor: 0 },
    { buildingId: curie.id, zoneId: zoneCurieRDC.id, name: "Curie Hall", type: "COMMON", capacity: 80, floor: 0 },
    // Curie Étage 1
    { buildingId: curie.id, zoneId: zoneCurie1.id, name: "Labo Chimie C201", type: "LAB", capacity: 16, floor: 1 },
    { buildingId: curie.id, zoneId: zoneCurie1.id, name: "Labo Physique C202", type: "LAB", capacity: 16, floor: 1 },
    { buildingId: curie.id, zoneId: zoneCurie1.id, name: "Magasin Produits C203", type: "OTHER", capacity: 2, floor: 1 },
    // Darwin RDC
    { buildingId: darwin.id, zoneId: zoneDarwinRDC.id, name: "Bibliothèque D101", type: "COMMON", capacity: 60, floor: 0 },
    { buildingId: darwin.id, zoneId: zoneDarwinRDC.id, name: "Darwin D102", type: "CLASSROOM", capacity: 30, floor: 0 },
    { buildingId: darwin.id, zoneId: zoneDarwinRDC.id, name: "Darwin D103", type: "CLASSROOM", capacity: 30, floor: 0 },
    { buildingId: darwin.id, zoneId: zoneDarwinRDC.id, name: "Cafétéria", type: "CAFETERIA", capacity: 120, floor: 0 },
    // Darwin Étage 1
    { buildingId: darwin.id, zoneId: zoneDarwin1.id, name: "Salle Info D201", type: "LAB", capacity: 20, floor: 1 },
    { buildingId: darwin.id, zoneId: zoneDarwin1.id, name: "Salle Info D202", type: "LAB", capacity: 20, floor: 1 },
    { buildingId: darwin.id, zoneId: zoneDarwin1.id, name: "Archives D203", type: "OTHER", capacity: 2, floor: 1 },
    // Résidence
    { buildingId: residence.id, zoneId: zoneResidence.id, name: "Chambre R101", type: "DORM", capacity: 2, floor: 1 },
    { buildingId: residence.id, zoneId: zoneResidence.id, name: "Chambre R102", type: "DORM", capacity: 2, floor: 1 },
    { buildingId: residence.id, zoneId: zoneResidence.id, name: "Chambre R201", type: "DORM", capacity: 2, floor: 2 },
    { buildingId: residence.id, zoneId: zoneResidence.id, name: "Salle Commune R", type: "COMMON", capacity: 30, floor: 0 },
  ];
  const rooms = await Promise.all(roomsData.map(r => prisma.room.create({ data: r })));

  // ── Equipment ─────────────────────────────────────────────────────────────
  const equStatuses = ["ON", "ON", "ON", "ON", "ON", "OFF", "FAULT"] as const;
  for (const room of rooms) {
    await prisma.equipment.create({ data: { roomId: room.id, name: `Lumière ${room.name}`, type: "LIGHT", status: pick(["ON","ON","ON","OFF"]), isOnline: Math.random() > 0.08 } });
    await prisma.equipment.create({ data: { roomId: room.id, name: `Capteur présence ${room.name}`, type: "PRESENCE_SENSOR", status: pick(equStatuses), isOnline: Math.random() > 0.05 } });
    if (["LAB","CLASSROOM","OFFICE"].includes(room.type)) {
      await prisma.equipment.create({ data: { roomId: room.id, name: `Volet ${room.name}`, type: "BLIND", status: pick(["ON","OFF","OFF"]), isOnline: Math.random() > 0.10 } });
      await prisma.equipment.create({ data: { roomId: room.id, name: `Capteur CO₂ ${room.name}`, type: "AIR_QUALITY_SENSOR", status: "ON", isOnline: Math.random() > 0.05 } });
    }
  }

  // ── HVAC ─────────────────────────────────────────────────────────────────
  const hvacDefs = [
    { name: "HVAC Ampère RDC", zoneId: zoneAmpRDC.id, set: 21, mode: "AUTO" },
    { name: "HVAC Ampère Étage 1", zoneId: zoneAmp1.id, set: 20, mode: "ECO" },
    { name: "HVAC Ampère Étage 2", zoneId: zoneAmp2.id, set: 19, mode: "AUTO" },
    { name: "HVAC Curie RDC", zoneId: zoneCurieRDC.id, set: 21, mode: "AUTO" },
    { name: "HVAC Curie Étage 1", zoneId: zoneCurie1.id, set: 18, mode: "ECO" },
    { name: "HVAC Darwin RDC", zoneId: zoneDarwinRDC.id, set: 22, mode: "AUTO" },
    { name: "HVAC Darwin Étage 1", zoneId: zoneDarwin1.id, set: 20, mode: "MANUAL" },
    { name: "HVAC Résidence A", zoneId: zoneResidence.id, set: 20, mode: "AUTO" },
    { name: "HVAC Résidence B", zoneId: zoneResidence.id, set: 19, mode: "ECO" },
  ] as const;
  for (const h of hvacDefs) {
    const cur = h.set + rnd(-2, 2);
    const statuses = ["HEATING","COOLING","IDLE","IDLE","IDLE","OFF"] as const;
    await prisma.hvacUnit.create({
      data: {
        zoneId: h.zoneId, name: h.name,
        mode: h.mode as "AUTO"|"ECO"|"MANUAL"|"OFF",
        status: pick(statuses),
        setTemperature: h.set,
        currentTemperature: parseFloat(cur.toFixed(1)),
        isOnline: Math.random() > 0.08,
        powerWatts: rnd(800, 3500),
      },
    });
  }

  // ── Street lights ─────────────────────────────────────────────────────────
  const lightDefs = [
    { id: "AMP", buildingId: ampere.id, count: 8 },
    { id: "CUR", buildingId: curie.id, count: 8 },
    { id: "DAR", buildingId: darwin.id, count: 8 },
    { id: "RES", buildingId: residence.id, count: 6 },
    { id: "EXT", buildingId: null, count: 10 },
  ];
  for (const def of lightDefs) {
    for (let i = 1; i <= def.count; i++) {
      const isFault = Math.random() < 0.07;
      await prisma.streetLight.create({
        data: {
          buildingId: def.buildingId,
          identifier: `${def.id}-${String(i).padStart(2, "0")}`,
          status: isFault ? "FAULT" : pick(["ON","ON","ON","OFF"]),
          mode: pick(["AUTO","AUTO","MANUAL"]),
          powerWatts: pick([70, 100, 150]),
          isOnline: !isFault && Math.random() > 0.06,
        },
      });
    }
  }

  // ── Sensor Readings (30 days: energy + temperature) ───────────────────────
  console.log("  Generating sensor readings (30 days)…");
  const buildings = [ampere, curie, darwin, residence];
  const zones = [zoneAmpRDC, zoneAmp1, zoneCurieRDC, zoneDarwinRDC];
  const now = new Date();

  for (let dayAgo = 29; dayAgo >= 0; dayAgo--) {
    const dayStart = new Date(now); dayStart.setDate(dayStart.getDate() - dayAgo); dayStart.setHours(0, 0, 0, 0);

    // Energy readings per building (every 2h)
    for (const building of buildings) {
      for (let h = 0; h < 24; h += 2) {
        const ts = new Date(dayStart); ts.setHours(h, rndInt(0, 59));
        const isBusinessHours = h >= 7 && h <= 20;
        const baseWh = isBusinessHours ? rnd(800, 1800) : rnd(150, 400);
        await prisma.sensorReading.create({
          data: { buildingId: building.id, type: "ENERGY", value: baseWh, unit: "Wh", timestamp: ts },
        });
      }
    }

    // Temperature readings per zone (every hour)
    for (const zone of zones) {
      for (let h = 0; h < 24; h += 3) {
        const ts = new Date(dayStart); ts.setHours(h, rndInt(0, 59));
        const nightCool = h < 7 || h > 21;
        const baseTemp = nightCool ? rnd(17, 19.5) : rnd(19.5, 23);
        const bldId = [ampere, curie, darwin, residence].find(b => b.id === zone.buildingId)?.id;
        await prisma.sensorReading.create({
          data: { buildingId: bldId, type: "TEMPERATURE", value: parseFloat(baseTemp.toFixed(1)), unit: "°C", timestamp: ts },
        });
      }
    }
  }

  // ── Incidents ─────────────────────────────────────────────────────────────
  const incidentDefs = [
    { title: "Lampadaire EXT-03 en panne", category: "LIGHTING", priority: "HIGH", status: "OPEN", daysAgo: 2 },
    { title: "HVAC Curie Étage 1 — température anormale", category: "HVAC", priority: "MEDIUM", status: "IN_PROGRESS", daysAgo: 1 },
    { title: "Salle serveurs : alerte température", category: "EQUIPMENT", priority: "CRITICAL", status: "OPEN", daysAgo: 0 },
    { title: "Lecteur RFID C202 hors ligne", category: "ACCESS", priority: "HIGH", status: "OPEN", daysAgo: 3 },
    { title: "Capteur CO₂ A103 — valeur aberrante", category: "EQUIPMENT", priority: "MEDIUM", status: "OPEN", daysAgo: 5 },
    { title: "Volet bloqué Ampère A101", category: "EQUIPMENT", priority: "LOW", status: "RESOLVED", daysAgo: 7 },
    { title: "Éclairage cafétéria défaillant", category: "LIGHTING", priority: "MEDIUM", status: "RESOLVED", daysAgo: 10 },
    { title: "Badge inconnu — tentative répétée", category: "ACCESS", priority: "HIGH", status: "OPEN", daysAgo: 1 },
  ] as const;
  for (const inc of incidentDefs) {
    const createdAt = new Date(now); createdAt.setDate(createdAt.getDate() - inc.daysAgo);
    await prisma.incident.create({
      data: {
        title: inc.title,
        description: `Incident signalé automatiquement par le système de supervision. Vérification requise.`,
        category: inc.category as "LIGHTING"|"HVAC"|"ACCESS"|"EQUIPMENT",
        priority: inc.priority as "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
        status: inc.status as "OPEN"|"IN_PROGRESS"|"RESOLVED",
        reportedById: admin.id,
        assignedToId: inc.status !== "OPEN" ? maint1.id : undefined,
        createdAt,
        resolvedAt: inc.status === "RESOLVED" ? new Date(createdAt.getTime() + 48 * 3600000) : undefined,
      },
    });
  }

  // ── RFID Readers ─────────────────────────────────────────────────────────
  console.log("  Creating RFID readers…");
  type ReaderDef = { name: string; location: string; building: string; zone: string; floor: number; level: "LOW" | "STANDARD" | "HIGH" | "CRITICAL"; offline?: boolean };
  const readerDefs: ReaderDef[] = [
    // Extérieur
    { name: "Portail Nord", location: "Entrée principale Nord", building: "Extérieur", zone: "Périmètre", floor: 0, level: "LOW" },
    { name: "Portail Sud", location: "Entrée principale Sud", building: "Extérieur", zone: "Périmètre", floor: 0, level: "LOW" },
    { name: "Parking A — Entrée", location: "Parking visiteurs A", building: "Extérieur", zone: "Périmètre", floor: 0, level: "LOW" },
    { name: "Parking B — Entrée", location: "Parking personnel B", building: "Extérieur", zone: "Périmètre", floor: 0, level: "LOW" },
    { name: "Guérite Sécurité", location: "Poste de garde principal", building: "Extérieur", zone: "Périmètre", floor: 0, level: "STANDARD" },
    // Administration
    { name: "Administration — Accueil", location: "Hall d'accueil administratif", building: "Administration", zone: "RDC", floor: 0, level: "LOW" },
    { name: "Secrétariat", location: "Secrétariat général", building: "Administration", zone: "RDC", floor: 0, level: "STANDARD" },
    { name: "Direction Générale", location: "Bureau de la direction", building: "Administration", zone: "Étage 1", floor: 1, level: "HIGH" },
    { name: "Salle de Réunion", location: "Grande salle de réunion", building: "Administration", zone: "RDC", floor: 0, level: "STANDARD" },
    { name: "Archives Admin", location: "Archives centrales", building: "Administration", zone: "Étage 1", floor: 1, level: "STANDARD" },
    // Ampère
    { name: "Ampère — Hall RDC", location: "Hall d'entrée Ampère", building: "Bâtiment Ampère", zone: "RDC", floor: 0, level: "LOW" },
    { name: "Ampère — A101", location: "Salle de cours A101", building: "Bâtiment Ampère", zone: "RDC", floor: 0, level: "STANDARD" },
    { name: "Ampère — A102", location: "Salle de cours A102", building: "Bâtiment Ampère", zone: "RDC", floor: 0, level: "STANDARD" },
    { name: "Ampère — A103", location: "Amphithéâtre A103", building: "Bâtiment Ampère", zone: "RDC", floor: 0, level: "STANDARD" },
    { name: "Ampère — Bureau Profs", location: "Bureau enseignants Ampère", building: "Bâtiment Ampère", zone: "Étage 1", floor: 1, level: "STANDARD" },
    { name: "Ampère — Lab Info A201", location: "Laboratoire Informatique A201", building: "Bâtiment Ampère", zone: "Étage 1", floor: 1, level: "HIGH" },
    { name: "Ampère — Lab Info A202", location: "Laboratoire Informatique A202", building: "Bâtiment Ampère", zone: "Étage 1", floor: 1, level: "HIGH" },
    { name: "Ampère — Salle Serveurs", location: "Salle des serveurs A301", building: "Bâtiment Ampère", zone: "Étage 2", floor: 2, level: "CRITICAL" },
    { name: "Ampère — Local Technique", location: "Local technique A302", building: "Bâtiment Ampère", zone: "Étage 2", floor: 2, level: "STANDARD" },
    // Curie
    { name: "Curie — Hall RDC", location: "Hall d'entrée Curie", building: "Bâtiment Curie", zone: "RDC", floor: 0, level: "LOW" },
    { name: "Curie — C101", location: "Salle de cours C101", building: "Bâtiment Curie", zone: "RDC", floor: 0, level: "STANDARD" },
    { name: "Curie — C102", location: "Salle de cours C102", building: "Bâtiment Curie", zone: "RDC", floor: 0, level: "STANDARD" },
    { name: "Curie — C103", location: "Salle de cours C103", building: "Bâtiment Curie", zone: "RDC", floor: 0, level: "STANDARD" },
    { name: "Curie — Labo Chimie", location: "Laboratoire de Chimie C201", building: "Bâtiment Curie", zone: "Étage 1", floor: 1, level: "HIGH" },
    { name: "Curie — Labo Physique", location: "Laboratoire de Physique C202", building: "Bâtiment Curie", zone: "Étage 1", floor: 1, level: "HIGH", offline: true },
    { name: "Curie — Labo Biologie", location: "Laboratoire de Biologie C203", building: "Bâtiment Curie", zone: "Étage 1", floor: 1, level: "HIGH" },
    { name: "Curie — Magasin Produits", location: "Stockage produits dangereux", building: "Bâtiment Curie", zone: "Étage 1", floor: 1, level: "CRITICAL" },
    { name: "Curie — Local Technique", location: "Local technique Curie", building: "Bâtiment Curie", zone: "Étage 1", floor: 1, level: "STANDARD" },
    // Darwin
    { name: "Darwin — Hall RDC", location: "Hall d'entrée Darwin", building: "Bâtiment Darwin", zone: "RDC", floor: 0, level: "LOW" },
    { name: "Darwin — Bibliothèque", location: "Bibliothèque universitaire", building: "Bâtiment Darwin", zone: "RDC", floor: 0, level: "LOW" },
    { name: "Darwin — D102", location: "Salle de cours D102", building: "Bâtiment Darwin", zone: "RDC", floor: 0, level: "STANDARD" },
    { name: "Darwin — D103", location: "Salle de cours D103", building: "Bâtiment Darwin", zone: "RDC", floor: 0, level: "STANDARD" },
    { name: "Darwin — Cafétéria", location: "Cafétéria universitaire", building: "Bâtiment Darwin", zone: "RDC", floor: 0, level: "LOW" },
    { name: "Darwin — Salle Info D201", location: "Salle Informatique D201", building: "Bâtiment Darwin", zone: "Étage 1", floor: 1, level: "HIGH" },
    { name: "Darwin — Salle Info D202", location: "Salle Informatique D202", building: "Bâtiment Darwin", zone: "Étage 1", floor: 1, level: "HIGH" },
    { name: "Darwin — Archives", location: "Archives Darwin D203", building: "Bâtiment Darwin", zone: "Étage 1", floor: 1, level: "STANDARD" },
    { name: "Darwin — Local Technique", location: "Local technique Darwin", building: "Bâtiment Darwin", zone: "Étage 1", floor: 1, level: "STANDARD" },
    // Résidence
    { name: "Résidence — Entrée", location: "Entrée principale résidence", building: "Résidence Campus", zone: "RDC", floor: 0, level: "LOW" },
    { name: "Résidence — Couloir A", location: "Couloir résidence aile A", building: "Résidence Campus", zone: "Étage 1", floor: 1, level: "LOW" },
    { name: "Résidence — Couloir B", location: "Couloir résidence aile B", building: "Résidence Campus", zone: "Étage 2", floor: 2, level: "LOW" },
    { name: "Résidence — Couloir C", location: "Couloir résidence aile C", building: "Résidence Campus", zone: "Étage 3", floor: 3, level: "LOW" },
    { name: "Résidence — Salle Commune", location: "Salle commune résidence", building: "Résidence Campus", zone: "RDC", floor: 0, level: "LOW" },
    { name: "Résidence — Chaufferie", location: "Local chaufferie résidence", building: "Résidence Campus", zone: "Sous-sol", floor: -1, level: "STANDARD" },
    // Gymnase / Sport
    { name: "Gymnase — Entrée", location: "Gymnase universitaire", building: "Extérieur", zone: "Gymnase", floor: 0, level: "LOW" },
    { name: "Gymnase — Vestiaires", location: "Vestiaires gymnase", building: "Extérieur", zone: "Gymnase", floor: 0, level: "STANDARD" },
    { name: "Gymnase — Local Matériel", location: "Local matériel sportif", building: "Extérieur", zone: "Gymnase", floor: 0, level: "STANDARD" },
    // Infirmerie / Support
    { name: "Infirmerie", location: "Infirmerie campus", building: "Administration", zone: "RDC", floor: 0, level: "STANDARD" },
    { name: "Service Informatique", location: "DSI — Support informatique", building: "Bâtiment Ampère", zone: "Étage 2", floor: 2, level: "HIGH" },
    { name: "Ascenseur Principal", location: "Contrôle ascenseur bâtiment A", building: "Bâtiment Ampère", zone: "Tous", floor: 0, level: "STANDARD" },
  ];

  const createdReaders: { id: string; name: string; location: string; level: string }[] = [];
  for (const def of readerDefs) {
    const lastSeen = new Date(now);
    if (def.offline) lastSeen.setHours(lastSeen.getHours() - rndInt(2, 48));
    const r = await prisma.rfidReader.create({
      data: {
        name: def.name,
        location: def.location,
        building: def.building,
        zone: def.zone,
        floor: def.floor,
        securityLevel: def.level,
        isOnline: !def.offline,
        lastSeen,
        allowedRoles: JSON.stringify(ROLES_FOR_LEVEL[def.level]),
      },
    });
    createdReaders.push({ id: r.id, name: r.name, location: r.location, level: def.level });
  }
  console.log(`  ${createdReaders.length} RFID readers created.`);

  // ── Badge Holders (100 people) ────────────────────────────────────────────
  const BADGE_ROLES_DIST = [
    ...Array(2).fill("ADMINISTRATEUR"),
    ...Array(2).fill("RESPONSABLE_SECURITE"),
    ...Array(2).fill("RESPONSABLE_IOT"),
    ...Array(2).fill("RESPONSABLE_ENERGIE"),
    ...Array(5).fill("AGENT_MAINTENANCE"),
    ...Array(5).fill("PERSONNEL_TECHNIQUE"),
    ...Array(10).fill("PERSONNEL_ADMINISTRATIF"),
    ...Array(15).fill("ENSEIGNANT"),
    ...Array(3).fill("AGENT_ENTRETIEN"),
    ...Array(4).fill("PRESTATAIRE"),
    ...Array(5).fill("VISITEUR"),
    ...Array(45).fill("ETUDIANT"),
  ];
  const FN = ["Thomas","Alexandre","Nicolas","Julien","Antoine","Pierre","Baptiste","Romain","Maxime","Kevin","Sophie","Marie","Emma","Camille","Laura","Chloé","Léa","Alice","Sarah","Manon","Florian","Clément","Valentin","Hugo","Lucas","Théo","Mathieu","Guillaume","Alexis","François","Julie","Claire","Pauline","Charlotte","Lucie","Marion","Anaïs","Inès","Elisa","Juliette","Rachid","Karim","Fatima","Amina","Younes","Sonia","Mehdi","Nadia","Omar","Aïcha"];
  const LN = ["Martin","Bernard","Dubois","Thomas","Robert","Richard","Petit","Durand","Leroy","Moreau","Simon","Laurent","Lefebvre","Michel","Garcia","David","Bertrand","Roux","Vincent","Fournier","Morel","Girard","André","Lefèvre","Mercier","Dupont","Lambert","Bonnet","François","Martinez","Benali","Bouaziz","Cherif","Hamidi","Mansouri","Khelif","Brahim","Dridi","Saad","Toumi"];

  const badgeHolders = BADGE_ROLES_DIST.map((role, i) => ({
    badgeNumber: `BADGE-${String(i + 1).padStart(4, "0")}`,
    name: `${FN[i % FN.length]} ${LN[i % LN.length]}`,
    role,
  }));

  // ── Access Events (blockchain) ────────────────────────────────────────────
  console.log("  Generating access events with blockchain hashes…");

  const DENIAL_EXTRA = 0.02; // 2% extra random denial on top of role check
  type EventPrep = {
    blockIndex: number;
    badgeNumber: string;
    holderName: string;
    holderRole: string;
    readerId: string;
    readerName: string;
    location: string;
    result: string;
    reason: string | null;
    timestamp: Date;
    blockHash: string;
    prevHash: string;
    blockData: string;
  };

  // Pre-generate events (unsorted)
  const rawEvents: Omit<EventPrep, "blockIndex" | "blockHash" | "prevHash" | "blockData">[] = [];

  for (let dayAgo = 29; dayAgo >= 0; dayAgo--) {
    const dayDate = new Date(now); dayDate.setDate(dayDate.getDate() - dayAgo); dayDate.setHours(0, 0, 0, 0);
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
    const eventsCount = isWeekend ? rndInt(60, 120) : rndInt(160, 240);

    for (let e = 0; e < eventsCount; e++) {
      const holder = pick(badgeHolders);
      const reader = pick(createdReaders);
      const allowedRoles: string[] = ROLES_FOR_LEVEL[reader.level] ?? [];

      // Simulate hour distribution (peak morning/afternoon)
      const hourWeights = [0,0,0,0,0,0,0.5,2,3,2,1.5,1.5,2,2,1.5,1.5,2,2.5,2,1,0.5,0.3,0.1,0];
      const totalW = hourWeights.reduce((s, w) => s + w, 0);
      let r = Math.random() * totalW, hour = 0;
      for (let h = 0; h < 24; h++) { r -= hourWeights[h]; if (r <= 0) { hour = h; break; } }
      const ts = new Date(dayDate);
      ts.setHours(hour, rndInt(0, 59), rndInt(0, 59));

      let result = "GRANTED";
      let reason: string | null = null;

      if (!allowedRoles.includes(holder.role)) {
        result = "DENIED";
        reason = "ROLE_INSUFFICIENT";
      } else {
        const rand = Math.random();
        if (rand < 0.006) { result = "DENIED"; reason = "BADGE_DISABLED"; }
        else if (rand < 0.010) { result = "DENIED"; reason = "BADGE_EXPIRED"; }
        else if (rand < 0.012) { result = "DENIED"; reason = "BADGE_UNKNOWN"; }
        else if (rand < 0.013) { result = "DENIED"; reason = "ACCESS_FORBIDDEN"; }
        else if ((holder.role === "VISITEUR" || holder.role === "PRESTATAIRE") && (hour < 7 || hour >= 20)) {
          result = "DENIED"; reason = "OUT_OF_HOURS";
        }
      }

      rawEvents.push({ badgeNumber: holder.badgeNumber, holderName: holder.name, holderRole: holder.role, readerId: reader.id, readerName: reader.name, location: reader.location, result, reason, timestamp: ts });
    }
  }

  // Sort by timestamp
  rawEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Compute blockchain hashes sequentially
  const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
  let prevHash = GENESIS_HASH;
  const finalEvents: EventPrep[] = rawEvents.map((e, index) => {
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
    const event: EventPrep = { ...e, blockIndex: index, blockHash, prevHash, blockData };
    prevHash = blockHash;
    return event;
  });

  // Batch insert (50 per batch to stay within SQLite limits)
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < finalEvents.length; i += BATCH) {
    await prisma.accessEvent.createMany({ data: finalEvents.slice(i, i + BATCH) });
    inserted += Math.min(BATCH, finalEvents.length - i);
    if (inserted % 500 === 0) console.log(`    ${inserted} / ${finalEvents.length} events…`);
  }

  const denied = finalEvents.filter(e => e.result === "DENIED").length;
  const pct = Math.round(denied / finalEvents.length * 100);
  console.log(`  ${finalEvents.length} access events created (${denied} refused = ${pct}%)`);

  // ── Access log entries (auth events) ─────────────────────────────────────
  await prisma.accessLog.create({ data: { userId: admin.id, action: "ENTRY", location: "Connexion web", isSuccess: true } });

  // ── Demo shortcut accounts ────────────────────────────────────────────────
  const existingProf = await prisma.user.findUnique({ where: { email: "prof@campus.fr" } });
  if (!existingProf) {
    await prisma.user.create({ data: { email: "prof@campus.fr", passwordHash: hash("Prof1234!"), firstName: "Demo", lastName: "Enseignant", role: "TEACHER" } });
  }
  const existingEtu = await prisma.user.findUnique({ where: { email: "etudiant@campus.fr" } });
  if (!existingEtu) {
    const demoEtu = await prisma.user.create({ data: { email: "etudiant@campus.fr", passwordHash: hash("Etudiant1!"), firstName: "Demo", lastName: "Étudiant", role: "STUDENT" } });
    await prisma.student.create({ data: { userId: demoEtu.id, studentNumber: "STU9999999", year: 2, program: "Informatique" } });
  }
  const existingMaint = await prisma.user.findUnique({ where: { email: "maintenance@campus.fr" } });
  if (!existingMaint) {
    await prisma.user.create({ data: { email: "maintenance@campus.fr", passwordHash: hash("Maint1234!"), firstName: "Demo", lastName: "Maintenance", role: "MAINTENANCE" } });
  }

  console.log("\n✅ Seed completed successfully!\n");
  console.log("─────────────────────────────────────────────");
  console.log(" Demo accounts:");
  console.log("   admin@campus.fr       / Admin1234!  (Administrateur)");
  console.log("   prof@campus.fr        / Prof1234!   (Enseignant)");
  console.log("   etudiant@campus.fr    / Etudiant1!  (Étudiant)");
  console.log("   maintenance@campus.fr / Maint1234!  (Maintenance)");
  console.log("─────────────────────────────────────────────");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
