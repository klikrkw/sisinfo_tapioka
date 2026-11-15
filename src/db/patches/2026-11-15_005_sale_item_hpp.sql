-- Patch: HPP dibekukan pada item penjualan.
--
-- Tujuan:
--   Menyimpan HPP per unit dan total HPP setiap item penjualan pada saat
--   transaksi dibuat, sehingga margin historis tidak berubah ketika harga
--   beli produk jadi berubah di kemudian hari.
--
-- Dampak: menambah tiga kolom nullable pada sale_items; data lama dibiarkan
--   NULL (aplikasi memakai HPP terkini sebagai estimasi sampai di-backfill
--   dengan `npm run db:backfill-hpp`).
--
-- Idempotent: dicek ke information_schema, aman dijalankan ulang.
--
-- Rollback: lihat 2026-11-15_005_sale_item_hpp.down.sql

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'hpp_per_unit'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE sale_items ADD COLUMN hpp_per_unit DECIMAL(15,2) NULL AFTER subtotal',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'hpp_amount'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE sale_items ADD COLUMN hpp_amount DECIMAL(15,2) NULL AFTER hpp_per_unit',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'cost_source'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE sale_items ADD COLUMN cost_source VARCHAR(20) NULL AFTER hpp_amount',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
