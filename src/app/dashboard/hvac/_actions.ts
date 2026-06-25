"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateHvacMode(id: string, mode: string) {
  await prisma.hvacUnit.update({ where: { id }, data: { mode: mode as never } });
  revalidatePath("/dashboard/hvac");
}

export async function updateHvacTemperature(id: string, setTemperature: number) {
  await prisma.hvacUnit.update({ where: { id }, data: { setTemperature } });
  revalidatePath("/dashboard/hvac");
}
