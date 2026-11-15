-- Patch: merek (brand) produk.
--
-- Tujuan:
--   Menyimpan merek produk jadi (contoh: "Cap Roda Mas", "Cap Bunga Surya")
--   pada master produk, dan menyalinnya ke transaksi pembelian sebagai snapshot
--   agar merek pada nota / surat jalan tetap sesuai saat dibeli.
--
-- Dampak:
--   - products.brand  : kolom nullable, data lama tidak berubah (NULL).
--   - purchases.brand : kolom nullable, transaksi lama tidak berubah (NULL).
--
-- Idempotent: dicek ke information_schema, aman dijalankan ulang.
--
-- Rollback: lihat 2026-11-15_004_product_brand.down.sql

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'brand'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE products ADD COLUMN brand VARCHAR(100) NULL AFTER name',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'brand'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE purchases ADD COLUMN brand VARCHAR(100) NULL AFTER raw_material_id',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
