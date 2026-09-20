---
title: "Product Requirements Document — Sistem Manajemen Ketela & Tepung Tapioka"
version: "1.0"
date: "September 2026"
stack: "Next.js, TypeScript, Tailwind CSS, shadcn/ui, Zod, Drizzle ORM, MySQL"
database: "db_tapioka"
---

# PRODUCT REQUIREMENTS DOCUMENT (PRD)

Sistem Manajemen Pembelian Ketela, Pergudangan, Produksi Tepung Tapioka, Penjualan & Armada

Versi 1.0 | September 2026


## 1. Ringkasan Produk

Aplikasi ini merupakan sistem terintegrasi untuk mengelola proses bisnis perusahaan pengolahan ketela menjadi tepung tapioka, mulai dari pembelian bahan baku, penimbangan, rifaksi dan potongan, pergudangan, produksi, penilaian produk sampingan ampas, penjualan, pengiriman dengan armada truk, biaya solar dan sopir, hingga laporan biaya, HPP, margin, hutang, piutang, dan laba rugi.

Supplier/Petani
    ↓
Pembelian Ketela
    ↓
Penimbangan → Netto/Tara → Rifaksi → Potongan
    ↓
Gudang Bahan Baku
    ↓
Produksi
    ├── Tepung Tapioka
    └── Ampas (By-Product)
    ↓
Gudang Produk Jadi
    ↓
Penjualan
    ↓
Armada/Truk → Solar + Sopir + Tol + Biaya Armada
    ↓
Laporan HPP, Margin & Laba/Rugi


## 2. Tujuan Produk

- Mencatat seluruh transaksi pembelian ketela secara rinci dan dapat diaudit.

- Mengotomatisasi perhitungan berat, rifaksi, dan potongan pembelian.

- Mengelola stok bahan baku, produk jadi, ampas, dan kemasan menggunakan stock ledger.

- Mencatat batch produksi dan seluruh biaya produksi.

- Menghitung yield produksi dan HPP tepung tapioka.

- Menilai ampas berdasarkan berat netto × harga ampas per Kg.

- Mengelola penjualan, pembayaran, piutang, dan pengiriman.

- Mengelola armada, sopir, solar, tol, maintenance, dan biaya perjalanan.

- Menghasilkan laporan pembelian, stok, produksi, HPP, penjualan, biaya, hutang, piutang, armada, dan laba rugi.

- Menyediakan role, permission, approval, audit log, dan pengaturan perusahaan.


## 3. Sasaran Pengguna


## 4. Teknologi & Arsitektur

┌──────────────────────────────────────────────┐
│ FRONTEND                                     │
│ Next.js + TypeScript + Tailwind + shadcn/ui│
│ React Hook Form + Zod + TanStack Table      │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ APPLICATION                                  │
│ Server Actions + Route Handlers             │
│ Business Logic + Authorization              │
│ Calculation Engine + Transaction Processing │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ DATA                                         │
│ Drizzle ORM + MySQL + Drizzle Kit          │
└──────────────────────────────────────────────┘


## 5. Modul Aplikasi

- Dashboard

- Master Data

- Supplier

- Bahan Baku

- Pembelian Ketela

- Penimbangan

- Rifaksi

- Potongan Pembelian

- Gudang Bahan Baku

- Produksi

- Biaya Produksi

- Produk Jadi & Produk Sampingan

- Gudang Produk Jadi

- Pelanggan

- Penjualan

- Armada

- Sopir

- Pengiriman

- Solar

- Biaya Armada

- Kas & Keuangan

- Hutang Supplier

- Piutang Pelanggan

- Biaya Operasional

- Laporan

- User, Role & Permission

- Pengaturan Sistem

- Audit Log


## 6. Dashboard

- Pembelian hari ini/bulan berjalan.

- Jumlah ketela masuk.

- Stok bahan baku.

- Produksi hari ini/bulan berjalan.

- Stok tepung tapioka.

- Stok ampas.

- Penjualan hari ini/bulan berjalan.

- Piutang dan hutang.

- Total biaya produksi.

- Biaya armada.

- Margin/laba.

- Grafik pembelian, produksi, penjualan, biaya, dan laba/rugi.


## 7. Master Data


### 7.1 Supplier


### 7.2 Bahan Baku

Contoh: Ketela Segar, Ketela Grade A/B/C. Field minimal: id, kode, nama, satuan, jenis, harga_default, status.


### 7.3 Produk


### 7.4 Gudang

Gudang Ketela, Gudang Produksi, Gudang Tepung, Gudang Kemasan, Gudang Produk Jadi. Field: id, kode, nama, alamat, jenis, status.


### 7.5 Pelanggan

Field: id, kode_pelanggan, nama, alamat, desa, kecamatan, kabupaten, telepon, email, npwp, limit_piutang, termin_hari, status.


### 7.6 Armada & Sopir

Armada: kode, nomor polisi, merk, jenis, kapasitas, tahun, status, kepemilikan. Sopir: kode, nama, alamat, telepon, nomor SIM, jenis SIM, masa berlaku, status.


## 8. Pembelian Ketela

Transaksi pembelian harus menyimpan seluruh komponen pembentuk harga dan biaya, bukan hanya total akhir.


### 8.1 Header

No pembelian, tanggal, supplier, lokasi pembelian, kendaraan, nomor polisi, petugas, metode pembayaran, termin/jatuh tempo, dan keterangan.


### 8.2 Penimbangan

Istilah dan formula berat mengikuti ketentuan operasional perusahaan. Untuk ketentuan yang diberikan: berat netto - berat tara = berat bruto. Karena istilah bruto/netto/tara dapat berbeda dari definisi umum, parameter dan formula sebaiknya dapat dikonfigurasi di pengaturan sistem.

Berat sesuai formula operasional:
Berat Bruto = Berat Netto - Berat Tara

Sistem menyimpan:
- Berat Timbangan
- Berat Tara
- Berat hasil perhitungan
- Formula yang digunakan
- Timestamp/operator


### 8.3 Rifaksi

Rifaksi adalah pengurang kualitas/berat yang memengaruhi berat yang dibayar. Sistem mendukung metode persentase maupun berat.

Contoh:
Berat dasar = 9.500 Kg
Rifaksi = 5%
Rifaksi Kg = 9.500 × 5% = 475 Kg
Berat Dibayar = 9.500 - 475 = 9.025 Kg


### 8.4 Potongan Lain

Potongan lain dibuat dalam tabel tersendiri agar jenis potongan dapat ditambah tanpa mengubah struktur tabel pembelian.

Contoh jenis: Pikulan, Angkat Panggul, Transport, Potongan Kotoran, Potongan Lainnya.

Fixed:
amount = rate

Per Kg:
amount = quantity × rate

Percentage:
amount = base_amount × rate / 100

Penting: field snapshot pada transaksi menjaga histori transaksi tetap benar walaupun master tarif berubah di masa depan.


### 8.5 Perhitungan Nilai Pembelian

Berat Dibayar = Berat Setelah Rifaksi
Nilai Bahan Baku = Berat Dibayar × Harga/Kg

Total Potongan = Σ seluruh purchase_deductions

Jika suatu potongan bertipe SUPPLIER_DEDUCTION:
Dibayar Supplier = Nilai Bahan Baku - Total Supplier Deduction

Jika suatu biaya bertipe PURCHASE_COST:
Purchase Cost = Nilai Bahan Baku + biaya pembelian terkait

Sistem harus membedakan dampak potongan terhadap pembayaran supplier dan terhadap biaya/HPP agar perhitungan biaya tidak rancu.


### 8.6 Status Pembelian

Draft → Menunggu Persetujuan → Disetujui → Ditimbang → Selesai. Status tambahan: Dibatalkan. Transaksi yang telah diposting tidak boleh dihapus langsung.


## 9. Gudang & Stock Ledger

Setiap transaksi stok menggunakan stock_movements sebagai sumber histori. Jangan hanya mengandalkan satu angka stock_qty.

Jenis transaksi: PURCHASE, PRODUCTION_USAGE, PRODUCTION_OUTPUT, SALE, RETURN, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER_IN, TRANSFER_OUT.


## 10. Produksi


### 10.1 Batch Produksi

Setiap produksi memiliki nomor batch, tanggal, shift, mesin, gudang bahan baku, gudang produk, penanggung jawab, status, dan keterangan.


### 10.2 Input Produksi

Input utama adalah ketela dari gudang. Sistem otomatis mengeluarkan stok sesuai qty yang diposting.


### 10.3 Output Produksi

Output minimal: Tepung Tapioka dan Ampas. Sistem juga dapat mendukung produk sampingan/limbah lain.


## 11. Perhitungan Produk Ampas

Ampas merupakan produk sampingan yang dinilai menggunakan berat netto × harga ampas per Kg.

Berat Netto Ampas = Berat Bruto Ampas - Berat Tara Ampas

Nilai Ampas = Berat Netto Ampas × Harga Ampas/Kg

Contoh: netto ampas 5.000 Kg × Rp500/Kg = Rp2.500.000.

Nilai ampas dapat dikonfigurasi sebagai pengurang biaya produksi yang dibebankan ke tepung. Ampas tetap masuk ke gudang sebagai stok by-product dan dapat dijual melalui modul penjualan.


## 12. Biaya Produksi

Biaya dapat ditetapkan sebagai direct cost atau indirect cost. Metode alokasi overhead: per Kg produksi, per jam mesin, per batch, persentase, atau manual.


## 13. HPP Produksi

Total Biaya Produksi
= Bahan Baku
+ Tenaga Kerja
+ Listrik
+ Reparasi
+ Kemasan
+ Overhead
+ Biaya lainnya

Jika nilai ampas dikurangkan dari cost produk utama:
Cost Tepung = Total Biaya Produksi - Nilai Ampas

HPP Tepung/Kg = Cost Tepung ÷ Qty Tepung

Jika terdapat lebih dari satu produk sampingan, sistem harus dapat mengurangi/menilai seluruh by-product sesuai konfigurasi metode alokasi.


## 14. Gudang Produk Jadi

Produksi yang diposting menambah stok tepung, ampas, dan produk sampingan lain. Setiap output terkait dengan batch produksi sehingga penelusuran HPP dan histori stok dapat dilakukan.


## 15. Penjualan

Header: no penjualan, tanggal, pelanggan, sales, gudang, armada, sopir, alamat pengiriman, metode pembayaran, termin, jatuh tempo, keterangan. Detail: produk, batch, qty, harga, diskon, subtotal.

Penjualan yang diposting mengurangi stok. Penjualan kredit membuat piutang.


## 16. Pengiriman, Armada & Sopir


### 16.1 Pengiriman

No pengiriman, tanggal, no penjualan, armada, sopir, tujuan, KM awal, KM akhir, jarak, status.

Status: Draft, Disiapkan, Berangkat, Dalam Perjalanan, Sampai, Selesai, Dibatalkan.


### 16.2 Biaya Solar

Total Solar = Liter × Harga/Liter

Data: pengiriman, armada, tanggal, KM awal/akhir, liter, harga/liter, total solar.


### 16.3 Biaya Sopir

Mendukung gaji tetap, upah perjalanan, upah per Km, uang jalan, uang makan, tunjangan, dan biaya lainnya.


### 16.4 Biaya Armada

Solar, tol, parkir, servis, ban, oli, reparasi, pajak, asuransi, dan biaya lainnya.


## 17. Biaya Pengiriman

Total Biaya Pengiriman
= Solar + Sopir + Tol + Parkir + Maintenance + Biaya lainnya

Biaya pengiriman dapat dikaitkan dengan transaksi penjualan untuk analisis margin setelah distribusi.


## 18. Hutang Supplier & Piutang Pelanggan

Pembelian mendukung tunai, transfer, dan kredit. Penjualan mendukung tunai dan kredit. Sistem menghitung pembayaran, sisa hutang/piutang, status lunas/sebagian/belum bayar, dan jatuh tempo.


## 19. Kas & Biaya Operasional

Kas masuk/keluar, transfer bank, pembayaran supplier, penerimaan pelanggan, biaya produksi, biaya armada, dan biaya operasional umum.

Biaya operasional umum: gaji administrasi, telepon, internet, listrik kantor, ATK, pajak, keamanan, kebersihan, sewa, perizinan, maintenance kantor, biaya bank, dan lainnya.


## 20. Laporan

Semua laporan memiliki filter periode dan dapat dikembangkan untuk export CSV/Excel/PDF.


## 21. Pengaturan Sistem

Contoh nomor:
PB/{YYYY}/{MM}/{000001}
PRD/{YYYY}/{MM}/{000001}
PJ/{YYYY}/{MM}/{000001}
DO/{YYYY}/{MM}/{000001}
PAY/{YYYY}/{MM}/{000001}


## 22. User, Role, Permission & Approval

Permission granular contoh: purchase.view/create/update/delete/approve, warehouse.view/create/adjust, production.view/create/approve, sales.view/create/update/delete, finance.view/create/approve, report.view.

Draft → Diajukan → Approval → Disetujui → Posting → Selesai

Transaksi yang telah diposting tidak boleh diedit/hapus secara langsung; perubahan harus menggunakan mekanisme koreksi/approval dan tercatat pada audit log.


## 23. Audit Log

Audit log mencatat user, tanggal, modul, action, record ID, data lama, data baru, dan IP address untuk aktivitas penting seperti perubahan harga, approval, posting, pembayaran, adjustment stok, dan perubahan master.


## 24. Struktur Database

users
roles
permissions
role_permissions
user_roles

company_settings
document_sequences

suppliers
customers
raw_materials
products

warehouses
warehouse_stocks
stock_movements

purchases
purchase_items
purchase_weighings
purchase_refactions
purchase_deduction_types
purchase_deductions

production_batches
production_inputs
production_outputs
production_cost_types
production_costs

sales
sale_items
receivable_payments

drivers
vehicles
shipments
fuel_transactions
shipment_costs

expenses
cash_transactions
payable_payments

audit_logs


## 25. Relasi Utama

SUPPLIER
   ↓
PURCHASE
   ├── PURCHASE_ITEMS
   ├── PURCHASE_WEIGHINGS
   ├── PURCHASE_REFACTIONS
   └── PURCHASE_DEDUCTIONS
            ↓
         WAREHOUSE
            ↓
        PRODUCTION
         ├── INPUTS
         └── OUTPUTS
              ├── TEPUNG
              └── AMPAS
                   ↓
                 SALES
                   ↓
               SHIPMENT
               ├── VEHICLE
               ├── DRIVER
               └── FUEL


## 26. Struktur Folder Next.js

src/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── master/
│   │   ├── purchasing/
│   │   ├── warehouse/
│   │   ├── production/
│   │   ├── sales/
│   │   ├── fleet/
│   │   ├── finance/
│   │   ├── reports/
│   │   └── settings/
│   └── api/
├── components/
│   ├── ui/              # shadcn/ui
│   ├── forms/
│   ├── tables/
│   ├── dialogs/
│   ├── dashboard/
│   └── layouts/
├── db/
│   ├── index.ts
│   ├── schema/
│   └── migrations/
├── actions/
│   ├── purchasing/
│   ├── warehouse/
│   ├── production/
│   ├── sales/
│   ├── fleet/
│   └── finance/
├── lib/
│   ├── calculations/
│   ├── validations/
│   ├── auth/
│   ├── permissions/
│   ├── numbering/
│   └── utils/
├── hooks/
└── types/


## 27. Business Logic / Calculation Engine

Semua formula bisnis ditempatkan di service terpisah, bukan langsung di React component.

lib/calculations/
├── purchasing.ts
├── weighing.ts
├── refaction.ts
├── deductions.ts
├── production.ts
├── by-product.ts
├── hpp.ts
├── sales.ts
└── fleet.ts

Fungsi utama: calculatePurchaseWeight(), calculateRefaction(), calculateDeduction(), calculatePurchaseCost(), calculateProductionYield(), calculateByProductValue(), calculateProductionCost(), calculateProductHpp(), calculateShipmentCost(), calculateSalesMargin().


## 28. Zod Validation

const purchaseSchema = z.object({
  supplierId: z.string().min(1),
  date: z.coerce.date(),
  grossWeight: z.number().positive(),
  tareWeight: z.number().nonnegative(),
  refactionPercent: z.number().min(0).max(100),
  pricePerKg: z.number().positive(),
  notes: z.string().optional(),
});

Aturan bisnis:
- berat tidak boleh negatif
- tara tidak boleh melebihi berat dasar sesuai formula operasional
- rifaksi 0–100%
- harga dan qty harus valid
- transaksi tidak dapat diposting jika data wajib belum lengkap


## 29. UI/UX dengan shadcn/ui

- Sidebar responsif untuk modul.

- Header dengan pencarian, notifikasi, dan user menu.

- Card KPI dashboard.

- Data Table dengan sorting, filtering, pagination, dan column visibility.

- Dialog/Sheet untuk input dan detail.

- AlertDialog untuk konfirmasi penghapusan/pembatalan.

- Combobox/Command untuk supplier, pelanggan, produk, dan pencarian cepat.

- Calendar/Date Picker untuk tanggal.

- Form shadcn/ui + React Hook Form + Zod.

- Badge untuk status transaksi.

- Toast untuk notifikasi hasil operasi.

- Skeleton untuk loading state.

- Dark/light mode.


## 30. Contoh UI Form Pembelian

┌──────────────────────────────────────────────────────┐
│ Tambah Pembelian Ketela                             │
├──────────────────────────────────────────────────────┤
│ Supplier       [ Cari supplier...              ▼ ]  │
│ Tanggal        [ 18/09/2026                     ]  │
│                                                      │
│ PENIMBANGAN                                          │
│ Berat Timbang  [ 10.000 ] Kg                        │
│ Berat Tara     [    500 ] Kg                        │
│ Berat Hasil    [  9.500 ] Kg   ← otomatis           │
│                                                      │
│ RIFAKSI                                             │
│ Rifaksi        [ 5 ] %                              │
│ Potongan Kg    [ 475 ] Kg       ← otomatis          │
│ Berat Dibayar  [ 9.025 ] Kg      ← otomatis         │
│ Harga/Kg       [ Rp1.500 ]                         │
│                                                      │
│ POTONGAN LAIN                                       │
│ [ + Tambah Potongan ]                               │
│ Pikulan        Per Kg   9.025 × 100   Rp902.500    │
│ Angkat Panggul Per Kg   9.025 × 50    Rp451.250    │
│ Transport      Fixed        1 × 100k   Rp100.000   │
│                                                      │
│ Total Pembelian                         Rp...        │
│                                                      │
│ [Batal]                           [Simpan]          │
└──────────────────────────────────────────────────────┘


## 31. Contoh End-to-End Perhitungan


### 31.1 Pembelian

Berat Timbang       10.000 Kg
Tara                    500 Kg
Berat Bersih          9.500 Kg
Rifaksi                    5%
Rifaksi                  475 Kg
Berat Dibayar          9.025 Kg
Harga                 Rp1.500/Kg
Nilai Bahan Baku    Rp13.537.500

Pikulan (Rp100/Kg)     Rp902.500
Angkat Panggul (Rp50)  Rp451.250
Transport               Rp100.000
Potongan Lain            Rp50.000
Total potongan        Rp1.503.750


### 31.2 Produksi

Input ketela         9.025 Kg
Tepung               2.500 Kg
Ampas                5.000 Kg

Biaya:
Bahan Baku        Rp14.440.000
Karyawan           Rp2.000.000
Listrik            Rp1.500.000
Reparasi             Rp500.000
Sak                  Rp300.000
Lainnya              Rp200.000
Total              Rp18.940.000

Nilai Ampas:
5.000 Kg × Rp500 = Rp2.500.000

Cost Tepung:
Rp18.940.000 - Rp2.500.000
= Rp16.440.000

HPP Tepung:
Rp16.440.000 ÷ 2.500 Kg
= Rp6.576/Kg


### 31.3 Penjualan & Distribusi

Penjualan:
1.000 Kg × Rp10.000 = Rp10.000.000

HPP:
1.000 Kg × Rp6.576 = Rp6.576.000

Margin kotor = Rp3.424.000

Biaya pengiriman:
Solar  Rp500.000
Sopir  Rp300.000
Tol    Rp100.000
Total  Rp900.000

Margin setelah distribusi = Rp2.524.000


## 32. Acceptance Criteria


## 33. Tahapan Implementasi

1. Foundation: setup Next.js, TypeScript, Tailwind CSS, shadcn/ui, Drizzle, MySQL, migration, layout, authentication.

1. Master Data: supplier, customer, bahan baku, produk, gudang, armada, sopir, jenis biaya, jenis potongan.

1. Purchasing: pembelian, penimbangan, rifaksi, potongan, hutang, approval, stock posting.

1. Warehouse: stock ledger, penerimaan, pengeluaran, transfer, adjustment.

1. Production: batch, input, output, biaya, yield, ampas, HPP.

1. Sales: pelanggan, penjualan, piutang, pembayaran.

1. Fleet: pengiriman, armada, sopir, solar, biaya perjalanan.

1. Finance: kas, pembayaran supplier, penerimaan pelanggan, biaya operasional.

1. Reports: seluruh laporan dan dashboard.

1. Hardening: audit log, authorization, validation, testing, backup, performance, dan deployment.


## 34. Non-Functional Requirements

- TypeScript strict mode.

- Validasi client dan server menggunakan Zod.

- Semua transaksi database penting menggunakan database transaction.

- Authorization harus dilakukan di server, bukan hanya menyembunyikan menu di client.

- Nomor dokumen unik dan aman terhadap duplikasi.

- Stock movement immutable setelah posting; koreksi menggunakan transaksi adjustment/reversal.

- Audit log untuk perubahan penting.

- Responsive desktop/tablet/mobile.

- Dark/light mode menggunakan dukungan shadcn/ui/Tailwind.

- MySQL menjadi database default untuk deployment awal/single-site; desain repository/service dipisahkan agar dapat dikembangkan ke database server bila kebutuhan meningkat.


## 35. Prinsip Desain Data & Bisnis

- Simpan komponen pembentuk biaya, jangan hanya total.

- Rifaksi dipisahkan dari potongan lain karena sifatnya terkait berat/kualitas.

- Potongan lain menggunakan tabel master dan tabel transaksi tersendiri.

- Nilai potongan pada transaksi disimpan sebagai snapshot.

- Ampas diperlakukan sebagai by-product dengan stok dan nilai sendiri.

- Stock ledger menjadi sumber histori pergerakan stok.

- HPP harus dapat ditelusuri ke pembelian dan biaya produksi.

- Biaya armada dapat ditelusuri ke pengiriman dan penjualan.

- Transaksi posted tidak boleh dihapus secara langsung.

- Formula bisnis ditempatkan di calculation/service layer dan dapat dikonfigurasi bila aturan operasional berubah.


## 36. Risiko & Catatan Implementasi

- Istilah bruto/netto/tara pada ketentuan operasional perlu dikonfirmasi sebelum implementasi final agar formula tidak salah.

- Definisi rifaksi perlu ditetapkan apakah berbasis berat, persentase, kualitas, atau kombinasi.

- Setiap jenis potongan harus ditentukan apakah mengurangi pembayaran supplier, menjadi biaya pembelian, atau masuk biaya lain.

- Metode penilaian ampas perlu disepakati untuk pelaporan HPP.

- Jika produk sampingan lebih dari satu, metode alokasi biaya perlu ditentukan.

- Periode akuntansi dan metode pembulatan perlu ditetapkan.

- Backup MySQL wajib disiapkan secara berkala untuk deployment produksi.

- Jika transaksi dan user meningkat signifikan/multi-cabang, database dapat dimigrasikan ke PostgreSQL dengan layer akses data yang tetap dipisahkan.


## 37. Definition of Done

- Seluruh modul MVP dapat membuat, melihat, mengubah sesuai status, menyetujui, dan memposting transaksi.

- Tidak ada transaksi posted yang dapat dihapus tanpa mekanisme koreksi.

- Perhitungan pembelian, rifaksi, potongan, biaya produksi, ampas, HPP, penjualan, dan biaya armada diuji dengan unit test.

- Stok setelah setiap transaksi dapat direkonsiliasi dengan stock ledger.

- Laporan menghasilkan angka yang konsisten dengan transaksi sumber.

- Role dan permission diuji pada server.

- Audit log tersedia untuk transaksi kritis.

- Pengaturan perusahaan dapat disimpan dan digunakan pada dokumen/laporan.

- Aplikasi dapat dijalankan menggunakan MySQL dan migration Drizzle.


## 38. Konfigurasi Database MySQL

Aplikasi menggunakan MySQL sebagai database utama dengan nama database db_tapioka. User database adalah webuser. Password wajib disimpan melalui environment variable dan tidak boleh ditulis langsung di source code atau di-commit ke repository.

DATABASE_URL="mysql://webuser:user123%23@localhost:3306/db_tapioka"

Karakter # pada password harus di-URL-encode menjadi %23 ketika digunakan di DATABASE_URL. Driver yang direkomendasikan untuk Drizzle ORM adalah mysql2, dan migration dikelola dengan Drizzle Kit.

Contoh package database: drizzle-orm dan mysql2. Konfigurasi koneksi dan secret disimpan di file .env dan .env.local; file tersebut harus masuk .gitignore.


| Role | Tanggung Jawab |

| --- | --- |

| Super Admin | Konfigurasi sistem, user, role, permission, dan seluruh data. |

| Admin | Operasional administrasi dan master data. |

| Pembelian | Pembelian ketela, penimbangan, rifaksi, dan potongan. |

| Gudang | Penerimaan, pengeluaran, transfer, stok, dan adjustment. |

| Produksi | Batch produksi, input bahan baku, output, dan biaya produksi. |

| Penjualan | Order/penjualan, pelanggan, pembayaran, dan pengiriman. |

| Keuangan | Kas, pembayaran supplier, piutang, biaya, dan laporan keuangan. |

| Manager | Approval dan monitoring operasional. |

| Direktur | Dashboard dan laporan manajemen. |


| Layer | Teknologi |

| --- | --- |

| Framework | Next.js dengan App Router |

| Bahasa | TypeScript |

| UI Component | shadcn/ui |

| CSS | Tailwind CSS |

| Form | React Hook Form |

| Validation | Zod |

| ORM | Drizzle ORM |

| Database | MySQL |

| Table | TanStack Table |

| Chart | Recharts |

| Icon | Lucide React |

| Date | date-fns |

| Migration | Drizzle Kit |

| Authentication | Auth.js / NextAuth atau authentication custom |

| API | Next.js Route Handlers dan Server Actions |


| Field | Keterangan |

| --- | --- |

| id | Primary key |

| kode_supplier | Kode unik |

| nama_supplier | Nama supplier/petani/pengepul |

| jenis_supplier | Petani/Pengepul/Distributor/Lainnya |

| alamat | Alamat |

| desa/kecamatan/kabupaten | Wilayah |

| telepon | Nomor telepon |

| email | Email |

| npwp | NPWP bila ada |

| no_rekening | Rekening pembayaran |

| nama_bank | Bank |

| nama_rekening | Pemilik rekening |

| status | Aktif/nonaktif |

| created_at/updated_at | Timestamp |


| Tipe Produk | Contoh |

| --- | --- |

| RAW_MATERIAL | Ketela Segar |

| FINISHED_GOOD | Tepung Tapioka |

| BY_PRODUCT | Ampas Tapioka |

| PACKAGING | Sak |


| Field purchase_deduction_types | Keterangan |

| --- | --- |

| id | Primary key |

| code | Kode potongan |

| name | Nama potongan |

| calculation_type | fixed / per_kg / percentage |

| default_value | Nilai default |

| account_code | Kode akun biaya |

| impact_type | SUPPLIER_DEDUCTION / PURCHASE_COST / PRODUCTION_COST / OTHER |

| description | Keterangan |

| is_active | Status |

| created_at/updated_at | Timestamp |


| Field purchase_deductions | Keterangan |

| --- | --- |

| id | Primary key |

| purchase_id | FK pembelian |

| deduction_type_id | FK master jenis potongan |

| name | Snapshot nama |

| calculation_type | Snapshot metode |

| quantity | Dasar perhitungan |

| rate | Tarif/persentase |

| amount | Nilai potongan |

| notes | Keterangan |

| created_at/updated_at | Timestamp |


| Field | Keterangan |

| --- | --- |

| id | Primary key |

| warehouse_id | Gudang |

| product_id | Produk/bahan |

| reference_type | Jenis sumber |

| reference_id | ID transaksi sumber |

| qty_in | Qty masuk |

| qty_out | Qty keluar |

| balance | Saldo |

| created_at | Waktu transaksi |


| Field production_outputs | Keterangan |

| --- | --- |

| id | Primary key |

| production_batch_id | FK batch produksi |

| product_id | Produk |

| gross_weight | Berat bruto |

| tare_weight | Berat tara |

| net_weight | Berat netto |

| price_per_kg | Harga penilaian per Kg |

| total_value | Nilai output |

| is_by_product | Penanda by-product |

| created_at/updated_at | Timestamp |


| Kategori | Contoh |

| --- | --- |

| Tenaga Kerja | Gaji karyawan, upah harian, lembur, tunjangan |

| Listrik | Listrik mesin, listrik pabrik, PLN, generator |

| Reparasi | Reparasi mesin, sparepart, maintenance, bengkel |

| Kemasan | Sak, plastik, benang, label, pallet |

| Lainnya | Air, solar mesin, bahan bakar, transport internal, kebersihan, keamanan, administrasi |


| Laporan | Isi Utama |

| --- | --- |

| Pembelian | Tanggal, supplier, berat, rifaksi, potongan, harga, total |

| Stok | Stok awal, masuk, keluar, adjustment, saldo |

| Produksi | Batch, input, output, yield, biaya, HPP |

| Biaya Produksi | Bahan baku, tenaga kerja, listrik, reparasi, sak, overhead |

| Penjualan | Pelanggan, produk, qty, harga, diskon, total |

| Piutang | Invoice, pembayaran, saldo, jatuh tempo |

| Hutang | Pembelian, pembayaran, saldo, jatuh tempo |

| Armada | Perjalanan, KM, solar, sopir, tol, maintenance |

| Laba Rugi | Penjualan, HPP, biaya distribusi, biaya operasional, laba |

| Margin | Per produk, pelanggan, transaksi, periode |


| Pengaturan | Field |

| --- | --- |

| Profil Perusahaan | Nama perusahaan, alamat, desa, kecamatan, kabupaten, kode pos, email, telepon, website, logo |

| Lokasi/Map | Latitude, longitude, alamat/lokasi map |

| Perizinan | Nomor perizinan, tanggal perizinan |

| Nomor Dokumen | Format nomor pembelian, produksi, penjualan, pengiriman, pembayaran |

| Produksi | Metode penilaian by-product, metode alokasi overhead |

| Pembelian | Formula berat, konfigurasi rifaksi dan aturan potongan |

| Umum | Zona waktu, mata uang, pembulatan, format tanggal |


| Modul | Kriteria |

| --- | --- |

| Pembelian | Dapat mencatat supplier, timbang, formula berat, rifaksi, potongan, harga, pembayaran, approval, dan posting stok. |

| Potongan | Master potongan terpisah; mendukung fixed, per Kg, percentage; snapshot tarif; dapat dibedakan dampaknya. |

| Gudang | Setiap transaksi menghasilkan stock movement dan saldo dapat ditelusuri. |

| Produksi | Batch memiliki input, output, biaya, yield, dan status posting. |

| Ampas | Netto = bruto - tara; nilai ampas = netto × harga/Kg; masuk stok dan dapat dijual. |

| HPP | Biaya produksi dapat dihitung dan nilai ampas dapat mengurangi cost produk utama sesuai konfigurasi. |

| Penjualan | Penjualan mengurangi stok, membuat piutang bila kredit, dan dapat dikaitkan dengan pengiriman. |

| Armada | Pengiriman terhubung ke armada, sopir, solar, tol, dan biaya perjalanan. |

| Laporan | Laporan pembelian, stok, produksi, HPP, penjualan, biaya, hutang, piutang, armada, dan laba/rugi tersedia. |

| Keamanan | Role/permission, approval, audit log, dan proteksi transaksi posted tersedia. |

| Pengaturan | Profil perusahaan, alamat, email, telepon, kode pos, map, nomor dan tanggal perizinan dapat dikelola. |
