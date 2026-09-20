"use server";

import { db } from "@/db";
import { purchases, suppliers, products, warehouses } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function getDashboardSummary() {
  const [totalPurchases] = await db.select({ count: sql<number>`count(*)` }).from(purchases);
  const [sumPurchases] = await db.select({ total: sql<number>`sum(net_amount)` }).from(purchases);
  const [totalSuppliers] = await db.select({ count: sql<number>`count(*)` }).from(suppliers);
  const [totalProducts] = await db.select({ count: sql<number>`count(*)` }).from(products);

  const recentPurchases = await db
    .select({
      id: purchases.id,
      number: purchases.number,
      date: purchases.date,
      netAmount: purchases.netAmount,
      grossWeight: purchases.grossWeight,
    })
    .from(purchases)
    .orderBy(sql`${purchases.id} DESC`)
    .limit(5);

  return {
    purchaseCount: Number(totalPurchases?.count ?? 0),
    purchaseTotal: Number(sumPurchases?.total ?? 0),
    supplierCount: Number(totalSuppliers?.count ?? 0),
    productCount: Number(totalProducts?.count ?? 0),
    recentPurchases,
  };
}
