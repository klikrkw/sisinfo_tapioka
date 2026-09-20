"use server";

import { db } from "@/db";
import {
  productionBatches,
  productionInputs,
  productionOutputs,
  productionCosts,
  stockMovements,
  purchases,
  products,
  productionBatches as batches,
} from "@/db/schema";
import { eq, desc, and, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getLatestHppByProduct() {
  const completed = await db
    .select()
    .from(productionBatches)
    .where(eq(productionBatches.status, "Completed"))
    .orderBy(desc(productionBatches.id));

  const map: Record<number, number> = {};
  for (const batch of completed) {
    const outputs = await db.select().from(productionOutputs).where(eq(productionOutputs.batchId, batch.id));
    const costs = await db.select().from(productionCosts).where(eq(productionCosts.batchId, batch.id));
    if (costs.length === 0 || outputs.length === 0) continue;

    const totalCost = costs.reduce((a, c) => a + Number(c.amount), 0);
    const byVal = outputs.filter((o) => o.isByProduct).reduce((a, o) => a + Number(o.quantity) * Number(o.pricePerUnit), 0);
    const flourQty = outputs.filter((o) => !o.isByProduct).reduce((a, o) => a + Number(o.quantity), 0);
    const hpp = flourQty > 0 ? (totalCost - byVal) / flourQty : 0;

    // only set if not already set (first = latest batch)
    for (const o of outputs.filter((x) => !x.isByProduct)) {
      if (map[o.productId] === undefined) map[o.productId] = hpp;
    }
  }
  return map;
}

export async function getRawMaterialUnitCosts() {
  const raws = await db.select().from(products).where(eq(products.type, "RAW_MATERIAL"));
  const result = [] as { productId: number; name: string; unitCost: number; source: string }[];
  for (const p of raws) {
    const lastPurchase = await db
      .select()
      .from(purchases)
      .where(eq(purchases.rawMaterialId, p.id))
      .orderBy(desc(purchases.id))
      .limit(1);
    const unitCost = lastPurchase.length ? Number(lastPurchase[0].pricePerKg) : Number(p.defaultPrice || 0);
    result.push({
      productId: p.id,
      name: p.name,
      unitCost,
      source: lastPurchase.length ? "Harga beli terakhir" : "Harga default",
    });
  }
  return result;
}

export async function getProductionBatchesPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? like(productionBatches.number, `%${search}%`) : undefined;
  const data = await db
    .select()
    .from(productionBatches)
    .where(whereCond)
    .orderBy(desc(productionBatches.id))
    .limit(limit)
    .offset(offset);
  const all = await db.select().from(productionBatches).where(whereCond);
  return { data, total: all.length };
}

export async function getBatchById(id: number) {
  const rows = await db.select().from(productionBatches).where(eq(productionBatches.id, id)).limit(1);
  if (rows.length === 0) return null;
  const inputs = await db.select().from(productionInputs).where(eq(productionInputs.batchId, id));
  const outputs = await db.select().from(productionOutputs).where(eq(productionOutputs.batchId, id));
  const costs = await db.select().from(productionCosts).where(eq(productionCosts.batchId, id));
  return { ...rows[0], inputs, outputs, costs };
}

export async function createProductionBatch(data: {
  number: string;
  date: string;
  status?: "Draft" | "Processing" | "Completed" | "Cancelled";
  notes?: string;
  inputs: { productId: number; warehouseId: number; quantity: number }[];
  outputs: { productId: number; warehouseId: number; quantity: number; isByProduct: boolean; pricePerUnit: number }[];
  costs: { category: string; name: string; costType: string; amount: number }[];
}) {
  try {
    await db.transaction(async (tx) => {
    // Validate stock for completed batches before posting
    if ((data.status ?? "Completed") === "Completed") {
      for (const input of data.inputs) {
        const last = await tx
          .select()
          .from(stockMovements)
          .where(and(eq(stockMovements.warehouseId, input.warehouseId), eq(stockMovements.productId, input.productId)))
          .orderBy(desc(stockMovements.id))
          .limit(1);
        const available = last.length ? Number(last[0].balance) : 0;
        if (input.quantity > available) {
          throw new Error(
            `Stok tidak mencukupi untuk input produk #${input.productId}: tersedia ${available}, diminta ${input.quantity}`
          );
        }
      }
    }

    const [res] = await tx.insert(productionBatches).values({
      number: data.number,
      date: new Date(data.date),
      status: data.status ?? "Completed",
      notes: data.notes,
    });
    const batchId = Number(res.insertId);

    // Auto-hitung nilai bahan baku dari input dan masukkan sebagai biaya produksi
    let totalInputQty = 0;
    for (const input of data.inputs) {
      totalInputQty += input.quantity;
      const lastPurchase = await tx
        .select()
        .from(purchases)
        .where(eq(purchases.rawMaterialId, input.productId))
        .orderBy(desc(purchases.id))
        .limit(1);
      let unitCost = lastPurchase.length ? Number(lastPurchase[0].pricePerKg) : 0;
      if (!unitCost) {
        const prod = (await tx.select().from(products).where(eq(products.id, input.productId)).limit(1))[0];
        unitCost = Number(prod?.defaultPrice ?? 0);
      }
      const materialAmount = input.quantity * unitCost;
      if (materialAmount > 0) {
        const prod = (await tx.select().from(products).where(eq(products.id, input.productId)).limit(1))[0];
        await tx.insert(productionCosts).values({
          batchId,
          category: "Bahan Baku",
          name: `Bahan Baku - ${prod?.name ?? `#${input.productId}`} (${input.quantity.toLocaleString("id-ID")} Kg × Rp ${unitCost.toLocaleString("id-ID")})`,
          costType: "direct",
          amount: String(materialAmount),
        });
      }
    }

    // Validasi mass balance: total output tidak boleh melebihi total input
    const totalOutputQty = data.outputs.reduce((a, o) => a + o.quantity, 0);
    if (totalOutputQty > totalInputQty) {
      throw new Error(
        `Yield tidak valid: total output (${totalOutputQty} Kg) melebihi total input (${totalInputQty} Kg)`
      );
    }

    for (const input of data.inputs) {
      await tx.insert(productionInputs).values({
        batchId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: String(input.quantity),
      });
    }

    for (const output of data.outputs) {
      await tx.insert(productionOutputs).values({
        batchId,
        productId: output.productId,
        warehouseId: output.warehouseId,
        quantity: String(output.quantity),
        isByProduct: output.isByProduct,
        pricePerUnit: String(output.pricePerUnit),
      });
    }

    for (const cost of data.costs) {
      await tx.insert(productionCosts).values({
        batchId,
        category: cost.category as any,
        name: cost.name,
        costType: cost.costType as any,
        amount: String(cost.amount),
      });
    }

    // Post stock movements only if Completed
    if ((data.status ?? "Completed") === "Completed") {
      for (const input of data.inputs) {
        const last = await tx
          .select()
          .from(stockMovements)
          .where(and(eq(stockMovements.warehouseId, input.warehouseId), eq(stockMovements.productId, input.productId)))
          .orderBy(desc(stockMovements.id))
          .limit(1);
        const prev = last.length ? Number(last[0].balance) : 0;
        await tx.insert(stockMovements).values({
          warehouseId: input.warehouseId,
          productId: input.productId,
          type: "PRODUCTION_USAGE",
          referenceId: batchId,
          qtyIn: "0",
          qtyOut: String(input.quantity),
          balance: String(prev - input.quantity),
        });
      }
      for (const output of data.outputs) {
        const last = await tx
          .select()
          .from(stockMovements)
          .where(and(eq(stockMovements.warehouseId, output.warehouseId), eq(stockMovements.productId, output.productId)))
          .orderBy(desc(stockMovements.id))
          .limit(1);
        const prev = last.length ? Number(last[0].balance) : 0;
        await tx.insert(stockMovements).values({
          warehouseId: output.warehouseId,
          productId: output.productId,
          type: "PRODUCTION_OUTPUT",
          referenceId: batchId,
          qtyIn: String(output.quantity),
          qtyOut: "0",
          balance: String(prev + output.quantity),
        });
      }
    }
    });

    revalidatePath("/production");
    revalidatePath("/warehouse");
    return { success: true };
  } catch (e) {
    console.error("createProductionBatch failed:", e);
    return { success: false, error: e instanceof Error ? e.message : "Terjadi kesalahan tidak diketahui" };
  }
}

export async function deleteProductionBatch(id: number) {
  const rows = await db.select().from(productionBatches).where(eq(productionBatches.id, id)).limit(1);
  if (rows.length === 0) return;
  if (rows[0].status === "Completed") {
    throw new Error("Batch yang telah selesai/diposting tidak dapat dihapus langsung.");
  }
  await db.delete(productionBatches).where(eq(productionBatches.id, id));
  revalidatePath("/production");
}
