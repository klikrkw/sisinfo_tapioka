-- Patch: jumlah berat (Kg) pada item penjualan.
--
-- Tujuan:
--   Memisahkan berat per satuan (sale_items.weight) dari jumlah berat
--   (sale_items.total_weight = qty x berat per satuan) agar laporan dan
--   surat jalan memakai berat total yang konsisten.
--
-- Dampak: menambah satu kolom nullable pada sale_items; data lama tidak berubah.
--   Untuk data lama, jumlah berat dapat dihitung dari qty x weight.
--
-- Idempotent: dicek ke information_schema, aman dijalankan ulang.
--
-- Rollback: lihat 2026-11-15_010_sale_item_total_weight.down.sql

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'total_weight'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE sale_items ADD COLUMN total_weight DECIMAL(15,2) NULL AFTER weight',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
