-- Rollback: pembelian produk jadi + biaya tambahan.
--
-- Jalankan MANUAL bila perlu membatalkan 2026-11-15_002_purchase_finished_and_costs.sql,
-- lalu hapus barisnya dari tabel `schema_patches`.
--
-- PERINGATAN:
--   - Menghapus kolom berarti data di kolom tersebut hilang permanen.
--   - Enum 'per_sack' hanya dikembalikan jika TIDAK ada baris yang memakainya.
--   - Backup database sebelum menjalankan file ini.

-- 7. purchase_deduction_types.applies_to
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_deduction_types' AND COLUMN_NAME = 'applies_to'
);
SET @sql := IF(@has_col > 0,
  'ALTER TABLE purchase_deduction_types DROP COLUMN applies_to',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. purchase_deduction_types.calculation_type (hapus per_sack bila tidak dipakai)
SET @col_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_deduction_types' AND COLUMN_NAME = 'calculation_type'
);
SET @used := (
  SELECT COUNT(*) FROM purchase_deduction_types WHERE calculation_type = 'per_sack'
);
SET @sql := IF(@col_type LIKE '%per_sack%' AND @used = 0,
  'ALTER TABLE purchase_deduction_types MODIFY calculation_type ENUM(''fixed'',''per_kg'',''percentage'') NOT NULL DEFAULT ''fixed''',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. purchase_deductions.impact_type
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_deductions' AND COLUMN_NAME = 'impact_type'
);
SET @sql := IF(@has_col > 0,
  'ALTER TABLE purchase_deductions DROP COLUMN impact_type',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. purchase_deductions.calculation_type (hapus per_sack bila tidak dipakai)
SET @col_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_deductions' AND COLUMN_NAME = 'calculation_type'
);
SET @used := (
  SELECT COUNT(*) FROM purchase_deductions WHERE calculation_type = 'per_sack'
);
SET @sql := IF(@col_type LIKE '%per_sack%' AND @used = 0,
  'ALTER TABLE purchase_deductions MODIFY calculation_type ENUM(''fixed'',''per_kg'',''percentage'') NOT NULL',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. purchases.total_costs
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'total_costs'
);
SET @sql := IF(@has_col > 0,
  'ALTER TABLE purchases DROP COLUMN total_costs',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. purchases.sack_count
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'sack_count'
);
SET @sql := IF(@has_col > 0,
  'ALTER TABLE purchases DROP COLUMN sack_count',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1. purchases.purchase_type
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'purchase_type'
);
SET @sql := IF(@has_col > 0,
  'ALTER TABLE purchases DROP COLUMN purchase_type',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
