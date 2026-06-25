import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  color?: "default" | "green" | "yellow" | "red" | "blue";
  className?: string;
}

const colorMap = {
  default: "bg-muted text-foreground",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  yellow: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

const iconBg = {
  default: "bg-muted",
  green: "bg-emerald-100 dark:bg-emerald-900",
  yellow: "bg-amber-100 dark:bg-amber-900",
  red: "bg-red-100 dark:bg-red-900",
  blue: "bg-blue-100 dark:bg-blue-900",
};

export function StatCard({ title, value, sub, icon: Icon, color = "default", className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconBg[color])}>
          <Icon className={cn("h-5 w-5", colorMap[color].split(" ").slice(1).join(" "))} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold leading-tight tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
