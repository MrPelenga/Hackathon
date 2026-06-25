import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  status?: "planned" | "wip";
}

export function ModulePlaceholder({ title, description, icon: Icon, features, status = "planned" }: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <Badge variant={status === "wip" ? "default" : "secondary"} className="text-[10px]">
              {status === "wip" ? "En cours" : "Planifié"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-muted mb-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Module en construction</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Ce module sera développé dans les prochaines itérations. La base de données, les API et la logique métier sont déjà architecturées.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto text-left">
            {features.map((feat, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5">✓</span>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
