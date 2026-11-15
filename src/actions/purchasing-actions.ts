"use server";

import { db } from "@/db";
import { purchases, stockMovements, purchaseDeductions, payablePayments, cashTransactions, products } from "@/db/schema";
import { eq, and, or, like, desc } from "drizzle-orm";
import {
  calculatePurchaseWeight,
  calculatePurchaseWeightFromRefaction,
  calculatePurchaseAmount,
  splitDeductions,
} from "@/lib/calculations/purchasing";
import { revalidatePath } from "next/cache";

export async function getPurchasesPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search
    ? and(eq(purchases.purchaseType, "RAW_MATERIAL"), like(purchases.number, `%${search}%`))
    : eq(purchases.purchaseType, "RAW_MATERIAL");
  const data = await db
    .select()
    .from(purchases)
    .where(whereCond)
    .orderBy(desc(purchases.id))
    .limit(limit)
    .offset(offset);
  const all = await db.select().from(purchases).where(whereCond);
  return { data, total: all.length };
}

export async function getFinishedPurchasesPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search
    ? and(eq(purchases.purchaseType, "FINISHED_GOOD"), like(purchases.number, `%${search}%`))
    : eq(purchases.purchaseType, "FINISHED_GOOD");
  const data = await db
    .select({
      id: purchases.id,
      number: purchases.number,
      date: purchases.date,
      productName: products.name,
      productUnit: products.unit,
      netWeight: purchases.netWeight,
      payableWeight: purchases.payableWeight,
      sackCount: purchases.sackCount,
      pricePerKg: purchases.pricePerKg,
      baseAmount: purchases.baseAmount,
      totalDeductions: purchases.totalDeductions,
      totalCosts: purchases.totalCosts,
      netAmount: purchases.netAmount,
      status: purchases.status,
    })
    .from(purchases)
    .leftJoin(products, eq(products.id, purchases.rawMaterialId))
    .where(whereCond)
    .orderBy(desc(purchases.id))
    .limit(limit)
    .offset(offset);

  const all = await db.select({ id: purchases.id }).from(purchases).where(whereCond);
  return { data, total: all.length };
}

export async function getPayablesPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? like(purchases.number, `%${search}%`) : undefined;
  const data = await db
    .select({
      id: purchases.id,
      number: purchases.number,
      date: purchases.date,
      netAmount: purchases.netAmount,
      status: purchases.status,
    })
    .from(purchases)
    .where(whereCond)
    .orderBy(desc(purchases.id))
    .limit(limit)
    .offset(offset);

  const results = await Promise.all(
    data.map(async (p) => {
      const pmts = await db.select().from(payablePayments).where(eq(payablePayments.purchaseId, p.id));
      const paidTotal = pmts.reduce((a, x) => a + Number(x.amount), 0);
      const net = Number(p.netAmount);
      const paymentStatus = paidTotal >= net ? "Lunas" : paidTotal > 0 ? "Sebagian" : "Belum Bayar";
      return { ...p, paidTotal, outstanding: net - paidTotal, paymentStatus, payments: pmts };
    })
  );

  const all = await db.select().from(purchases).where(whereCond);
  return { data: results, total: all.length };
}

export async function recordPayablePayment(purchaseId: number, amount: number, date: string, notes?: string) {
  await db.transaction(async (tx) => {
    await tx.insert(payablePayments).values({
      purchaseId,
      date: new Date(date),
      amount: String(amount),
      notes,
    });
    const pur = (await tx.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1))[0];
    const pmts = await tx.select().from(payablePayments).where(eq(payablePayments.purchaseId, purchaseId));
    const paidTotal = pmts.reduce((a, x) => a + Number(x.amount), 0);
    if (paidTotal >= Number(pur.netAmount)) {
      await tx.update(purchases).set({ status: "Completed" }).where(eq(purchases.id, purchaseId));
    }
    await tx.insert(cashTransactions).values({
      date: new Date(date),
      type: "OUT",
      category: "Pembayaran Supplier",
      description: `Pembayaran hutang pembelian ${pur.number}`,
      amount: String(amount),
    });
  });
  revalidatePath("/purchasing/payables");
  revalidatePath("/finance");
}

export async function getPurchaseById(id: number) {
  const rows = await db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
  if (rows.length === 0) return null;
  const deductions = await db.select().from(purchaseDeductions).where(eq(purchaseDeductions.purchaseId, id));
  return { ...rows[0], deductions };
}

export async function deletePurchase(id: number) {
  const rows = await db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
  if (rows.length === 0) return;
  if (rows[0].status !== "Draft") {
    throw new Error("Transaksi yang telah diposting tidak dapat dihapus langsung.");
  }
  await db.delete(purchases).where(eq(purchases.id, id));
  revalidatePath("/purchasing");
}

export async function updatePurchaseTransaction(
  id: number,
  formData: {
    number: string;
    date: string;
    supplierId: number;
    rawMaterialId: number;
    warehouseId: number;
    grossWeight: number;
    tareWeight: number;
    policeNumber?: string;
    poNumber?: string;
    entryTime?: string;
    exitDate?: string;
    exitTime?: string;
    refactionPercent: number;
    sackCount?: number;
    pricePerKg: number;
    notes?: string;
    deductions?: { deductionTypeId: number; name: string; calculationType: string; impactType?: string; quantity: number; rate: number; amount: number }[];
  }
) {
  const existing = await db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
  if (existing.length === 0) throw new Error("Transaksi tidak ditemukan.");
  if (existing[0].status !== "Draft") {
    throw new Error("Transaksi yang telah diposting tidak dapat diedit langsung.");
  }

  const { netWeight, refactionWeight, payableWeight } = calculatePurchaseWeight(
    formData.grossWeight,
    formData.tareWeight,
    formData.refactionPercent
  );
  const { deductions: totalDeductions, costs: totalCosts } = splitDeductions(formData.deductions ?? []);
  const { baseAmount, netAmount } = calculatePurchaseAmount(
    payableWeight,
    formData.pricePerKg,
    totalDeductions,
    totalCosts
  );

  await db.transaction(async (tx) => {
    await tx.update(purchases).set({
      number: formData.number,
      date: new Date(formData.date),
      supplierId: formData.supplierId,
      rawMaterialId: formData.rawMaterialId,
      warehouseId: formData.warehouseId,
      grossWeight: String(formData.grossWeight),
      tareWeight: String(formData.tareWeight),
      policeNumber: formData.policeNumber || null,
      poNumber: formData.poNumber || null,
      entryTime: formData.entryTime || null,
      exitDate: formData.exitDate ? new Date(formData.exitDate) : null,
      exitTime: formData.exitTime || null,
      netWeight: String(netWeight),
      refactionPercent: String(formData.refactionPercent),
      refactionWeight: String(refactionWeight),
      payableWeight: String(payableWeight),
      sackCount: String(formData.sackCount ?? 0),
      pricePerKg: String(formData.pricePerKg),
      baseAmount: String(baseAmount),
      totalDeductions: String(totalDeductions),
      totalCosts: String(totalCosts),
      netAmount: String(netAmount),
      notes: formData.notes,
    }).where(eq(purchases.id, id));

    await tx.delete(purchaseDeductions).where(eq(purchaseDeductions.purchaseId, id));
    if (formData.deductions && formData.deductions.length > 0) {
      await tx.insert(purchaseDeductions).values(
        formData.deductions.map((d) => ({
          purchaseId: id,
          deductionTypeId: d.deductionTypeId,
          name: d.name,
          calculationType: d.calculationType as any,
          impactType: (d.impactType ?? "SUPPLIER_DEDUCTION") as any,
          quantity: String(d.quantity),
          rate: String(d.rate),
          amount: String(d.amount),
        }))
      );
    }
  });

  revalidatePath("/purchasing");
}

export async function createPurchaseTransaction(formData: {
  number: string;
  purchaseType?: "RAW_MATERIAL" | "FINISHED_GOOD";
  date: string;
  supplierId: number;
  rawMaterialId: number;
  warehouseId: number;
  grossWeight: number;
  tareWeight: number;
  policeNumber?: string;
  poNumber?: string;
  entryTime?: string;
  exitDate?: string;
  exitTime?: string;
  refactionPercent: number;
  /** Bila diisi, rifaksi (Kg) dijadikan acuan dan persentase diturunkan otomatis. */
  refactionWeight?: number;
  sackCount?: number;
  pricePerKg: number;
  notes?: string;
  deductions?: { deductionTypeId: number; name: string; calculationType: string; impactType?: string; quantity: number; rate: number; amount: number }[];
}) {
  const baseWeight = calculatePurchaseWeight(formData.grossWeight, formData.tareWeight, formData.refactionPercent);
  const { netWeight, refactionWeight, refactionPercent, payableWeight } =
    formData.refactionWeight !== undefined && formData.refactionWeight !== null
      ? calculatePurchaseWeightFromRefaction(formData.grossWeight, formData.tareWeight, formData.refactionWeight)
      : { ...baseWeight, refactionPercent: formData.refactionPercent };

  const { deductions: totalDeductions, costs: totalCosts } = splitDeductions(formData.deductions ?? []);
  const { baseAmount, netAmount } = calculatePurchaseAmount(
    payableWeight,
    formData.pricePerKg,
    totalDeductions,
    totalCosts
  );

  await db.transaction(async (tx) => {
    const [res] = await tx.insert(purchases).values({
      number: formData.number,
      purchaseType: formData.purchaseType ?? "RAW_MATERIAL",
      date: new Date(formData.date),
      supplierId: formData.supplierId,
      rawMaterialId: formData.rawMaterialId,
      warehouseId: formData.warehouseId,
      grossWeight: String(formData.grossWeight),
      tareWeight: String(formData.tareWeight),
      policeNumber: formData.policeNumber || null,
      poNumber: formData.poNumber || null,
      entryTime: formData.entryTime || null,
      exitDate: formData.exitDate ? new Date(formData.exitDate) : null,
      exitTime: formData.exitTime || null,
      netWeight: String(netWeight),
      refactionPercent: String(Math.round(refactionPercent * 100) / 100),
      refactionWeight: String(refactionWeight),
      payableWeight: String(payableWeight),
      sackCount: String(formData.sackCount ?? 0),
      pricePerKg: String(formData.pricePerKg),
      baseAmount: String(baseAmount),
      totalDeductions: String(totalDeductions),
      totalCosts: String(totalCosts),
      netAmount: String(netAmount),
      status: "Approved",
      notes: formData.notes,
    });

    const purchaseId = Number(res.insertId);

    if (formData.deductions && formData.deductions.length > 0) {
      await tx.insert(purchaseDeductions).values(
        formData.deductions.map((d) => ({
          purchaseId,
          deductionTypeId: d.deductionTypeId,
          name: d.name,
          calculationType: d.calculationType as any,
          impactType: (d.impactType ?? "SUPPLIER_DEDUCTION") as any,
          quantity: String(d.quantity),
          rate: String(d.rate),
          amount: String(d.amount),
        }))
      );
    }

    // Insert stock movement
    // Get current balance
    const lastMove = await tx.select().from(stockMovements)
      .where(and(eq(stockMovements.warehouseId, formData.warehouseId), eq(stockMovements.productId, formData.rawMaterialId)))
      .orderBy(desc(stockMovements.id))
      .limit(1);

    const prevBalance = lastMove.length > 0 ? Number(lastMove[0].balance) : 0;
    const newBalance = prevBalance + payableWeight;

    await tx.insert(stockMovements).values({
      warehouseId: formData.warehouseId,
      productId: formData.rawMaterialId,
      type: "PURCHASE",
      referenceId: purchaseId,
      qtyIn: String(payableWeight),
      qtyOut: "0",
      balance: String(newBalance),
    });
  });

  revalidatePath("/purchasing");
  revalidatePath("/purchasing/finished");
  revalidatePath("/warehouse");
}
