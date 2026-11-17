-- Rollback: berat (Kg) pada item penjualan.
-- Jalankan manual, lalu hapus baris '2026-11-15_009_sale_item_weight.sql' dari schema_patches.

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'weight'
);
SET @sql := IF(@has_col > 0, 'ALTER TABLE sale_items DROP COLUMN weight', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
