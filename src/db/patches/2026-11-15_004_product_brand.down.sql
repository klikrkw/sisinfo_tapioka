-- Rollback: merek (brand) produk.
-- Jalankan manual, lalu hapus baris '2026-11-15_004_product_brand.sql' dari schema_patches.

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'brand'
);
SET @sql := IF(@has_col > 0, 'ALTER TABLE purchases DROP COLUMN brand', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'brand'
);
SET @sql := IF(@has_col > 0, 'ALTER TABLE products DROP COLUMN brand', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
