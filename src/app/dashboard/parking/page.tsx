export const dynamic = "force-dynamic";
import { ParkingSquare } from "lucide-react";
import { ModulePlaceholder } from "../_placeholder/ModulePlaceholder";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

async function ParkingOverview() {
  const lots = await prisma.parkingLot.findMany({
    include: { spots: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parkings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">État en temps réel des parkings du campus</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lots.map((lot) => {
          const total = lot.spots.length;
          const free = lot.spots.filter((s) => s.status === "FREE").length;
          const occupied = lot.spots.filter((s) => s.status === "OCCUPIED").length;
          const reserved = lot.spots.filter((s) => s.status === "RESERVED").length;
          const disabled = lot.spots.filter((s) => s.type === "DISABLED").length;
          const electric = lot.spots.filter((s) => s.type === "ELECTRIC").length;
          const rate = total > 0 ? Math.round(((total - free) / total) * 100) : 0;

          return (
            <Card key={lot.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{lot.name}</CardTitle>
                  <Badge variant={lot.isOpen ? "outline" : "destructive"} className="text-[10px] shrink-0">
                    {lot.isOpen ? "Ouvert" : "Fermé"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taux d&apos;occupation</span>
                  <span className="font-semibold tabular-nums">{rate}%</span>
                </div>
                <Progress value={rate} className={`h-2 ${rate > 85 ? "[&>div]:bg-red-500" : rate > 65 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`} />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md bg-emerald-50 dark:bg-emerald-950 p-2">
                    <p className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">{free}</p>
                    <p className="text-emerald-600 dark:text-emerald-400">Libres</p>
                  </div>
                  <div className="rounded-md bg-red-50 dark:bg-red-950 p-2">
                    <p className="font-bold text-red-700 dark:text-red-300 text-lg">{occupied}</p>
                    <p className="text-red-600 dark:text-red-400">Occupées</p>
                  </div>
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-2">
                    <p className="font-bold text-amber-700 dark:text-amber-300 text-lg">{reserved}</p>
                    <p className="text-amber-600 dark:text-amber-400">Réservées</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>PMR : {disabled}</span>
                  <span>·</span>
                  <span>Électrique : {electric}</span>
                  <span>·</span>
                  <span>Total : {total}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Fonctionnalités à venir : carte interactive des places, réservation en ligne, historique d&apos;occupation, alertes parking plein.
        </CardContent>
      </Card>
    </div>
  );
}

export default function ParkingPage() {
  return <ParkingOverview />;
}
