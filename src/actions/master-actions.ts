"use server";

import { db } from "@/db";
import { suppliers, products, warehouses } from "@/db/schema";
import { eq, or, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";

const CODE_CONFIG: Record<string, { table: string; prefix: string }> = {
  suppliers: { table: "suppliers", prefix: "SUP" },
  products: { table: "products", prefix: "PRD" },
  warehouses: { table: "warehouses", prefix: "WH" },
  customers: { table: "customers", prefix: "CUST" },
  drivers: { table: "drivers", prefix: "DRV" },
  vehicles: { table: "vehicles", prefix: "TRK" },
  deductions: { table: "purchase_deduction_types", prefix: "DED" },
};

export async function getNextMasterCode(entity: string) {
  const cfg = CODE_CONFIG[entity];
  if (!cfg) return null;

  const res = await db.execute<{ code: string }[]>(
    sql.raw(`SELECT \`code\` FROM \`${cfg.table}\` ORDER BY \`id\` DESC`)
  );
  const rows = (res as unknown as { code: string }[][])[0] ?? [];

  let max = 0;
  for (const row of rows) {
    const code = String(row.code ?? "");
    const m = code.match(new RegExp(`^${cfg.prefix}-(\\d+)$`, "i"));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }

  return `${cfg.prefix}-${String(max + 1).padStart(3, "0")}`;
}

export async function getSuppliers() {
  return await db.select().from(suppliers).where(eq(suppliers.status, true));
}

export async function getSuppliersPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? or(like(suppliers.name, `%${search}%`), like(suppliers.code, `%${search}%`)) : undefined;

  const data = await db.select().from(suppliers).where(whereCond).limit(limit).offset(offset);
  const all = await db.select().from(suppliers).where(whereCond);
  return { data, total: all.length };
}

export async function getSupplierById(id: number) {
  const res = await db.select().from(suppliers).where(eq(suppliers.id, id));
  return res[0] || null;
}

export async function createSupplier(data: typeof suppliers.$inferInsert) {
  await db.insert(suppliers).values(data);
  revalidatePath("/master/suppliers");
}

export async function updateSupplier(id: number, data: Partial<typeof suppliers.$inferInsert>) {
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
  revalidatePath("/master/suppliers");
}

export async function deleteSupplier(id: number) {
  await db.update(suppliers).set({ status: false }).where(eq(suppliers.id, id));
  revalidatePath("/master/suppliers");
}

export async function getProducts() {
  return await db.select().from(products).where(eq(products.status, true));
}

export async function getProductsPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? or(like(products.name, `%${search}%`), like(products.code, `%${search}%`)) : undefined;

  const data = await db.select().from(products).where(whereCond).limit(limit).offset(offset);
  const all = await db.select().from(products).where(whereCond);
  return { data, total: all.length };
}

export async function getProductById(id: number) {
  const res = await db.select().from(products).where(eq(products.id, id));
  return res[0] || null;
}

export async function createProduct(data: typeof products.$inferInsert) {
  await db.insert(products).values(data);
  revalidatePath("/master/products");
}

export async function updateProduct(id: number, data: Partial<typeof products.$inferInsert>) {
  await db.update(products).set(data).where(eq(products.id, id));
  revalidatePath("/master/products");
}

export async function deleteProduct(id: number) {
  await db.update(products).set({ status: false }).where(eq(products.id, id));
  revalidatePath("/master/products");
}

// Warehouse
export async function getWarehouses() {
  return await db.select().from(warehouses).where(eq(warehouses.status, true));
}

export async function getWarehousesPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? or(like(warehouses.name, `%${search}%`), like(warehouses.code, `%${search}%`)) : undefined;

  const data = await db.select().from(warehouses).where(whereCond).limit(limit).offset(offset);
  const all = await db.select().from(warehouses).where(whereCond);
  return { data, total: all.length };
}

export async function getWarehouseById(id: number) {
  const res = await db.select().from(warehouses).where(eq(warehouses.id, id));
  return res[0] || null;
}

export async function createWarehouse(data: typeof warehouses.$inferInsert) {
  await db.insert(warehouses).values(data);
  revalidatePath("/master/warehouses");
}

export async function updateWarehouse(id: number, data: Partial<typeof warehouses.$inferInsert>) {
  await db.update(warehouses).set(data).where(eq(warehouses.id, id));
  revalidatePath("/master/warehouses");
}

export async function deleteWarehouse(id: number) {
  await db.update(warehouses).set({ status: false }).where(eq(warehouses.id, id));
  revalidatePath("/master/warehouses");
}
