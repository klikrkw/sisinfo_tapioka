# Merek Produk (Brand)

Dokumen ini menjelaskan dua cara memakai merek pada produk jadi, mis. **Tepung Tapioka "Cap Roda Mas"**,
"Cap Bunga Surya", dan "Cap Jago Terbang", serta kapan sebaiknya memecah produk per merek.

## 1. Merek sebagai atribut (cukup untuk nota)

- Isi **Master → Produk → Edit → Merek / Brand**.
- Saat membuat **Pembelian Produk Jadi**, merek terisi otomatis dari produk dan bisa diubah.
- Merek tersimpan sebagai snapshot di transaksi (`purchases.brand`), tampil di detail dan **Nota / PDF**.

Cocok bila stok, HPP, dan penjualan tidak perlu dipisah per merek.

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
3. **Transaksi lama** tidak berubah: masih menunjuk produk dasar, dan merek yang
   sudah tersimpan di `purchases.brand` tetap tampil di nota.
4. Mulai sekarang, pilih produk merek yang sesuai di **Pembelian Produk Jadi**.
5. Produk dasar boleh dinonaktifkan (bukan dihapus) setelah stoknya nol agar riwayat tetap utuh.

## 4. Catatan teknis

- Kolom: `products.brand` dan `purchases.brand` (`VARCHAR(100)`, nullable).
- Patch DB: `src/db/patches/2026-11-15_004_product_brand.sql` (`npm run db:patch`).
- Seed: `src/db/seed-brands.ts` (`npm run db:seed-brands`).
