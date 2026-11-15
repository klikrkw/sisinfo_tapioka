-- Rollback: HPP dibekukan pada item penjualan.
-- Jalankan manual, lalu hapus baris '2026-11-15_005_sale_item_hpp.sql' dari schema_patches.

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'cost_source'
);
SET @sql := IF(@has_col > 0, 'ALTER TABLE sale_items DROP COLUMN cost_source', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'hpp_amount'
);
SET @sql := IF(@has_col > 0, 'ALTER TABLE sale_items DROP COLUMN hpp_amount', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'hpp_per_unit'
);
SET @sql := IF(@has_col > 0, 'ALTER TABLE sale_items DROP COLUMN hpp_per_unit', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
