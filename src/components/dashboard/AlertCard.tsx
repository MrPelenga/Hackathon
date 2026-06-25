import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, Zap, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/types";

interface AlertCardProps {
  type: NotificationType;
  title: string;
  body: string;
  time?: string;
}

const config: Record<NotificationType, { icon: typeof AlertTriangle; className: string }> = {
  INFO: { icon: Info, className: "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 text-blue-800 dark:text-blue-200" },
  WARNING: { icon: AlertTriangle, className: "border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 text-amber-800 dark:text-amber-200" },
  ALERT: { icon: Zap, className: "border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 text-orange-800 dark:text-orange-200" },
  CRITICAL: { icon: ShieldAlert, className: "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 text-red-800 dark:text-red-200" },
};

export function AlertCard({ type, title, body, time }: AlertCardProps) {
  const { icon: Icon, className } = config[type];
  return (
    <Alert className={cn("py-3", className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="text-sm font-medium leading-tight">{title}</AlertTitle>
      <AlertDescription className="text-xs mt-1 text-current/80">
        {body}
        {time && <span className="ml-2 opacity-60">{time}</span>}
      </AlertDescription>
    </Alert>
  );
}
