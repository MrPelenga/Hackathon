import type { UserRole } from "@/generated/prisma/client";

// Module identifiers
export type Module =
  | "parking"
  | "lighting"
  | "buildings"
  | "hvac"
  | "space"
  | "dorms"
  | "students"
  | "courses"
  | "reservations"
  | "energy"
  | "affluence"
  | "security"
  | "incidents"
  | "notifications"
  | "dashboard";

// Actions
export type Action = "view" | "control" | "reserve" | "manage" | "report";

type PermissionMap = Record<Module, Action[]>;

const PERMISSIONS: Record<UserRole, PermissionMap> = {
  ADMIN: {
    parking: ["view", "control", "reserve", "manage"],
    lighting: ["view", "control", "manage"],
    buildings: ["view", "control", "manage"],
    hvac: ["view", "control", "manage"],
    space: ["view", "manage"],
    dorms: ["view", "manage"],
    students: ["view", "manage"],
    courses: ["view", "manage"],
    reservations: ["view", "reserve", "manage"],
    energy: ["view", "manage"],
    affluence: ["view"],
    security: ["view", "manage"],
    incidents: ["view", "report", "manage"],
    notifications: ["view", "manage"],
    dashboard: ["view"],
  },
  TEACHER: {
    parking: ["view", "reserve"],
    lighting: ["view"],
    buildings: ["view", "control"],
    hvac: ["view", "control"],
    space: ["view"],
    dorms: [],
    students: ["view"],
    courses: ["view", "manage"],
    reservations: ["view", "reserve"],
    energy: ["view"],
    affluence: ["view"],
    security: [],
    incidents: ["view", "report"],
    notifications: ["view"],
    dashboard: ["view"],
  },
  STUDENT: {
    parking: ["view", "reserve"],
    lighting: [],
    buildings: ["view"],
    hvac: [],
    space: ["view"],
    dorms: ["view"],
    students: [],
    courses: ["view"],
    reservations: ["view", "reserve"],
    energy: [],
    affluence: ["view"],
    security: [],
    incidents: ["report"],
    notifications: ["view"],
    dashboard: [],
  },
  MAINTENANCE: {
    parking: ["view"],
    lighting: ["view", "control"],
    buildings: ["view", "control"],
    hvac: ["view", "control"],
    space: ["view"],
    dorms: ["view"],
    students: [],
    courses: [],
    reservations: [],
    energy: ["view"],
    affluence: [],
    security: ["view"],
    incidents: ["view", "report", "manage"],
    notifications: ["view"],
    dashboard: ["view"],
  },
};

export function can(role: UserRole, module: Module, action: Action): boolean {
  return PERMISSIONS[role]?.[module]?.includes(action) ?? false;
}

export function getModulesForRole(role: UserRole): Module[] {
  return (Object.keys(PERMISSIONS[role]) as Module[]).filter(
    (m) => PERMISSIONS[role][m].length > 0
  );
}
