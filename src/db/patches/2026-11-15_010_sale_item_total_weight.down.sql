-- Rollback: jumlah berat (Kg) pada item penjualan.
-- Jalankan manual, lalu hapus baris '2026-11-15_010_sale_item_total_weight.sql' dari schema_patches.

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'total_weight'
);
SET @sql := IF(@has_col > 0, 'ALTER TABLE sale_items DROP COLUMN total_weight', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
