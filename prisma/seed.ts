import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:dev.db" });
const prisma = new PrismaClient({ adapter } as never);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function rndInt(min: number, max: number) {
  return Math.floor(rnd(min, max + 1));
}
function pick<T>(arr: T[]): T {
  return arr[rndInt(0, arr.length - 1)];
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Smart Campus database…");

  const hash = (p: string) => bcrypt.hashSync(p, 10);

  // ── Admin & maintenance users ─────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: "admin@campus.fr",
      passwordHash: hash("Admin1234!"),
      firstName: "Sophie",
      lastName: "Martin",
      role: "ADMIN",
    },
  });

  const maintenance1 = await prisma.user.create({
    data: {
      email: "tech1@campus.fr",
      passwordHash: hash("Tech1234!"),
      firstName: "Luc",
      lastName: "Dupont",
      role: "MAINTENANCE",
    },
  });
  const maintenance2 = await prisma.user.create({
    data: {
      email: "tech2@campus.fr",
      passwordHash: hash("Tech1234!"),
      firstName: "Fatima",
      lastName: "Benali",
      role: "MAINTENANCE",
    },
  });

  // ── Teachers ──────────────────────────────────────────────────────────────
  const teacherData = [
    { email: "prof.dubois@campus.fr", firstName: "Jean", lastName: "Dubois" },
    { email: "prof.leroy@campus.fr", firstName: "Marie", lastName: "Leroy" },
    { email: "prof.garcia@campus.fr", firstName: "Carlos", lastName: "Garcia" },
    { email: "prof.zhang@campus.fr", firstName: "Wei", lastName: "Zhang" },
    { email: "prof.petit@campus.fr", firstName: "Claire", lastName: "Petit" },
  ];
  const teachers = await Promise.all(
    teacherData.map((t) =>
      prisma.user.create({
        data: { ...t, passwordHash: hash("Prof1234!"), role: "TEACHER" },
      })
    )
  );

  // ── Students (50) ─────────────────────────────────────────────────────────
  const firstNames = [
    "Alice","Baptiste","Camille","David","Emma","François","Gabrielle","Hugo",
    "Inès","Jules","Kenza","Léo","Manon","Nathan","Océane","Paul","Quentin",
    "Rania","Samuel","Théa","Ugo","Valentin","Wendy","Xavier","Yasmine",
    "Zoé","Adam","Bilal","Chloé","Damien","Elsa","Félix","Gaëlle","Hamid",
    "Iris","Jordan","Karim","Luna","Maxime","Nadia","Omar","Pénélope",
    "Rémi","Sara","Thomas","Ursula","Victor","Wafa","Yann","Zohra",
  ];
  const lastNames = [
    "Moreau","Bernard","Thomas","Petit","Robert","Richard","Durand","Lefevre",
    "Simon","Laurent","Michel","Garcia","David","Bertrand","Roux","Vincent",
    "Fournier","Morin","Girard","Andre","Lecomte","Blanc","Guerin","Boyer",
    "Garnier","Chevalier","Francois","Legrand","Gauthier","Rousseau",
  ];
  const programs = ["Informatique","Mathématiques","Physique","Génie Civil","Économie","Chimie"];

  const studentUsers: typeof admin[] = [];
  for (let i = 0; i < 50; i++) {
    const user = await prisma.user.create({
      data: {
        email: `etudiant${i + 1}@campus.fr`,
        passwordHash: hash("Etudiant123!"),
        firstName: firstNames[i % firstNames.length],
        lastName: lastNames[i % lastNames.length],
        role: "STUDENT",
      },
    });
    studentUsers.push(user);
  }

  const students = await Promise.all(
    studentUsers.map((u, i) =>
      prisma.student.create({
        data: {
          userId: u.id,
          studentNumber: `STU${String(2024000 + i + 1)}`,
          year: rndInt(1, 3),
          program: programs[i % programs.length],
        },
      })
    )
  );

  // ── Buildings ─────────────────────────────────────────────────────────────
  const buildingA = await prisma.building.create({
    data: {
      name: "Bâtiment Ampère",
      shortName: "AMP",
      address: "1 Avenue des Sciences, Campus Nord",
      latitude: 48.8515,
      longitude: 2.3452,
      floorCount: 4,
    },
  });
  const buildingB = await prisma.building.create({
    data: {
      name: "Bâtiment Curie",
      shortName: "CUR",
      address: "3 Avenue des Sciences, Campus Nord",
      latitude: 48.8518,
      longitude: 2.3458,
      floorCount: 3,
    },
  });
  const buildingC = await prisma.building.create({
    data: {
      name: "Résidence Universitaire Pasteur",
      shortName: "RES",
      address: "5 Rue du Campus, Campus Sud",
      latitude: 48.8505,
      longitude: 2.344,
      floorCount: 5,
    },
  });
  const buildingD = await prisma.building.create({
    data: {
      name: "Centre de Vie Étudiant",
      shortName: "CVE",
      address: "2 Allée du Parc, Campus Nord",
      latitude: 48.852,
      longitude: 2.3462,
      floorCount: 2,
    },
  });

  // ── Zones (regroupements pour HVAC et espace) ─────────────────────────────
  const zoneA1 = await prisma.zone.create({ data: { buildingId: buildingA.id, name: "Zone Nord RDC", floor: 0 } });
  const zoneA2 = await prisma.zone.create({ data: { buildingId: buildingA.id, name: "Zone Sud RDC", floor: 0 } });
  const zoneA3 = await prisma.zone.create({ data: { buildingId: buildingA.id, name: "Zone 1er étage", floor: 1 } });
  const zoneA4 = await prisma.zone.create({ data: { buildingId: buildingA.id, name: "Zone 2ème étage", floor: 2 } });
  const zoneB1 = await prisma.zone.create({ data: { buildingId: buildingB.id, name: "Zone Labo", floor: 0 } });
  const zoneB2 = await prisma.zone.create({ data: { buildingId: buildingB.id, name: "Zone Bureaux", floor: 1 } });
  const zoneC1 = await prisma.zone.create({ data: { buildingId: buildingC.id, name: "Aile Est", floor: 0 } });
  const zoneC2 = await prisma.zone.create({ data: { buildingId: buildingC.id, name: "Aile Ouest", floor: 0 } });
  const zoneD1 = await prisma.zone.create({ data: { buildingId: buildingD.id, name: "Cafétéria", floor: 0 } });

  // ── Rooms ─────────────────────────────────────────────────────────────────
  // Bâtiment A – salles de cours
  const roomsAmpere: { id: string; name: string; capacity: number; [k: string]: unknown }[] = [];
  const classroomDefs = [
    { name: "Amphi A001", capacity: 120, floor: 0, zone: zoneA1, area: 200 },
    { name: "Salle A002", capacity: 40,  floor: 0, zone: zoneA1, area: 60 },
    { name: "Salle A003", capacity: 30,  floor: 0, zone: zoneA1, area: 50 },
    { name: "Salle A004", capacity: 40,  floor: 0, zone: zoneA2, area: 60 },
    { name: "Salle A005", capacity: 30,  floor: 0, zone: zoneA2, area: 50 },
    { name: "Salle A101", capacity: 60,  floor: 1, zone: zoneA3, area: 90 },
    { name: "Salle A102", capacity: 40,  floor: 1, zone: zoneA3, area: 60 },
    { name: "Salle A103", capacity: 40,  floor: 1, zone: zoneA3, area: 60 },
    { name: "Salle A201", capacity: 30,  floor: 2, zone: zoneA4, area: 50 },
    { name: "Salle A202", capacity: 30,  floor: 2, zone: zoneA4, area: 50 },
  ];
  for (const def of classroomDefs) {
    const r = await prisma.room.create({
      data: {
        buildingId: buildingA.id,
        zoneId: def.zone.id,
        name: def.name,
        type: "CLASSROOM",
        capacity: def.capacity,
        floor: def.floor,
        areaSqm: def.area,
      },
    });
    roomsAmpere.push(r);
  }

  // Bâtiment B – labos + bureaux
  const roomsCurie: { id: string; name: string; capacity: number; [k: string]: unknown }[] = [];
  const curieDefs = [
    { name: "Labo Info B001", capacity: 24, floor: 0, zone: zoneB1, type: "LAB", area: 80 },
    { name: "Labo Physique B002", capacity: 20, floor: 0, zone: zoneB1, type: "LAB", area: 70 },
    { name: "Labo Chimie B003", capacity: 18, floor: 0, zone: zoneB1, type: "LAB", area: 65 },
    { name: "Bureau Profs B101", capacity: 8, floor: 1, zone: zoneB2, type: "OFFICE", area: 30 },
    { name: "Bureau Direction B102", capacity: 4, floor: 1, zone: zoneB2, type: "OFFICE", area: 20 },
    { name: "Salle de réunion B103", capacity: 12, floor: 1, zone: zoneB2, type: "CLASSROOM", area: 35 },
  ];
  for (const def of curieDefs) {
    const r = await prisma.room.create({
      data: {
        buildingId: buildingB.id,
        zoneId: def.zone.id,
        name: def.name,
        type: def.type as "LAB" | "OFFICE" | "CLASSROOM",
        capacity: def.capacity,
        floor: def.floor,
        areaSqm: def.area,
      },
    });
    roomsCurie.push(r);
  }

  // Bâtiment C – dortoirs (30 chambres)
  const dormRooms: { id: string; name: string; capacity: number; [k: string]: unknown }[] = [];
  for (let i = 1; i <= 30; i++) {
    const floor = Math.floor((i - 1) / 6) + 1;
    const zone = i <= 15 ? zoneC1 : zoneC2;
    const r = await prisma.room.create({
      data: {
        buildingId: buildingC.id,
        zoneId: zone.id,
        name: `Chambre ${String(floor * 100 + (i % 6 || 6)).padStart(3, "0")}`,
        type: "DORM",
        capacity: 1,
        floor,
        areaSqm: 14,
      },
    });
    dormRooms.push(r);
  }

  // Bâtiment D – cafétéria + espace commun
  const cafeteriaRoom = await prisma.room.create({
    data: {
      buildingId: buildingD.id,
      zoneId: zoneD1.id,
      name: "Cafétéria Principale",
      type: "CAFETERIA",
      capacity: 200,
      floor: 0,
      areaSqm: 400,
    },
  });
  const commonRoom = await prisma.room.create({
    data: {
      buildingId: buildingD.id,
      zoneId: zoneD1.id,
      name: "Espace Détente",
      type: "COMMON",
      capacity: 50,
      floor: 0,
      areaSqm: 100,
    },
  });

  // ── Equipment pour les salles de cours ────────────────────────────────────
  const classroomRooms = [...roomsAmpere, ...roomsCurie.slice(0, 3)];
  for (const room of classroomRooms) {
    await prisma.equipment.createMany({
      data: [
        { roomId: room.id, name: "Lumière principale", type: "LIGHT", status: "OFF" },
        { roomId: room.id, name: "Volet 1", type: "BLIND", status: "OFF" },
        { roomId: room.id, name: "Volet 2", type: "BLIND", status: "OFF" },
        { roomId: room.id, name: "Capteur de présence", type: "PRESENCE_SENSOR", status: "ON" },
      ],
    });
  }

  // ── HVAC Units ─────────────────────────────────────────────────────────────
  const hvacZones = [zoneA1, zoneA2, zoneA3, zoneA4, zoneB1, zoneB2, zoneC1, zoneC2, zoneD1];
  const hvacTemps: Record<string, number> = {
    [zoneA1.id]: 22.1, [zoneA2.id]: 21.5, [zoneA3.id]: 23.0, [zoneA4.id]: 20.8,
    [zoneB1.id]: 22.5, [zoneB2.id]: 21.0, [zoneC1.id]: 20.3, [zoneC2.id]: 19.8,
    [zoneD1.id]: 24.0,
  };
  const hvacModes: ("AUTO" | "ECO" | "MANUAL")[] = ["AUTO", "AUTO", "ECO", "MANUAL"];
  for (const zone of hvacZones) {
    const current = hvacTemps[zone.id] ?? 21.0;
    await prisma.hvacUnit.create({
      data: {
        zoneId: zone.id,
        name: `CVC ${zone.name}`,
        mode: pick(hvacModes),
        status: current > 22 ? "COOLING" : current < 20 ? "HEATING" : "IDLE",
        setTemperature: 21.0,
        currentTemperature: current,
        powerWatts: rnd(500, 3000),
      },
    });
  }

  // ── Parking lots & spots ──────────────────────────────────────────────────
  const parkingDefs = [
    { name: "Parking Ampère", shortName: "PA", total: 60 },
    { name: "Parking Curie", shortName: "PC", total: 40 },
    { name: "Parking Résidence", shortName: "PR", total: 30 },
  ];
  for (const def of parkingDefs) {
    const lot = await prisma.parkingLot.create({
      data: { name: def.name, shortName: def.shortName, totalSpots: def.total },
    });
    const spots = [];
    for (let i = 1; i <= def.total; i++) {
      const isDisabled = i <= 3;
      const isElectric = !isDisabled && i <= 8;
      const statusOdds = Math.random();
      const status: "FREE" | "OCCUPIED" | "RESERVED" =
        statusOdds < 0.45 ? "OCCUPIED" : statusOdds < 0.55 ? "RESERVED" : "FREE";
      spots.push({
        lotId: lot.id,
        number: String(i).padStart(3, "0"),
        type: isDisabled ? ("DISABLED" as const) : isElectric ? ("ELECTRIC" as const) : ("STANDARD" as const),
        status,
      });
    }
    await prisma.parkingSpot.createMany({ data: spots });
  }

  // ── Street Lights ──────────────────────────────────────────────────────────
  const lightBuildings = [buildingA, buildingB, buildingC, buildingD];
  let lightIdx = 1;
  for (const b of lightBuildings) {
    const count = b.id === buildingA.id ? 12 : b.id === buildingB.id ? 8 : 6;
    for (let i = 0; i < count; i++) {
      const isFault = Math.random() < 0.08;
      await prisma.streetLight.create({
        data: {
          buildingId: b.id,
          identifier: `L${String(lightIdx++).padStart(3, "0")}`,
          latitude: (b.latitude ?? 48.851) + rnd(-0.0005, 0.0005),
          longitude: (b.longitude ?? 2.345) + rnd(-0.0005, 0.0005),
          status: isFault ? "FAULT" : "ON",
          mode: "AUTO",
          powerWatts: pick([70, 100, 150]),
          isOnline: !isFault,
        },
      });
    }
  }

  // ── Courses ───────────────────────────────────────────────────────────────
  const courseDefs = [
    { code: "INF101", name: "Introduction à la Programmation", teacher: teachers[0], credits: 6 },
    { code: "INF202", name: "Algorithmes et Structures de données", teacher: teachers[0], credits: 6 },
    { code: "MAT101", name: "Analyse Mathématique", teacher: teachers[1], credits: 6 },
    { code: "MAT202", name: "Algèbre Linéaire", teacher: teachers[1], credits: 6 },
    { code: "PHY101", name: "Mécanique Classique", teacher: teachers[2], credits: 6 },
    { code: "INF301", name: "Réseaux et Cybersécurité", teacher: teachers[3], credits: 4 },
    { code: "INF302", name: "Intelligence Artificielle", teacher: teachers[3], credits: 4 },
    { code: "ECO101", name: "Microéconomie", teacher: teachers[4], credits: 4 },
  ];
  const courses = await Promise.all(
    courseDefs.map((c) =>
      prisma.course.create({
        data: {
          code: c.code,
          name: c.name,
          teacherId: c.teacher.id,
          credits: c.credits,
          description: `Cours de ${c.name} dispensé au campus.`,
        },
      })
    )
  );

  // ── Course Sessions (5 jours) ──────────────────────────────────────────────
  const courseRooms = roomsAmpere.slice(0, 6);
  const sessions = [];
  for (let dayOffset = -4; dayOffset <= 0; dayOffset++) {
    const date = daysAgo(-dayOffset);
    date.setHours(0, 0, 0, 0);

    const daySchedule = [
      { course: courses[0], room: courseRooms[0], start: "08:00", end: "10:00" },
      { course: courses[2], room: courseRooms[1], start: "08:00", end: "10:00" },
      { course: courses[1], room: courseRooms[0], start: "10:15", end: "12:15" },
      { course: courses[3], room: courseRooms[2], start: "10:15", end: "12:15" },
      { course: courses[4], room: courseRooms[3], start: "13:30", end: "15:30" },
      { course: courses[5], room: courseRooms[1], start: "13:30", end: "15:30" },
      { course: courses[6], room: courseRooms[4], start: "15:45", end: "17:45" },
      { course: courses[7], room: courseRooms[5], start: "15:45", end: "17:45" },
    ];

    for (const slot of daySchedule) {
      const s = await prisma.courseSession.create({
        data: {
          courseId: slot.course.id,
          roomId: slot.room.id,
          date,
          startTime: slot.start,
          endTime: slot.end,
        },
      });
      sessions.push(s);
    }
  }

  // ── Attendances ───────────────────────────────────────────────────────────
  for (const session of sessions) {
    const sampleStudents = students.slice(0, 30);
    for (const student of sampleStudents) {
      const present = Math.random() < 0.85;
      await prisma.attendance.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          isPresent: present,
          checkedInAt: present ? new Date(session.date.getTime() + 5 * 60000) : null,
        },
      });
    }
  }

  // ── Dorm assignments (assign 30 students to dorm rooms) ───────────────────
  const semesterStart = new Date("2026-09-01");
  const semesterEnd = new Date("2027-06-30");
  for (let i = 0; i < 30; i++) {
    await prisma.dormAssignment.create({
      data: {
        roomId: dormRooms[i].id,
        studentId: students[i].id,
        startDate: semesterStart,
        endDate: semesterEnd,
        isActive: true,
      },
    });
  }

  // ── Campus presences (last 3 days) ────────────────────────────────────────
  for (const student of students) {
    for (let d = 0; d < 3; d++) {
      const date = daysAgo(d);
      if (Math.random() < 0.7) {
        const checkIn = new Date(date);
        checkIn.setHours(rndInt(7, 9), rndInt(0, 59), 0, 0);
        const checkOut = new Date(checkIn);
        checkOut.setHours(rndInt(16, 20), rndInt(0, 59), 0, 0);
        await prisma.campusPresence.create({
          data: {
            studentId: student.id,
            buildingId: pick([buildingA, buildingB, buildingC]).id,
            badgeId: `BADGE-${student.studentNumber}`,
            checkedInAt: checkIn,
            checkedOutAt: d === 0 && Math.random() < 0.3 ? null : checkOut,
          },
        });
      }
    }
  }

  // ── Sensor readings (temperature + energy, 7 days, every 30 min) ──────────
  const sensorRooms = roomsAmpere.slice(0, 5);
  const now = new Date();
  for (const room of sensorRooms) {
    for (let h = 0; h < 7 * 24; h += 0.5) {
      const ts = new Date(now.getTime() - h * 3600 * 1000);
      const hour = ts.getHours();
      const isWorking = hour >= 8 && hour <= 18;
      await prisma.sensorReading.createMany({
        data: [
          {
            roomId: room.id,
            buildingId: buildingA.id,
            type: "TEMPERATURE",
            value: isWorking ? rnd(20.5, 23.5) : rnd(17.0, 20.0),
            unit: "°C",
            timestamp: ts,
          },
          {
            roomId: room.id,
            buildingId: buildingA.id,
            type: "ENERGY",
            value: isWorking ? rnd(1.5, 4.5) : rnd(0.1, 0.5),
            unit: "kWh",
            timestamp: ts,
          },
        ],
      });
    }
  }

  // ── Occupancy records (last 7 days, hourly) ───────────────────────────────
  const occupancyRooms = roomsAmpere.slice(0, 4);
  for (const room of occupancyRooms) {
    for (let h = 0; h < 7 * 24; h++) {
      const ts = new Date(now.getTime() - h * 3600 * 1000);
      const hour = ts.getHours();
      const isLecture = hour >= 8 && hour <= 18 && h < 24;
      const count = isLecture ? rndInt(10, room.capacity) : rndInt(0, 5);
      await prisma.occupancyRecord.create({
        data: {
          roomId: room.id,
          occupantCount: count,
          capacity: room.capacity,
          rate: count / room.capacity,
          source: "SENSOR",
          timestamp: ts,
        },
      });
    }
  }

  // ── Incidents ─────────────────────────────────────────────────────────────
  const incidentData = [
    {
      title: "Lampadaire L003 hors service",
      description: "Le lampadaire L003 ne s'allume plus depuis ce matin.",
      category: "LIGHTING" as const,
      status: "OPEN" as const,
      priority: "MEDIUM" as const,
      reportedById: students[0].userId,
    },
    {
      title: "Clim défaillante en A102",
      description: "La climatisation de la salle A102 fait un bruit anormal.",
      category: "HVAC" as const,
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      reportedById: teachers[0].id,
      assignedToId: maintenance1.id,
    },
    {
      title: "Volet bloqué en A003",
      description: "Le volet 2 de la salle A003 est bloqué en position fermée.",
      category: "BLIND" as const,
      status: "RESOLVED" as const,
      priority: "LOW" as const,
      reportedById: teachers[1].id,
      assignedToId: maintenance2.id,
      resolvedAt: daysAgo(1),
      resolutionNote: "Volet remplacé.",
    },
    {
      title: "Capteur présence B101 HS",
      description: "Le capteur de présence du bureau B101 n'envoie plus de données.",
      category: "EQUIPMENT" as const,
      status: "OPEN" as const,
      priority: "LOW" as const,
      reportedById: admin.id,
    },
    {
      title: "Salle vide encore climatisée (A201)",
      description: "Alerte automatique : salle A201 vide depuis 2h, climatisation active.",
      category: "HVAC" as const,
      status: "OPEN" as const,
      priority: "MEDIUM" as const,
      reportedById: admin.id,
    },
  ];
  for (const inc of incidentData) {
    await prisma.incident.create({
      data: {
        ...inc,
        roomId: pick(roomsAmpere).id,
      },
    });
  }

  // ── Access logs ────────────────────────────────────────────────────────────
  const accessLocations = ["Entrée Bâtiment Ampère", "Entrée Bâtiment Curie", "Résidence – Portail", "Parking Ampère"];
  for (const student of students.slice(0, 20)) {
    for (let d = 0; d < 3; d++) {
      const ts = daysAgo(d);
      ts.setHours(rndInt(7, 9), rndInt(0, 59), 0, 0);
      await prisma.accessLog.create({
        data: {
          userId: student.userId,
          action: "ENTRY",
          location: pick(accessLocations),
          badgeId: `BADGE-STU${student.studentNumber}`,
          timestamp: ts,
          isSuccess: Math.random() > 0.05,
        },
      });
    }
  }
  // One denied access for demo
  await prisma.accessLog.create({
    data: {
      userId: students[3].userId,
      action: "DENIED",
      location: "Bureau Direction B102",
      badgeId: `BADGE-STU${students[3].studentNumber}`,
      timestamp: daysAgo(1),
      isSuccess: false,
      notes: "Accès zone restreinte refusé – rôle insuffisant",
    },
  });

  // ── Notifications ─────────────────────────────────────────────────────────
  const notifData = [
    {
      userId: admin.id,
      type: "ALERT" as const,
      title: "Parking Ampère presque plein",
      body: "Le parking PA atteint 88% d'occupation. 7 places libres restantes.",
    },
    {
      userId: admin.id,
      type: "CRITICAL" as const,
      title: "Consommation anormale détectée",
      body: "La consommation du Bâtiment A dépasse la moyenne de 40% depuis 2h.",
    },
    {
      userId: maintenance1.id,
      type: "WARNING" as const,
      title: "Incident affecté – Clim A102",
      body: "L'incident #2 (Clim défaillante A102) vous a été assigné.",
    },
    {
      userId: students[0].userId,
      type: "INFO" as const,
      title: "Réservation parking confirmée",
      body: "Votre place PA-012 est réservée aujourd'hui de 9h à 17h.",
    },
  ];
  await prisma.notification.createMany({ data: notifData });

  console.log("✅ Seed terminé avec succès !");
  console.log(`   • ${await prisma.user.count()} utilisateurs`);
  console.log(`   • ${await prisma.student.count()} étudiants`);
  console.log(`   • ${await prisma.building.count()} bâtiments`);
  console.log(`   • ${await prisma.room.count()} salles`);
  console.log(`   • ${await prisma.hvacUnit.count()} unités HVAC`);
  console.log(`   • ${await prisma.parkingSpot.count()} places de parking`);
  console.log(`   • ${await prisma.streetLight.count()} lampadaires`);
  console.log(`   • ${await prisma.course.count()} cours / ${await prisma.courseSession.count()} sessions`);
  console.log(`   • ${await prisma.sensorReading.count()} relevés capteurs`);
  console.log(`   • ${await prisma.incident.count()} incidents`);

  // ── Demo shortcut accounts ─────────────────────────────────────────────────
  // Guaranteed simple-email demo accounts for easy testing
  const demoTeacher = await prisma.user.create({
    data: {
      email: "prof@campus.fr",
      passwordHash: hash("Prof1234!"),
      firstName: "Demo",
      lastName: "Enseignant",
      role: "TEACHER",
    },
  });
  // Assign the demo teacher to the first course so they have data
  const firstCourse = await prisma.course.findFirst();
  if (firstCourse) {
    await prisma.course.create({
      data: {
        code: "DEMO101",
        name: "Cours de démonstration",
        teacherId: demoTeacher.id,
        credits: 3,
        description: "Cours de démonstration pour le compte prof@campus.fr",
      },
    });
  }

  const demoStudent = await prisma.user.create({
    data: {
      email: "etudiant@campus.fr",
      passwordHash: hash("Etudiant1!"),
      firstName: "Demo",
      lastName: "Etudiant",
      role: "STUDENT",
    },
  });
  const demoStudentCount = await prisma.student.count();
  await prisma.student.create({
    data: {
      userId: demoStudent.id,
      studentNumber: `ETU${String(demoStudentCount + 1).padStart(5, "0")}`,
      year: 2,
      program: "Informatique",
    },
  });

  await prisma.user.create({
    data: {
      email: "maintenance@campus.fr",
      passwordHash: hash("Maint1234!"),
      firstName: "Demo",
      lastName: "Maintenance",
      role: "MAINTENANCE",
    },
  });

  console.log("📋 Comptes de démonstration :");
  console.log("   admin@campus.fr       / Admin1234!  (Admin)");
  console.log("   prof@campus.fr        / Prof1234!   (Enseignant)");
  console.log("   etudiant@campus.fr    / Etudiant1!  (Étudiant)");
  console.log("   maintenance@campus.fr / Maint1234!  (Maintenance)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); process.exit(0); });
