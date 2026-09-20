"use server";

import { db } from "@/db";
import { stockMovements, warehouses, products } from "@/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";

export async function getStockBalance(warehouseId: number, productId: number) {
  const last = await db
    .select({ balance: stockMovements.balance })
    .from(stockMovements)
    .where(and(eq(stockMovements.warehouseId, warehouseId), eq(stockMovements.productId, productId)))
    .orderBy(desc(stockMovements.id))
    .limit(1);

  return last.length > 0 ? Number(last[0].balance) : 0;
}

export async function getStockBalances(warehouseId?: number) {
  const rows = await db
    .select({
      warehouseId: stockMovements.warehouseId,
      warehouseName: warehouses.name,
      productId: stockMovements.productId,
      productName: products.name,
      productUnit: products.unit,
      balance: sql<string>`(
        SELECT sm2.balance FROM stock_movements sm2
        WHERE sm2.warehouse_id = ${stockMovements.warehouseId}
          AND sm2.product_id = ${stockMovements.productId}
        ORDER BY sm2.id DESC LIMIT 1
      )`,
      lastMovement: sql<string>`MAX(${stockMovements.createdAt})`,
    })
    .from(stockMovements)
    .leftJoin(warehouses, eq(stockMovements.warehouseId, warehouses.id))
    .leftJoin(products, eq(stockMovements.productId, products.id))
    .where(warehouseId ? eq(stockMovements.warehouseId, warehouseId) : undefined)
    .groupBy(stockMovements.warehouseId, stockMovements.productId);

  return rows;
}

export async function getStockMovements(warehouseId?: number) {
  return await db
    .select({
      id: stockMovements.id,
      date: stockMovements.createdAt,
      warehouseName: warehouses.name,
      productName: products.name,
      type: stockMovements.type,
      qtyIn: stockMovements.qtyIn,
      qtyOut: stockMovements.qtyOut,
      balance: stockMovements.balance,
    })
    .from(stockMovements)
    .leftJoin(warehouses, eq(stockMovements.warehouseId, warehouses.id))
    .leftJoin(products, eq(stockMovements.productId, products.id))
    .where(warehouseId ? eq(stockMovements.warehouseId, warehouseId) : undefined)
    .orderBy(sql`${stockMovements.id} DESC`)
    .limit(50);
}
