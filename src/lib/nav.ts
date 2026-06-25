import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",          href: "/dashboard",         icon: "LayoutDashboard" },
  { label: "IoT",                href: "/dashboard/iot",     icon: "Cpu" },
  { label: "Éclairage",          href: "/dashboard/lighting", icon: "Lightbulb" },
  { label: "Climatisation",      href: "/dashboard/hvac",    icon: "Thermometer" },
  { label: "Énergie",            href: "/dashboard/energy",  icon: "Zap" },
  { label: "Gestion des accès",  href: "/dashboard/access",  icon: "ShieldCheck" },
  { label: "Paramètres",         href: "/dashboard/settings", icon: "Settings" },
];
