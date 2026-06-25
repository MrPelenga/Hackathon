import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
  {
    label: "IoT",
    href: "/dashboard/iot",
    icon: "Cpu",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
  {
    label: "Éclairage",
    href: "/dashboard/lighting",
    icon: "Lightbulb",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
  {
    label: "Climatisation",
    href: "/dashboard/hvac",
    icon: "Thermometer",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
  {
    label: "Énergie",
    href: "/dashboard/energy",
    icon: "Zap",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
  {
    label: "Gestion des accès",
    href: "/dashboard/access",
    icon: "ShieldCheck",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    icon: "Settings",
    roles: ["ADMIN", "TEACHER", "STUDENT", "MAINTENANCE"],
  },
];
