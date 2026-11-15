-- Patch: layer stok untuk HPP FIFO.
--
-- Tujuan:
--   Menilai persediaan dan HPP penjualan dengan metode FIFO per layer pemasukan.
--   Setiap pembelian produk jadi / output produksi menjadi satu layer berisi
--   qty masuk dan harga pokok per unit; setiap pengeluaran (penjualan,
--   pemakaian produksi) memakai layer paling lama lebih dulu.
--
-- Dampak: membuat dua tabel baru; tabel lama tidak diubah.
--   Isi awal dibangun dari riwayat stok lewat: npm run db:backfill-layers
--
-- Idempotent: CREATE TABLE IF NOT EXISTS, aman dijalankan ulang.
--
-- Rollback: lihat 2026-11-15_006_stock_layers.down.sql

CREATE TABLE IF NOT EXISTS stock_layers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT NOT NULL,
  product_id INT NOT NULL,
  source_type VARCHAR(30) NOT NULL,
  source_id INT NULL,
  source_number VARCHAR(50) NULL,
  date DATE NOT NULL,
  qty_in DECIMAL(15,2) NOT NULL,
  qty_remaining DECIMAL(15,2) NOT NULL,
  unit_cost DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_layers_product (warehouse_id, product_id, date),
  KEY idx_layers_remaining (warehouse_id, product_id, qty_remaining)
);

CREATE TABLE IF NOT EXISTS stock_layer_usages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  layer_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  product_id INT NOT NULL,
  date DATE NOT NULL,
  qty DECIMAL(15,2) NOT NULL,
  unit_cost DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  ref_type VARCHAR(30) NOT NULL,
  ref_id INT NULL,
  sale_item_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_usage_layer (layer_id),
  KEY idx_usage_sale_item (sale_item_id),
  KEY idx_usage_ref (ref_type, ref_id)
);
