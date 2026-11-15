import { db } from "@/db";
import { stockLayers, stockLayerUsages } from "@/db/schema";
import { and, asc, eq, gt } from "drizzle-orm";
import { consumeFifoLayers } from "./fifo";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type LayerInput = {
  warehouseId: number;
  productId: number;
  sourceType: "PURCHASE" | "PRODUCTION" | "ADJUSTMENT" | "OPENING";
  sourceId?: number | null;
  sourceNumber?: string | null;
  date: string;
  qty: number;
  unitCost: number;
};

/** Mencatat satu layer pemasukan stok beserta harga pokok per unit. */
export async function addStockLayer(tx: Tx, input: LayerInput) {
  const qty = Math.max(input.qty || 0, 0);
  if (qty <= 0) return null;

  const unitCost = Math.max(input.unitCost || 0, 0);
  const [res] = await tx.insert(stockLayers).values({
    warehouseId: input.warehouseId,
    productId: input.productId,
    sourceType: input.sourceType,
    sourceId: input.sourceId ?? null,
    sourceNumber: input.sourceNumber ?? null,
    date: new Date(input.date),
    qtyIn: String(qty),
    qtyRemaining: String(qty),
    unitCost: String(unitCost),
  });

  return { id: Number(res.insertId), qty, unitCost };
}

export type ConsumeInput = {
  warehouseId: number;
  productId: number;
  qty: number;
  date: string;
  refType: "SALE" | "PRODUCTION_USAGE" | "ADJUSTMENT";
  refId?: number | null;
  saleItemId?: number | null;
  /** Dipakai bila stok tidak tercakup layer (data lama). */
  fallbackUnitCost?: number;
};

/**
 * Mengeluarkan stok dengan FIFO: layer paling lama dipakai lebih dulu.
 * Mengembalikan harga pokok rata-rata dari layer yang terpakai.
 */
export async function consumeStockFifo(tx: Tx, input: ConsumeInput) {
  const qty = Math.max(input.qty || 0, 0);
  if (qty <= 0) {
    return { unitCost: 0, amount: 0, consumedQty: 0, shortfall: 0 };
  }

  const layers = await tx
    .select()
    .from(stockLayers)
    .where(
      and(
        eq(stockLayers.warehouseId, input.warehouseId),
        eq(stockLayers.productId, input.productId),
        gt(stockLayers.qtyRemaining, "0")
      )
    )
    .orderBy(asc(stockLayers.date), asc(stockLayers.id));

  const result = consumeFifoLayers(
    layers.map((l) => ({
      id: l.id,
      qtyRemaining: Number(l.qtyRemaining),
      unitCost: Number(l.unitCost),
    })),
    qty
  );

  for (const usage of result.usages) {
    const layer = layers.find((l) => l.id === usage.layerId);
    const nextRemaining = Math.max(Number(layer?.qtyRemaining ?? 0) - usage.qty, 0);

    await tx
      .update(stockLayers)
      .set({ qtyRemaining: String(nextRemaining) })
      .where(eq(stockLayers.id, usage.layerId));

    await tx.insert(stockLayerUsages).values({
      layerId: usage.layerId,
      warehouseId: input.warehouseId,
      productId: input.productId,
      date: new Date(input.date),
      qty: String(usage.qty),
      unitCost: String(usage.unitCost),
      amount: String(usage.amount),
      refType: input.refType,
      refId: input.refId ?? null,
      saleItemId: input.saleItemId ?? null,
    });
  }

  // Sisa yang tidak punya layer dihargai memakai fallback (HPP terkini).
  const fallback = Math.max(input.fallbackUnitCost || 0, 0);
  const shortfallAmount = result.shortfall * fallback;
  const totalQty = result.consumedQty + result.shortfall;
  const totalAmount = result.totalAmount + shortfallAmount;

  return {
    unitCost: totalQty > 0 ? totalAmount / totalQty : fallback,
    amount: totalAmount,
    consumedQty: result.consumedQty,
    shortfall: result.shortfall,
  };
}
