"use server";

import { db } from "@/db";
import { purchases, products, saleItems, sales, stockLayerUsages, stockLayers } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getLatestHppByProduct } from "./production-actions";

/**
 * Sumber harga pokok sebuah produk:
 * - PRODUCTION : HPP dari batch produksi terakhir
 * - PURCHASE   : harga beli rata-rata dari pembelian produk jadi
 * - DEFAULT    : harga default produk (fallback)
 */
export type ProductCostSource = "PRODUCTION" | "PURCHASE" | "DEFAULT";

export type ProductCost = {
  unitCost: number;
  source: ProductCostSource;
  label: string;
  productionCost: number | null;
  purchaseCost: number | null;
  purchaseCount: number;
  lastPurchaseDate: string | null;
};

/**
 * Harga pokok per produk (per Kg).
 *
 * Prioritas: HPP produksi -> harga beli produk jadi -> harga default.
 * Harga beli dihitung sebagai rata-rata tertimbang:
 *   total nilai pembelian (setelah potongan + biaya tambahan) / total berat dibayar
 * sehingga potongan supplier dan biaya (mis. manol fee) ikut menjadi HPP.
 */
export async function getProductUnitCosts(): Promise<Record<number, ProductCost>> {
  const productionMap = await getLatestHppByProduct();

  const purchaseRows = await db
    .select({
      productId: purchases.rawMaterialId,
      amount: sql<string>`COALESCE(SUM(${purchases.netAmount}), 0)`,
      weight: sql<string>`COALESCE(SUM(${purchases.payableWeight}), 0)`,
      count: sql<number>`COUNT(*)`,
      lastDate: sql<string | null>`MAX(${purchases.date})`,
    })
    .from(purchases)
    .where(
      and(
        eq(purchases.purchaseType, "FINISHED_GOOD"),
        sql`COALESCE(${purchases.status}, '') <> 'Cancelled'`
      )
    )
    .groupBy(purchases.rawMaterialId);

  const purchaseMap = new Map<
    number,
    { cost: number; count: number; lastDate: string | null }
  >();
  for (const row of purchaseRows) {
    const weight = Number(row.weight) || 0;
    const amount = Number(row.amount) || 0;
    if (weight <= 0) continue;
    purchaseMap.set(Number(row.productId), {
      cost: amount / weight,
      count: Number(row.count) || 0,
      lastDate: row.lastDate ? String(row.lastDate) : null,
    });
  }

  const allProducts = await db.select().from(products);
  const map: Record<number, ProductCost> = {};

  for (const p of allProducts) {
    const production = Number(productionMap[p.id] ?? 0);
    const purchase = purchaseMap.get(p.id);
    const fallback = Number(p.defaultPrice || 0);

    const productionCost = production > 0 ? production : null;
    const purchaseCost = purchase && purchase.cost > 0 ? purchase.cost : null;

    let unitCost = 0;
    let source: ProductCostSource = "DEFAULT";
    let label = "Harga default produk";

    if (productionCost !== null) {
      unitCost = productionCost;
      source = "PRODUCTION";
      label = "HPP produksi batch terakhir";
    } else if (purchaseCost !== null) {
      unitCost = purchaseCost;
      source = "PURCHASE";
      label = "Harga beli rata-rata (pembelian produk jadi)";
    } else if (fallback > 0) {
      unitCost = fallback;
      source = "DEFAULT";
    } else {
      continue;
    }

    map[p.id] = {
      unitCost,
      source,
      label,
      productionCost,
      purchaseCost,
      purchaseCount: purchase?.count ?? 0,
      lastPurchaseDate: purchase?.lastDate ?? null,
    };
  }

  return map;
}

/**
 * HPP barang yang benar-benar terjual dari pembelian produk jadi.
 * Produk yang punya HPP produksi tidak dihitung di sini karena biayanya
 * sudah masuk ke total biaya produksi pada laporan laba/rugi.
 */
export async function getPurchasedFinishedCogs(productId?: number) {
  const costMap = await getProductUnitCosts();

  const items = await db
    .select({
      id: saleItems.id,
      productId: saleItems.productId,
      productName: products.name,
      quantity: saleItems.quantity,
      subtotal: saleItems.subtotal,
      itemHppPerUnit: saleItems.hppPerUnit,
      itemHppAmount: saleItems.hppAmount,
      itemCostSource: saleItems.costSource,
    })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .leftJoin(products, eq(products.id, saleItems.productId))
    .where(
      and(
        sql`COALESCE(${sales.status}, '') <> 'Cancelled'`,
        productId ? eq(saleItems.productId, productId) : sql`1 = 1`
      )
    );

  // Pemakaian layer FIFO per item penjualan, dipisah asal layernya.
  const usages = await db
    .select({
      saleItemId: stockLayerUsages.saleItemId,
      amount: stockLayerUsages.amount,
      layerSource: stockLayers.sourceType,
    })
    .from(stockLayerUsages)
    .innerJoin(stockLayers, eq(stockLayers.id, stockLayerUsages.layerId))
    .where(eq(stockLayerUsages.refType, "SALE"));

  const usageByItem = new Map<number, { amount: number; purchased: number }>();
  for (const u of usages) {
    if (u.saleItemId === null) continue;
    const key = Number(u.saleItemId);
    const row = usageByItem.get(key) ?? { amount: 0, purchased: 0 };
    row.amount += Number(u.amount) || 0;
    if (u.layerSource === "PURCHASE") row.purchased += Number(u.amount) || 0;
    usageByItem.set(key, row);
  }

  let cogs = 0;
  const details = items
    .map((r) => {
      const qty = Number(r.quantity) || 0;
      const revenue = Number(r.subtotal) || 0;
      const usage = usageByItem.get(r.id);

      let unitCost: number;
      let itemCost: number;
      let purchasedCost: number;

      if (usage) {
        itemCost = usage.amount;
        purchasedCost = usage.purchased;
        unitCost = qty > 0 ? itemCost / qty : Number(r.itemHppPerUnit) || 0;
      } else if (r.itemCostSource === "PURCHASE") {
        // Data lama: snapshot harga beli rata-rata.
        unitCost = Number(r.itemHppPerUnit) || 0;
        itemCost = Number(r.itemHppAmount) || qty * unitCost;
        purchasedCost = itemCost;
      } else if (!r.itemCostSource) {
        // Data lama tanpa snapshot: estimasi HPP terkini.
        const cost = costMap[Number(r.productId)];
        if (!cost) return null;
        unitCost = cost.unitCost;
        itemCost = qty * unitCost;
        purchasedCost = cost.source === "PURCHASE" ? itemCost : 0;
      } else {
        // Diproduksi sendiri: sudah tercakup biaya produksi.
        return null;
      }

      cogs += purchasedCost;
      return {
        productName: r.productName ?? `#${r.productId}`,
        quantity: qty,
        unitCost,
        cogs: purchasedCost,
        revenue,
        margin: revenue - itemCost,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return { cogs, details };
}
