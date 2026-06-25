export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { Bell } from "lucide-react";
import type { NotificationType } from "@/types";

async function NotificationsOverview() {
  // In a real app, this would be filtered by the logged-in user's ID
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications & Alertes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{unread} non lue(s)</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Toutes les notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.map((notif) => (
            <div key={notif.id} className={`transition-opacity ${notif.isRead ? "opacity-60" : ""}`}>
              <AlertCard
                type={notif.type as NotificationType}
                title={notif.title}
                body={notif.body}
                time={new Date(notif.createdAt).toLocaleString("fr-FR", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
              />
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucune notification.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function NotificationsPage() {
  return <NotificationsOverview />;
}
