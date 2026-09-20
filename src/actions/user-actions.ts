"use server";

import { db } from "@/db";
import { users, roles, permissions, rolePermissions } from "@/db/schema";
import { eq, or, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getUsersPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)) : undefined;

  const data = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
      roleId: users.roleId,
      roleName: roles.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(whereCond)
    .limit(limit)
    .offset(offset);

  const all = await db.select().from(users).where(whereCond);
  return { data, total: all.length };
}

export async function getUserById(id: number) {
  const res = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return res[0] || null;
}

export async function getRoles() {
  return await db.select().from(roles);
}

export async function createUser(data: { name: string; email: string; password: string; roleId: number }) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: passwordHash,
    roleId: data.roleId,
  });
  revalidatePath("/settings/users");
}

export async function updateUser(
  id: number,
  data: { name: string; email: string; roleId: number; password?: string; status?: boolean }
) {
  const updateData: Partial<typeof users.$inferInsert> = {
    name: data.name,
    email: data.email,
    roleId: data.roleId,
  };
  if (data.password) updateData.password = await bcrypt.hash(data.password, 10);
  if (typeof data.status === "boolean") updateData.status = data.status;

  await db.update(users).set(updateData).where(eq(users.id, id));
  revalidatePath("/settings/users");
}

export async function deleteUser(id: number) {
  await db.update(users).set({ status: false }).where(eq(users.id, id));
  revalidatePath("/settings/users");
}

export async function getRolePermissions() {
  return await db
    .select({
      roleId: rolePermissions.roleId,
      permissionId: rolePermissions.permissionId,
      permissionName: permissions.name,
      roleName: roles.name,
    })
    .from(rolePermissions)
    .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .leftJoin(roles, eq(rolePermissions.roleId, roles.id));
}

export async function getAllPermissions() {
  return await db.select().from(permissions);
}

export async function setRolePermissions(roleId: number, permissionIds: number[]) {
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  if (permissionIds.length > 0) {
    await db.insert(rolePermissions).values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
  }
  revalidatePath("/settings/users");
}
