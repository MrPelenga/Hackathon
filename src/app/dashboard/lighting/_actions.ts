"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateLightStatus(id: string, status: string) {
  await prisma.streetLight.update({ where: { id }, data: { status: status as never } });
  revalidatePath("/dashboard/lighting");
}

export async function updateLightMode(id: string, mode: string) {
  await prisma.streetLight.update({ where: { id }, data: { mode: mode as never } });
  revalidatePath("/dashboard/lighting");
}
