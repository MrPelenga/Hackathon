import type {
  User,
  Student,
  Building,
  Zone,
  Room,
  Equipment,
  HvacUnit,
  ParkingLot,
  ParkingSpot,
  StreetLight,
  Course,
  CourseSession,
  Incident,
  Notification,
  UserRole,
  NotificationType,
} from "@/generated/prisma/client";

export type {
  User,
  Student,
  Building,
  Zone,
  Room,
  Equipment,
  HvacUnit,
  ParkingLot,
  ParkingSpot,
  StreetLight,
  Course,
  CourseSession,
  Incident,
  Notification,
  UserRole,
  NotificationType,
};

// ─── Extended / computed types ────────────────────────────────────────────────

export type ParkingLotWithStats = ParkingLot & {
  spots: ParkingSpot[];
  occupancyRate: number;
  freeCount: number;
};

export type BuildingWithStats = Building & {
  rooms: Room[];
  zones: Zone[];
  occupancyRate: number;
};

export type RoomWithEquipment = Room & {
  equipment: Equipment[];
  hvacUnits: HvacUnit[];
};

export type DashboardStats = {
  totalStudents: number;
  studentsOnCampus: number;
  parkingOccupancy: number;
  openIncidents: number;
  energyToday: number;
  activeAlerts: number;
};

// ─── Navigation types ──────────────────────────────────────────────────────────

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  badge?: string | number;
};

// ─── API response wrapper ─────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
