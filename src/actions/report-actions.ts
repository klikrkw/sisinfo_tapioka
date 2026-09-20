"use server";

import { db } from "@/db";
import { sales, purchases, productionCosts, productionOutputs, expenses, shipmentCosts, fuelTransactions, saleItems } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function getProfitLoss(productId?: number) {
  const salesWhere = productId
    ? sql`${sales.status} != 'Cancelled' AND ${sales.id} IN (SELECT ${saleItems.saleId} FROM ${saleItems} WHERE ${saleItems.productId} = ${productId})`
    : sql`${sales.status} != 'Cancelled'`;

  const [salesAgg] = await db.select({
    totalSales: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(sales).where(salesWhere);

  const [purchaseAgg] = await db.select({
    total: sql<number>`COALESCE(SUM(${purchases.netAmount}), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(purchases);

  const prodCostWhere = productId
    ? sql`${productionCosts.batchId} IN (SELECT ${productionOutputs.batchId} FROM ${productionOutputs} WHERE ${productionOutputs.productId} = ${productId})`
    : undefined;

  const [prodCostAgg] = await db.select({
    total: sql<number>`COALESCE(SUM(${productionCosts.amount}), 0)`,
  }).from(productionCosts).where(prodCostWhere);

  const byProductWhere = productId
    ? sql`${productionOutputs.isByProduct} = true AND ${productionOutputs.batchId} IN (SELECT ${productionOutputs.batchId} FROM ${productionOutputs} WHERE ${productionOutputs.productId} = ${productId})`
    : eq(productionOutputs.isByProduct, true);

  const [byProductAgg] = await db.select({
    total: sql<number>`COALESCE(SUM(${productionOutputs.quantity} * ${productionOutputs.pricePerUnit}), 0)`,
  }).from(productionOutputs).where(byProductWhere);

  const flourQtyWhere = productId
    ? sql`${productionOutputs.isByProduct} = false AND ${productionOutputs.productId} = ${productId}`
    : eq(productionOutputs.isByProduct, false);

  const [flourQtyAgg] = await db.select({
    total: sql<number>`COALESCE(SUM(${productionOutputs.quantity}), 0)`,
  }).from(productionOutputs).where(flourQtyWhere);

  const [expenseAgg] = await db.select({
    total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
  }).from(expenses);

  const [shipmentCostAgg] = await db.select({
    total: sql<number>`COALESCE(SUM(${shipmentCosts.amount}), 0)`,
  }).from(shipmentCosts);

  const [fuelAgg] = await db.select({
    total: sql<number>`COALESCE(SUM(${fuelTransactions.total}), 0)`,
  }).from(fuelTransactions);

  const totalSales = Number(salesAgg?.totalSales ?? 0);
  const totalPurchases = Number(purchaseAgg?.total ?? 0);
  const totalProdCost = Number(prodCostAgg?.total ?? 0);
  const byProductValue = Number(byProductAgg?.total ?? 0);
  const flourQty = Number(flourQtyAgg?.total ?? 0);
  const totalExpenses = Number(expenseAgg?.total ?? 0);
  const totalShipmentCost = Number(shipmentCostAgg?.total ?? 0);
  const totalFuel = Number(fuelAgg?.total ?? 0);

  const netProdCost = totalProdCost - byProductValue;
  const hppPerKg = flourQty > 0 ? netProdCost / flourQty : 0;
  const grossProfit = totalSales - netProdCost;
  const totalDistribution = totalShipmentCost + totalFuel;
  const totalOperating = totalExpenses + totalDistribution;
  const netProfit = grossProfit - totalOperating;

  return {
    totalSales,
    salesCount: Number(salesAgg?.count ?? 0),
    totalPurchases,
    purchaseCount: Number(purchaseAgg?.count ?? 0),
    totalProdCost,
    byProductValue,
    flourQty,
    netProdCost,
    hppPerKg,
    grossProfit,
    totalDistribution,
    totalExpenses,
    totalOperating,
    netProfit,
  };
}

export async function getPurchaseSummary() {
  const rows = await db
    .select({
      id: purchases.id,
      number: purchases.number,
      date: purchases.date,
      grossWeight: purchases.grossWeight,
      payableWeight: purchases.payableWeight,
      netAmount: purchases.netAmount,
      status: purchases.status,
    })
    .from(purchases)
    .orderBy(sql`${purchases.id} DESC`)
    .limit(50);
  const total = rows.reduce((a, r) => a + Number(r.netAmount), 0);
  const totalWeight = rows.reduce((a, r) => a + Number(r.payableWeight), 0);
  return { rows, total, totalWeight };
}

export async function getSalesSummary() {
  const rows = await db
    .select({
      id: sales.id,
      number: sales.number,
      date: sales.date,
      paymentMethod: sales.paymentMethod,
      totalAmount: sales.totalAmount,
      status: sales.status,
    })
    .from(sales)
    .orderBy(sql`${sales.id} DESC`)
    .limit(50);
  const total = rows.reduce((a, r) => a + Number(r.totalAmount), 0);
  return { rows, total };
}
