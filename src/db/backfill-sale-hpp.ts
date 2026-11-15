import "dotenv/config";
import { db } from "./index";
import { saleItems } from "./schema";
import { eq, isNull } from "drizzle-orm";
import { getProductUnitCosts } from "@/actions/costing-actions";

/**
 * Mengisi HPP pada item penjualan lama yang belum punya snapshot HPP.
 *
 * Nilai yang diisi memakai HPP terkini (produksi/pembelian) sebagai estimasi.
 * Item yang sudah punya snapshot (cost_source terisi) tidak diubah.
 *
 * Pakai:
 *   npm run db:backfill-hpp -- --dry-run
 *   npm run db:backfill-hpp
 */

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const costs = await getProductUnitCosts();
  const rows = await db.select().from(saleItems).where(isNull(saleItems.costSource));

  if (rows.length === 0) {
    console.log("Semua item penjualan sudah punya snapshot HPP. Tidak ada yang perlu diisi.");
    process.exit(0);
  }

  console.log(dryRun ? "Mode DRY-RUN (tidak ada perubahan)" : "Mengisi HPP item penjualan lama...");

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const cost = costs[row.productId];
    if (!cost) {
      skipped += 1;
      console.log(`  skip    sale_item#${row.id} (HPP produk #${row.productId} belum tersedia)`);
      continue;
    }
    const qty = Number(row.quantity) || 0;
    const amount = qty * cost.unitCost;

    if (dryRun) {
      console.log(
        `  pending sale_item#${row.id} produk #${row.productId} — ${cost.source} Rp ${Math.round(cost.unitCost).toLocaleString("id-ID")}/unit`
      );
      continue;
    }

    await db
      .update(saleItems)
      .set({
        hppPerUnit: String(cost.unitCost),
        hppAmount: String(amount),
        costSource: cost.source,
      })
      .where(eq(saleItems.id, row.id));
    updated += 1;
  }

  console.log(
    dryRun
      ? `Dry-run selesai. ${rows.length - skipped} item akan diisi.`
      : `Selesai. ${updated} item diisi, ${skipped} dilewati.`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
