import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
  {
    label: "Cours & emploi du temps",
    href: "/dashboard/courses",
    icon: "CalendarDays",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    label: "Parkings",
    href: "/dashboard/parking",
    icon: "ParkingSquare",
    roles: ["ADMIN", "STUDENT"],
  },
  {
    label: "Résidences",
    href: "/dashboard/dorms",
    icon: "BedDouble",
    roles: ["ADMIN", "STUDENT"],
  },
  {
    label: "Affluence",
    href: "/dashboard/affluence",
    icon: "TrendingUp",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    label: "Réservation de salles",
    href: "/dashboard/reservations",
    icon: "BookOpen",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    label: "Gestion des espaces",
    href: "/dashboard/space",
    icon: "LayoutGrid",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    label: "Étudiants & présence",
    href: "/dashboard/students",
    icon: "Users",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    label: "Bâtiments & salles",
    href: "/dashboard/buildings",
    icon: "Building2",
    roles: ["ADMIN", "MAINTENANCE"],
  },
  {
    label: "Climatisation",
    href: "/dashboard/hvac",
    icon: "Thermometer",
    roles: ["ADMIN", "MAINTENANCE"],
  },
  {
    label: "Éclairage",
    href: "/dashboard/lighting",
    icon: "Lightbulb",
    roles: ["ADMIN", "MAINTENANCE"],
  },
  {
    label: "Énergie",
    href: "/dashboard/energy",
    icon: "Zap",
    roles: ["ADMIN"],
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
  {
    label: "Utilisateurs",
    href: "/dashboard/admin/users",
    icon: "UserCog",
    roles: ["ADMIN"],
  },
  {
    label: "Préférences",
    href: "/dashboard/preferences",
    icon: "Settings",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
];
