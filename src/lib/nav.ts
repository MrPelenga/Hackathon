import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: ["ADMIN", "TEACHER", "MAINTENANCE"],
  },
  {
    label: "Parkings",
    href: "/dashboard/parking",
    icon: "ParkingSquare",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
  {
    label: "Éclairage",
    href: "/dashboard/lighting",
    icon: "Lightbulb",
    roles: ["ADMIN", "MAINTENANCE"],
  },
  {
    label: "Bâtiments & salles",
    href: "/dashboard/buildings",
    icon: "Building2",
    roles: ["ADMIN", "TEACHER", "MAINTENANCE"],
  },
  {
    label: "Climatisation",
    href: "/dashboard/hvac",
    icon: "Thermometer",
    roles: ["ADMIN", "TEACHER", "MAINTENANCE"],
  },
  {
    label: "Gestion des espaces",
    href: "/dashboard/space",
    icon: "LayoutGrid",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    label: "Résidences",
    href: "/dashboard/dorms",
    icon: "BedDouble",
    roles: ["ADMIN"],
  },
  {
    label: "Étudiants & présence",
    href: "/dashboard/students",
    icon: "Users",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    label: "Cours & emploi du temps",
    href: "/dashboard/courses",
    icon: "CalendarDays",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    label: "Réservation de salles",
    href: "/dashboard/reservations",
    icon: "BookOpen",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    label: "Énergie",
    href: "/dashboard/energy",
    icon: "Zap",
    roles: ["ADMIN", "MAINTENANCE"],
  },
  {
    label: "Affluence",
    href: "/dashboard/affluence",
    icon: "TrendingUp",
    roles: ["ADMIN", "STUDENT", "TEACHER"],
  },
  {
    label: "Sécurité & accès",
    href: "/dashboard/security",
    icon: "ShieldCheck",
    roles: ["ADMIN"],
  },
  {
    label: "Incidents",
    href: "/dashboard/incidents",
    icon: "AlertTriangle",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: "Bell",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
];
