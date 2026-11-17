-- Rollback: master merek + merek pada item penjualan.
-- Jalankan manual, lalu hapus baris '2026-11-15_007_brands.sql' dari schema_patches.

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'brand_name'
);
SET @sql := IF(@has_col > 0, 'ALTER TABLE sale_items DROP COLUMN brand_name', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'brand_id'
);
SET @sql := IF(@has_col > 0, 'ALTER TABLE sale_items DROP COLUMN brand_id', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

DROP TABLE IF EXISTS brands;
