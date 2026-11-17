-- Patch: berat (Kg) pada item penjualan.
--
-- Tujuan:
--   Menyimpan berat aktual barang yang dijual (Kg) per item, karena qty
--   penjualan dicatat dalam satuan (mis. sak) sementara laporan dan surat
--   jalan membutuhkan berat.
--
-- Dampak: menambah satu kolom nullable pada sale_items; data lama tidak berubah.
--
-- Idempotent: dicek ke information_schema, aman dijalankan ulang.
--
-- Rollback: lihat 2026-11-15_009_sale_item_weight.down.sql

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'weight'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE sale_items ADD COLUMN weight DECIMAL(15,2) NULL AFTER quantity',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
