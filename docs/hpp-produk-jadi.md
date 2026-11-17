# HPP Produk Jadi dari Pembelian

Menjelaskan bagaimana HPP barang yang **dibeli sebagai produk jadi** dipakai saat penjualan.

## Rumus

```
HPP / Kg = Σ nilai pembelian (net)  ÷  Σ berat dibayar
         = (harga beli − potongan + biaya tambahan) ÷ berat dibayar
```

- Rata-rata **tertimbang** dari semua pembelian produk jadi yang statusnya bukan `Cancelled`.
- Potongan supplier (mis. potongan sak) mengurangi nilai, biaya tambahan (mis. manol fee) menambah nilai,
  jadi keduanya otomatis masuk ke HPP.
- Berat yang dipakai adalah **berat dibayar** (sesuai qty yang masuk stok), bukan netto.

Contoh (PBF/2026/11/000001): berat dibayar 4.440 Kg, nilai bersih Rp 64.041.000
→ HPP = 64.041.000 ÷ 4.440 = **Rp 14.424 / Kg**.

## Prioritas sumber HPP per produk

1. **HPP produksi** — HPP batch produksi terakhir yang berstatus `Completed`.
2. **Harga beli rata-rata** — dari pembelian produk jadi (dipakai kalau produk tidak punya batch produksi).
3. **Harga default** — harga jual default di master produk (fallback terakhir).

Sumber ditampilkan di form penjualan supaya jelas asal angkanya.

## HPP dibekukan saat transaksi (snapshot)

Saat penjualan disimpan, HPP per unit **disalin ke item penjualan** dengan metode **FIFO per layer**:

| Kolom `sale_items` | Isi |
|---|---|
| `hpp_per_unit` | HPP/Kg hasil pemakaian layer FIFO |
| `hpp_amount` | total HPP item |
| `cost_source` | `FIFO` (transaksi baru), atau `PRODUCTION`/`PURCHASE`/`DEFAULT` (data lama) |

Konsekuensi: margin historis **tidak berubah** walau harga beli naik/turun setelahnya.
Laporan laba/rugi memakai nilai snapshot ini, bukan HPP terkini.

## FIFO per layer (`stock_layers`)

Setiap pemasukan stok menjadi satu layer dengan harga pokok per unit:

| Sumber layer | Harga pokok |
|---|---|
| Pembelian produk jadi | nilai bersih pembelian ÷ berat dibayar |
| Output produksi (produk utama) | HPP batch produksi |
| Output produksi (produk sampingan) | harga taksiran per unit |
| Saldo awal / penyesuaian | harga default produk |

Penjualan dan pemakaian produksi mengambil layer **paling lama** lebih dulu; pemakaian dicatat di
`stock_layer_usages` (qty, harga, nilai, referensi transaksi). Lihat di
**Gudang → Layer HPP (FIFO)**: sisa layer, nilai persediaan, dan asal tiap layer.

Untuk stok yang tidak tercakup layer (data lama), HPP-nya memakai estimasi HPP terkini agar transaksi
tetap bisa disimpan.

### Membangun layer dari riwayat stok

```bash
npm run db:backfill-layers -- --dry-run   # lihat ringkasan
npm run db:backfill-layers                # bangun dari riwayat
npm run db:backfill-layers -- --reset     # hapus layer lalu bangun ulang
```

Backfill juga mengisi snapshot HPP item penjualan lama dari pemakaian layer.

Untuk transaksi lama yang masih belum punya snapshot:

```bash
npm run db:backfill-hpp -- --dry-run
npm run db:backfill-hpp
```

Hanya item dengan `cost_source` kosong yang diisi; snapshot yang sudah ada tidak ditimpa.

## Di mana angkanya terlihat

| Layar | Tampilan |
|---|---|
| Penjualan → Tambah | Per baris item: label sumber HPP, `Rp X/Kg`, margin per Kg, dan peringatan bila harga jual di bawah HPP; pilihan **Merek** (bisa tambah merek baru) |
| Penjualan → Detail | Kolom **HPP/Kg** dan **Margin** per item + baris total estimasi HPP/margin |
| Laporan → Laba / Rugi | Baris **HPP Produk Jadi Dibeli (Terjual)** = Σ HPP item (snapshot), dikurangkan dari laba kotor |

Catatan: COGS laporan hanya menghitung pemakaian layer dari **pembelian** (dan data lama bertanda
`PURCHASE`). Pemakaian layer dari produksi sudah tercakup di total biaya produksi, sehingga tidak dobel.

## Batasan

- Baris **HPP Produk Jadi Dibeli (Terjual)** memakai pemakaian layer FIFO, jadi angkanya per item
  penjualan, bukan rata-rata periode.
- Estimasi HPP di form penjualan (sebelum transaksi disimpan) memakai rata-rata tertimbang pembelian
  sebagai pembanding; HPP final ditentukan FIFO saat transaksi disimpan.
- Kalau produk yang sama diproduksi **dan** dibeli, layer produksi dan layer pembelian hidup berdampingan:
  FIFO yang menentukan sumber HPP tiap Kg yang terjual.


