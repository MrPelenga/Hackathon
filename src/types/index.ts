import type {
  Building,
  Zone,
  Room,
  Equipment,
  HvacUnit,
  StreetLight,
  Incident,
  RfidReader,
  AccessEvent,
  SensorReading,
} from "@/generated/prisma/client";

export type {
  Building,
  Zone,
  Room,
  Equipment,
  HvacUnit,
  StreetLight,
  Incident,
  RfidReader,
  AccessEvent,
  SensorReading,
};

// ─── Extended / computed types ────────────────────────────────────────────────

export type BuildingWithStats = Building & {
  rooms: Room[];
  zones: Zone[];
};

export type RoomWithEquipment = Room & {
  equipment: Equipment[];
  hvacUnits: HvacUnit[];
};

export type DashboardStats = {
  totalDevices: number;
  onlineDevices: number;
  openIncidents: number;
  energyToday: number;
  accessGranted: number;
  accessDenied: number;
};

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
