# Merek Produk (Brand)

Dokumen ini menjelaskan dua cara memakai merek pada produk jadi, mis. **Tepung Tapioka "Cap Roda Mas"**,
"Cap Bunga Surya", dan "Cap Jago Terbang", serta kapan sebaiknya memecah produk per merek.

## 1. Merek sebagai atribut produk (cukup untuk identitas produk)

- Isi **Master → Merek** untuk daftar merek (dipakai di penjualan).
- Isi **Master → Produk → Edit → Merek / Brand** untuk menandai merek produk.
- Merek produk tampil di daftar produk; **pembelian tidak memakai field merek**
  (merek pada pembelian diambil dari produk yang dipilih, tidak diinput manual).

Cocok bila stok dan HPP tidak perlu dipisah per merek.

## 2. Produk terpisah per merek (disarankan untuk stok & penjualan per merek)

Stok dan penjualan dihitung **per produk**, bukan per merek. Agar laporan terpisah per cap,
buat satu produk untuk tiap merek.

### Cara A — lewat aplikasi

1. **Master → Produk → Tambah Produk**
2. Nama: `Tepung Tapioka – Cap Roda Mas`, isi **Merek**: `Cap Roda Mas`, tipe **Produk Jadi**.
3. Ulangi untuk merek lain.
4. Sesuaikan **Harga Default** bila harga per merek berbeda.

### Cara B — lewat script (idempotent)

Memecah satu produk jadi yang sudah ada menjadi beberapa produk per merek:

```bash
# lihat rencana tanpa mengubah data
npm run db:seed-brands -- --dry-run

# buat produk untuk merek default (Roda Mas, Bunga Surya, Jago Terbang)
npm run db:seed-brands

# tentukan produk dasar dan daftar merek sendiri
npm run db:seed-brands -- --base=PRD-002 --brands="Cap Roda Mas,Cap Bunga Surya,Cap Jago Terbang"
```

Aturan penamaan:

| Produk dasar | Merek | Kode baru | Nama baru |
|---|---|---|---|
| `PRD-002` / Tepung 1 | Cap Roda Mas | `PRD-002-RODA-MAS` | `Tepung 1 – Cap Roda Mas` |
| `PRD-002` / Tepung 1 | Cap Bunga Surya | `PRD-002-BUNGA-SURYA` | `Tepung 1 – Cap Bunga Surya` |

Produk dengan kode yang sudah ada akan dilewati, jadi aman dijalankan berulang.

## 3. Setelah memecah produk

1. **Harga default**: atur per merek bila berbeda (Master → Produk).
2. **Stok lama** tetap berada di produk dasar. Pindahkan ke produk merek lewat
   **Warehouse → Penyesuaian (ADJUSTMENT)** sesuai fisik gudang.
3. **Transaksi lama** tidak berubah: masih menunjuk produk dasar (merek tidak dicatat di pembelian).
4. Mulai sekarang, pilih produk merek yang sesuai di **Pembelian Produk Jadi**.
5. Produk dasar boleh dinonaktifkan (bukan dihapus) setelah stoknya nol agar riwayat tetap utuh.

## 4. Merek pada penjualan

- Master merek: **Master → Merek** (tambah / ubah / nonaktifkan).
- Di **Penjualan → Tambah**, setiap item punya pilihan **Merek** yang diambil dari tabel `brands`.
  Pilih `+ Tambah merek baru…` untuk membuat merek langsung dari form; merek langsung terpilih.
- Merek disimpan sebagai snapshot di `sale_items.brand_id` + `sale_items.brand_name`,
  sehingga riwayat tetap terbaca walau nama merek diubah kemudian.
- Laporan: **Laporan → Laporan Penjualan per Merek** (qty, omzet, HPP, margin per merek),
  dan kolom merek di detail penjualan.

## 5. Catatan teknis

- Kolom: `products.brand` (`VARCHAR(100)`, nullable). Kolom `purchases.brand` sudah tidak dipakai
  (disimpan hanya untuk data lama).
- Master merek: tabel `brands` (`id`, `name` unik, `status`).
- Merek penjualan: `sale_items.brand_id` + `sale_items.brand_name` (snapshot nama).
- Laporan: **Laporan → Laporan Penjualan per Merek**.
- Patch DB: `src/db/patches/2026-11-15_004_product_brand.sql` dan
  `src/db/patches/2026-11-15_007_brands.sql` (`npm run db:patch`).
- Seed: `src/db/seed-brands.ts` (`npm run db:seed-brands`).
