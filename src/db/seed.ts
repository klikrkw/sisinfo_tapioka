import "dotenv/config";
import { db } from "./index";
import { roles, permissions, rolePermissions, users } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const ROLE_NAMES = [
  "Super Admin",
  "Admin",
  "Pembelian",
  "Gudang",
  "Produksi",
  "Penjualan",
  "Keuangan",
  "Manager",
  "Direktur",
];

const PERMISSION_NAMES = [
  "purchase.view", "purchase.create", "purchase.update", "purchase.delete", "purchase.approve",
  "warehouse.view", "warehouse.create", "warehouse.adjust",
  "production.view", "production.create", "production.approve",
  "sales.view", "sales.create", "sales.update", "sales.delete",
  "finance.view", "finance.create", "finance.approve",
  "report.view",
  "master.view", "master.manage",
  "user.manage",
];

async function main() {
  // Seed roles
  for (const name of ROLE_NAMES) {
    const existing = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    if (existing.length === 0) await db.insert(roles).values({ name });
  }

  // Seed permissions
  for (const name of PERMISSION_NAMES) {
    const existing = await db.select().from(permissions).where(eq(permissions.name, name)).limit(1);
    if (existing.length === 0) await db.insert(permissions).values({ name });
  }

  // Super Admin gets all permissions
  const superAdmin = (await db.select().from(roles).where(eq(roles.name, "Super Admin")).limit(1))[0];
  const allPerms = await db.select().from(permissions);
  const existingRP = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, superAdmin.id));
  for (const p of allPerms) {
    if (!existingRP.some((rp) => rp.permissionId === p.id)) {
      await db.insert(rolePermissions).values({ roleId: superAdmin.id, permissionId: p.id });
    }
  }

  // Seed admin user
  const adminExists = await db.select().from(users).where(eq(users.email, "admin@tapioka.id")).limit(1);
  if (adminExists.length === 0) {
    await db.insert(users).values({
      name: "Administrator",
      email: "admin@tapioka.id",
      password: await bcrypt.hash("admin123", 10),
      roleId: superAdmin.id,
    });
  }

  console.log("Seed selesai. Login: admin@tapioka.id / admin123");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
