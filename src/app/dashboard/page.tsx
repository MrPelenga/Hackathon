export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AdminDashboard from "./_dashboards/AdminDashboard";
import TeacherDashboard from "./_dashboards/TeacherDashboard";
import StudentDashboard from "./_dashboards/StudentDashboard";
import MaintenanceDashboard from "./_dashboards/MaintenanceDashboard";

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-64" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Skeleton className="lg:col-span-2 h-64" />
      <Skeleton className="h-64" />
    </div>
  </div>
);

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const userId = session.user.id;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {role === "ADMIN" && <AdminDashboard />}
      {role === "TEACHER" && <TeacherDashboard userId={userId} />}
      {role === "STUDENT" && <StudentDashboard userId={userId} />}
      {role === "MAINTENANCE" && <MaintenanceDashboard />}
    </Suspense>
  );
}
