import "dotenv/config";
import { db } from "./index";
import {
  stockMovements,
  stockLayers,
  stockLayerUsages,
  purchases,
  productionCosts,
  productionOutputs,
  products,
  saleItems,
} from "./schema";
import { asc, eq } from "drizzle-orm";
import { addStockLayer, consumeStockFifo } from "@/lib/inventory/layers";

/**
 * Membangun layer FIFO dari riwayat pergerakan stok.
 *
 * - Setiap pemasukan (PURCHASE, PRODUCTION_OUTPUT) menjadi satu layer.
 * - Setiap pengeluaran (SALE, PRODUCTION_USAGE) memakai layer paling lama.
 * - HPP item penjualan lama diperbarui dari pemakaian layer.
 *
 * Pakai:
 *   npm run db:backfill-layers -- --dry-run
 *   npm run db:backfill-layers -- --reset      # hapus layer lama lalu bangun ulang
 */

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const reset = process.argv.includes("--reset");

  const existing = await db.select({ id: stockLayers.id }).from(stockLayers).limit(1);
  if (existing.length > 0 && !reset) {
    console.log("Layer sudah ada. Jalankan dengan --reset untuk membangun ulang dari awal.");
    process.exit(0);
  }

  const movements = await db.select().from(stockMovements).orderBy(asc(stockMovements.id));
  const productRows = await db.select().from(products);
  const productDefault = new Map(productRows.map((p) => [p.id, Number(p.defaultPrice || 0)]));
  const allSaleItems = await db.select().from(saleItems);
  const saleItemKey = new Map<string, number>();
  for (const it of allSaleItems) {
    const key = `${it.saleId}:${it.productId}`;
    if (!saleItemKey.has(key)) saleItemKey.set(key, it.id);
  }

  console.log(`Pergerakan stok: ${movements.length}. ${dryRun ? "DRY-RUN" : reset ? "RESET + bangun ulang" : "Bangun layer"}...`);

  if (dryRun) {
    let inflow = 0;
    let outflow = 0;
    for (const mv of movements) {
      if (Number(mv.qtyIn) > 0) inflow += 1;
      if (Number(mv.qtyOut) > 0) outflow += 1;
    }
    console.log(`  layer masuk: ${inflow}, pemakaian: ${outflow}`);
    console.log("Dry-run selesai. Tidak ada perubahan.");
    process.exit(0);
  }

  const batchCostCache = new Map<number, number>();
  const batchHpp = async (batchId: number) => {
    if (batchCostCache.has(batchId)) return batchCostCache.get(batchId)!;
    const costs = await db.select().from(productionCosts).where(eq(productionCosts.batchId, batchId));
    const outputs = await db.select().from(productionOutputs).where(eq(productionOutputs.batchId, batchId));
    const totalCost = costs.reduce((a, c) => a + Number(c.amount), 0);
    const byVal = outputs.filter((o) => o.isByProduct).reduce((a, o) => a + Number(o.quantity) * Number(o.pricePerUnit), 0);
    const mainQty = outputs.filter((o) => !o.isByProduct).reduce((a, o) => a + Number(o.quantity), 0);
    const hpp = mainQty > 0 ? (totalCost - byVal) / mainQty : 0;
    batchCostCache.set(batchId, hpp);
    return hpp;
  };

  let layers = 0;
  let usages = 0;
  let updatedItems = 0;

  await db.transaction(async (tx) => {
    if (reset) {
      await tx.delete(stockLayerUsages);
      await tx.delete(stockLayers);
    }

    const saleItemAmounts = new Map<number, { qty: number; amount: number }>();

    for (const mv of movements) {
      const warehouseId = mv.warehouseId;
      const productId = mv.productId;
      const qtyIn = Number(mv.qtyIn) || 0;
      const qtyOut = Number(mv.qtyOut) || 0;
      const date = mv.createdAt ? new Date(mv.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

      if (qtyIn > 0) {
        let unitCost = 0;
        let sourceType: "PURCHASE" | "PRODUCTION" | "ADJUSTMENT" | "OPENING" = "ADJUSTMENT";
        const sourceId: number | null = mv.referenceId ?? null;
        let sourceNumber: string | null = null;

        if (mv.type === "PURCHASE" && mv.referenceId) {
          const [p] = await tx.select().from(purchases).where(eq(purchases.id, mv.referenceId)).limit(1);
          if (p) {
            const weight = Number(p.payableWeight) || 0;
            unitCost = weight > 0 ? Number(p.netAmount) / weight : Number(p.pricePerKg) || 0;
            sourceType = "PURCHASE";
            sourceNumber = p.number;
          }
        } else if (mv.type === "PRODUCTION_OUTPUT" && mv.referenceId) {
          const outputs = await tx.select().from(productionOutputs).where(eq(productionOutputs.batchId, mv.referenceId));
          const match = outputs.find((x) => x.productId === productId);
          unitCost = match?.isByProduct ? Number(match.pricePerUnit) : await batchHpp(mv.referenceId);
          sourceType = "PRODUCTION";
        } else {
          unitCost = productDefault.get(productId) ?? 0;
          sourceType = "OPENING";
        }

        await addStockLayer(tx, {
          warehouseId,
          productId,
          sourceType,
          sourceId,
          sourceNumber,
          date,
          qty: qtyIn,
          unitCost,
        });
        layers += 1;
      }

      if (qtyOut > 0) {
        const saleItemId = mv.type === "SALE" && mv.referenceId ? saleItemKey.get(`${mv.referenceId}:${productId}`) ?? null : null;
        const result = await consumeStockFifo(tx, {
          warehouseId,
          productId,
          qty: qtyOut,
          date,
          refType: mv.type === "SALE" ? "SALE" : "PRODUCTION_USAGE",
          refId: mv.referenceId,
          saleItemId,
          fallbackUnitCost: productDefault.get(productId) ?? 0,
        });
        usages += result.consumedQty > 0 ? 1 : 0;

        if (saleItemId) {
          const prev = saleItemAmounts.get(saleItemId) ?? { qty: 0, amount: 0 };
          prev.qty += qtyOut;
          prev.amount += result.amount;
          saleItemAmounts.set(saleItemId, prev);
        }
      }
    }

    for (const [saleItemId, agg] of saleItemAmounts) {
      const unitCost = agg.qty > 0 ? agg.amount / agg.qty : 0;
      await tx
        .update(saleItems)
        .set({
          hppPerUnit: String(unitCost),
          hppAmount: String(agg.amount),
          costSource: "FIFO",
        })
        .where(eq(saleItems.id, saleItemId));
      updatedItems += 1;
    }
  });

  console.log(`Selesai. ${layers} layer dibuat, ${usages} pengeluaran dipetakan, ${updatedItems} item penjualan diperbarui.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
