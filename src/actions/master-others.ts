"use server";

import { db } from "@/db";
import { customers, vehicles, drivers, deductionTypes } from "@/db/schema";
import { eq, or, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Customers
export async function getCustomers() {
  return await db.select().from(customers).where(eq(customers.status, true));
}

export async function getCustomersPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? or(like(customers.name, `%${search}%`), like(customers.code, `%${search}%`)) : undefined;
  const data = await db.select().from(customers).where(whereCond).limit(limit).offset(offset);
  const all = await db.select().from(customers).where(whereCond);
  return { data, total: all.length };
}

export async function getCustomerById(id: number) {
  const res = await db.select().from(customers).where(eq(customers.id, id));
  return res[0] || null;
}

export async function createCustomer(data: typeof customers.$inferInsert) {
  await db.insert(customers).values(data);
  revalidatePath("/master/customers");
}

export async function updateCustomer(id: number, data: Partial<typeof customers.$inferInsert>) {
  await db.update(customers).set(data).where(eq(customers.id, id));
  revalidatePath("/master/customers");
}

export async function deleteCustomer(id: number) {
  await db.update(customers).set({ status: false }).where(eq(customers.id, id));
  revalidatePath("/master/customers");
}

// Vehicles
export async function getVehicles() {
  return await db.select().from(vehicles).where(eq(vehicles.status, true));
}

export async function getVehiclesPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? or(like(vehicles.policeNumber, `%${search}%`), like(vehicles.code, `%${search}%`)) : undefined;
  const data = await db.select().from(vehicles).where(whereCond).limit(limit).offset(offset);
  const all = await db.select().from(vehicles).where(whereCond);
  return { data, total: all.length };
}

export async function getVehicleById(id: number) {
  const res = await db.select().from(vehicles).where(eq(vehicles.id, id));
  return res[0] || null;
}

export async function createVehicle(data: typeof vehicles.$inferInsert) {
  await db.insert(vehicles).values(data);
  revalidatePath("/master/fleet");
}

export async function updateVehicle(id: number, data: Partial<typeof vehicles.$inferInsert>) {
  await db.update(vehicles).set(data).where(eq(vehicles.id, id));
  revalidatePath("/master/fleet");
}

export async function deleteVehicle(id: number) {
  await db.update(vehicles).set({ status: false }).where(eq(vehicles.id, id));
  revalidatePath("/master/fleet");
}

// Drivers
export async function getDrivers() {
  return await db.select().from(drivers).where(eq(drivers.status, true));
}

export async function getDriversPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? or(like(drivers.name, `%${search}%`), like(drivers.code, `%${search}%`)) : undefined;
  const data = await db.select().from(drivers).where(whereCond).limit(limit).offset(offset);
  const all = await db.select().from(drivers).where(whereCond);
  return { data, total: all.length };
}

export async function getDriverById(id: number) {
  const res = await db.select().from(drivers).where(eq(drivers.id, id));
  return res[0] || null;
}

export async function createDriver(data: typeof drivers.$inferInsert) {
  await db.insert(drivers).values(data);
  revalidatePath("/master/fleet");
}

export async function updateDriver(id: number, data: Partial<typeof drivers.$inferInsert>) {
  await db.update(drivers).set(data).where(eq(drivers.id, id));
  revalidatePath("/master/fleet");
}

export async function deleteDriver(id: number) {
  await db.update(drivers).set({ status: false }).where(eq(drivers.id, id));
  revalidatePath("/master/fleet");
}

// Deduction Types
export async function getDeductionTypes() {
  return await db.select().from(deductionTypes).where(eq(deductionTypes.isActive, true));
}

export async function getDeductionTypesPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? or(like(deductionTypes.name, `%${search}%`), like(deductionTypes.code, `%${search}%`)) : undefined;
  const data = await db.select().from(deductionTypes).where(whereCond).limit(limit).offset(offset);
  const all = await db.select().from(deductionTypes).where(whereCond);
  return { data, total: all.length };
}

export async function getDeductionTypeById(id: number) {
  const res = await db.select().from(deductionTypes).where(eq(deductionTypes.id, id));
  return res[0] || null;
}

export async function createDeductionType(data: typeof deductionTypes.$inferInsert) {
  await db.insert(deductionTypes).values(data);
  revalidatePath("/master/deductions");
}

export async function updateDeductionType(id: number, data: Partial<typeof deductionTypes.$inferInsert>) {
  await db.update(deductionTypes).set(data).where(eq(deductionTypes.id, id));
  revalidatePath("/master/deductions");
}

export async function deleteDeductionType(id: number) {
  await db.update(deductionTypes).set({ isActive: false }).where(eq(deductionTypes.id, id));
  revalidatePath("/master/deductions");
}
