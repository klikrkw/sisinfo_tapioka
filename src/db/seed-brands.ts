import "dotenv/config";
import { db } from "./index";
import { products } from "./schema";

/**
 * Memecah satu produk jadi menjadi beberapa produk per merek, mis.
 *   "Tepung Tapioka"  ->  "Tepung Tapioka – Cap Roda Mas"
 *                         "Tepung Tapioka – Cap Bunga Surya"
 *
 * Stok, pembelian, dan penjualan dihitung per produk, jadi pemecahan ini
 * membuat laporan stok/penjualan bisa dipisah per merek.
 *
 * Pakai:
 *   npm run db:seed-brands
 *   npm run db:seed-brands -- --base=PRD-002
 *   npm run db:seed-brands -- --brands="Cap Roda Mas,Cap Bunga Surya"
 *   npm run db:seed-brands -- --dry-run
 *
 * Idempotent: produk dengan kode yang sama akan dilewati.
 */

const DEFAULT_BRANDS = ["Cap Roda Mas", "Cap Bunga Surya", "Cap Jago Terbang"];

function argValue(name: string) {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function slugBrand(brand: string) {
  return brand
    .replace(/^cap\s+/i, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCode(baseCode: string, brand: string) {
  const slug = slugBrand(brand);
  const room = 50 - baseCode.length - 1;
  return `${baseCode}-${slug.slice(0, Math.max(room, 1))}`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const brandsArg = argValue("brands");
  const brands = brandsArg
    ? brandsArg.split(",").map((b) => b.trim()).filter(Boolean)
    : DEFAULT_BRANDS;

  const baseCode = argValue("base");
  const all = await db.select().from(products);
  const base = baseCode
    ? all.find((p) => p.code === baseCode)
    : all.filter((p) => p.type === "FINISHED_GOOD").sort((a, b) => a.id - b.id)[0];

  if (!base) {
    console.error(
      baseCode
        ? `Produk dengan kode ${baseCode} tidak ditemukan.`
        : "Belum ada produk jadi (FINISHED_GOOD). Tambahkan dulu di Master → Produk."
    );
    process.exit(1);
  }

  console.log(`Produk dasar : ${base.code} — ${base.name}${base.brand ? ` (${base.brand})` : ""}`);
  console.log(`Merek        : ${brands.join(", ")}`);
  console.log(dryRun ? "Mode DRY-RUN (tidak ada perubahan)" : "Membuat produk per merek...");

  let created = 0;
  let skipped = 0;

  for (const brand of brands) {
    const code = buildCode(base.code, brand);
    const name = `${base.name} – ${brand}`;
    const existing = all.find((p) => p.code === code);

    if (existing) {
      skipped += 1;
      console.log(`  skip    ${code} — sudah ada (${existing.name})`);
      continue;
    }

    if (dryRun) {
      console.log(`  pending ${code} — ${name}`);
      continue;
    }

    await db.insert(products).values({
      code,
      name,
      brand,
      type: base.type,
      unit: base.unit,
      defaultPrice: base.defaultPrice ?? "0",
    });
    created += 1;
    console.log(`  ok      ${code} — ${name}`);
  }

  console.log(
    dryRun
      ? `Dry-run selesai. ${brands.length - skipped} produk akan dibuat.`
      : `Selesai. ${created} dibuat, ${skipped} dilewati.`
  );

  if (created > 0 || dryRun) {
    console.log("\nLangkah lanjutan:");
    console.log("  1. Buka Master → Produk, sesuaikan harga default tiap merek bila berbeda.");
    console.log("  2. Stok lama tetap di produk dasar; pindahkan stok awal per merek lewat");
    console.log("     Warehouse → Penyesuaian (ADJUSTMENT) bila perlu.");
    console.log("  3. Di Pembelian Produk Jadi, pilih produk merek yang sesuai.");
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
