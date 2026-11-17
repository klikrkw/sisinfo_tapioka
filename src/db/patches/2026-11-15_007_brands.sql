-- Patch: master merek (brand) + merek pada item penjualan.
--
-- Tujuan:
--   Menyediakan tabel `brands` sebagai sumber pilihan merek pada form penjualan,
--   dan menyimpan merek di setiap item penjualan (snapshot nama) untuk laporan
--   penjualan per merek.
--
-- Dampak:
--   - Tabel baru `brands`; data awal diisi dari merek yang sudah ada di
--     products.brand dan purchases.brand (tanpa duplikat).
--   - sale_items.brand_id  : relasi ke brands (nullable)
--   - sale_items.brand_name: snapshot nama merek saat transaksi (nullable)
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + INSERT IGNORE + cek information_schema.
--
-- Rollback: lihat 2026-11-15_007_brands.down.sql

CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_brands_name (name)
);

INSERT IGNORE INTO brands (name)
SELECT DISTINCT TRIM(brand) FROM products WHERE brand IS NOT NULL AND TRIM(brand) <> '';

INSERT IGNORE INTO brands (name)
SELECT DISTINCT TRIM(brand) FROM purchases WHERE brand IS NOT NULL AND TRIM(brand) <> '';

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'brand_id'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE sale_items ADD COLUMN brand_id INT NULL AFTER product_id',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_items' AND COLUMN_NAME = 'brand_name'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE sale_items ADD COLUMN brand_name VARCHAR(100) NULL AFTER brand_id',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
