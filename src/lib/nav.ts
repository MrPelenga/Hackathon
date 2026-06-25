import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",          href: "/dashboard",          icon: "LayoutDashboard" },
  { label: "IoT",                href: "/dashboard/iot",      icon: "Cpu" },
  { label: "Éclairage",          href: "/dashboard/lighting", icon: "Lightbulb" },
  { label: "Climatisation",      href: "/dashboard/hvac",     icon: "Thermometer" },
  { label: "Énergie",            href: "/dashboard/energy",   icon: "Zap" },
  { label: "Contrôle d'accès",   href: "/dashboard/access",   icon: "ShieldCheck" },
];
