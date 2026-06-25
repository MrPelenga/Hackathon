import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";
import { can, type Module, type Action } from "./permissions";

export interface SessionUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) redirect("/dashboard?forbidden=1");
  return user;
}

export async function requirePermission(module: Module, action: Action): Promise<SessionUser> {
  const user = await requireAuth();
  if (!can(user.role, module, action)) redirect("/dashboard?forbidden=1");
  return user;
}
