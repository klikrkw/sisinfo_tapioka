"use server";

import { db } from "@/db";
import { units } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUnits(includeInactive = false) {
  return await db
    .select()
    .from(units)
    .where(includeInactive ? undefined : eq(units.status, true))
    .orderBy(units.name);
}

export async function getUnitsPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? sql`${units.name} LIKE ${`%${search}%`}` : undefined;
  const data = await db
    .select()
    .from(units)
    .where(whereCond)
    .orderBy(units.name)
    .limit(limit)
    .offset(offset);
  const all = await db.select({ id: units.id }).from(units).where(whereCond);
  return { data, total: all.length };
}

/**
 * Menambah satuan baru dari master produk maupun master satuan.
 * Nama dinormalisasi (trim) dan tidak membuat duplikat.
 */
export async function createUnit(name: string) {
  const clean = (name ?? "").trim();
  if (!clean) throw new Error("Nama satuan wajib diisi.");

  const existing = await db.select().from(units).where(eq(units.name, clean)).limit(1);
  if (existing.length > 0) {
    if (!existing[0].status) {
      await db.update(units).set({ status: true }).where(eq(units.id, existing[0].id));
    }
    revalidatePath("/master/units");
    return { ...existing[0], status: true };
  }

  const [res] = await db.insert(units).values({ name: clean });
  revalidatePath("/master/units");
  return { id: Number(res.insertId), name: clean, status: true };
}

export async function updateUnit(id: number, name: string) {
  const clean = (name ?? "").trim();
  if (!clean) throw new Error("Nama satuan wajib diisi.");
  await db.update(units).set({ name: clean, status: true }).where(eq(units.id, id));
  revalidatePath("/master/units");
}

export async function deleteUnit(id: number) {
  await db.update(units).set({ status: false }).where(eq(units.id, id));
  revalidatePath("/master/units");
}
