"use server";

import { db } from "@/db";
import { brands, saleItems, sales } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBrands(includeInactive = false) {
  return await db
    .select()
    .from(brands)
    .where(includeInactive ? undefined : eq(brands.status, true))
    .orderBy(brands.name);
}

export async function getBrandsPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? sql`${brands.name} LIKE ${`%${search}%`}` : undefined;
  const data = await db
    .select()
    .from(brands)
    .where(whereCond)
    .orderBy(brands.name)
    .limit(limit)
    .offset(offset);
  const all = await db.select({ id: brands.id }).from(brands).where(whereCond);
  return { data, total: all.length };
}

/**
 * Menambah merek baru dari form penjualan maupun master.
 * Nama dinormalisasi (trim). Bila sudah ada, mengembalikan data yang ada
 * (tidak membuat duplikat) agar aman dipakai dari select "tambah merek".
 */
export async function createBrand(name: string) {
  const clean = (name ?? "").trim();
  if (!clean) throw new Error("Nama merek wajib diisi.");

  const existing = await db.select().from(brands).where(eq(brands.name, clean)).limit(1);
  if (existing.length > 0) {
    if (!existing[0].status) {
      await db.update(brands).set({ status: true }).where(eq(brands.id, existing[0].id));
    }
    revalidatePath("/master/brands");
    return { ...existing[0], status: true };
  }

  const [res] = await db.insert(brands).values({ name: clean });
  revalidatePath("/master/brands");
  return { id: Number(res.insertId), name: clean, status: true };
}

export async function updateBrand(id: number, name: string) {
  const clean = (name ?? "").trim();
  if (!clean) throw new Error("Nama merek wajib diisi.");
  await db.update(brands).set({ name: clean, status: true }).where(eq(brands.id, id));
  revalidatePath("/master/brands");
}

export async function deleteBrand(id: number) {
  const used = await db.select({ id: saleItems.id }).from(saleItems).where(eq(saleItems.brandId, id)).limit(1);
  if (used.length > 0) {
    // Merek yang sudah dipakai transaksi dinonaktifkan agar riwayat tetap utuh.
    await db.update(brands).set({ status: false }).where(eq(brands.id, id));
  } else {
    await db.delete(brands).where(eq(brands.id, id));
  }
  revalidatePath("/master/brands");
}

/** Rekap penjualan per merek untuk laporan (memakai snapshot nama merek). */
export async function getSalesByBrand() {
  const rows = await db
    .select({
      brandName: sql<string>`COALESCE(NULLIF(${saleItems.brandName}, ''), 'Tanpa merek')`,
      quantity: sql<string>`SUM(${saleItems.quantity})`,
      weight: sql<string>`COALESCE(SUM(${saleItems.totalWeight}), 0)`,
      revenue: sql<string>`SUM(${saleItems.subtotal})`,
      hpp: sql<string>`COALESCE(SUM(${saleItems.hppAmount}), 0)`,
      transactions: sql<number>`COUNT(DISTINCT ${sales.id})`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .where(and(sql`COALESCE(${sales.status}, '') <> 'Cancelled'`))
    .groupBy(sql`COALESCE(NULLIF(${saleItems.brandName}, ''), 'Tanpa merek')`)
    .orderBy(sql`SUM(${saleItems.subtotal}) DESC`);

  return rows.map((r) => {
    const revenue = Number(r.revenue) || 0;
    const hpp = Number(r.hpp) || 0;
    return {
      brandName: r.brandName,
      quantity: Number(r.quantity) || 0,
      weight: Number(r.weight) || 0,
      revenue,
      hpp,
      margin: revenue - hpp,
      transactions: Number(r.transactions) || 0,
    };
  });
}
