-- Patch: pembelian produk jadi + biaya tambahan (PURCHASE_COST).
--
-- Tujuan:
--   1. purchases.purchase_type      membedakan pembelian bahan baku vs produk jadi.
--   2. purchases.sack_count         jumlah sak pada transaksi pembelian.
--   3. purchases.total_costs        total biaya tambahan (PURCHASE_COST) yang MENAMBAH total.
--   4. purchase_deductions.impact_type   snapshot jenis dampak per baris potongan/biaya.
--   5. calculation_type + enum 'per_sack' pada purchase_deductions & purchase_deduction_types.
--   6. purchase_deduction_types.applies_to  pembatasan jenis potongan per modul pembelian.
--
-- Dampak: hanya menambah kolom dan memperluas enum. Data lama aman
--         (purchase_type default 'RAW_MATERIAL', applies_to default 'BOTH',
--          impact_type default 'SUPPLIER_DEDUCTION', total_costs/sack_count default 0).
--
-- Idempotent: setiap perubahan dicek ke information_schema, jadi aman dijalankan
--             pada database yang sebagian kolomnya sudah ada.
--
-- Rollback: lihat 2026-11-15_002_purchase_finished_and_costs.down.sql

-- 1. purchases.purchase_type -------------------------------------------------
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'purchase_type'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE purchases ADD COLUMN purchase_type ENUM(''RAW_MATERIAL'',''FINISHED_GOOD'') NOT NULL DEFAULT ''RAW_MATERIAL'' AFTER number',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. purchases.sack_count ----------------------------------------------------
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'sack_count'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE purchases ADD COLUMN sack_count DECIMAL(15,2) DEFAULT 0 AFTER payable_weight',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. purchases.total_costs ---------------------------------------------------
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'total_costs'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE purchases ADD COLUMN total_costs DECIMAL(15,2) DEFAULT 0 AFTER total_deductions',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. purchase_deductions.calculation_type -> tambah 'per_sack' ---------------
SET @col_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_deductions' AND COLUMN_NAME = 'calculation_type'
);
SET @sql := IF(@col_type IS NOT NULL AND @col_type NOT LIKE '%per_sack%',
  'ALTER TABLE purchase_deductions MODIFY calculation_type ENUM(''fixed'',''per_kg'',''per_sack'',''percentage'') NOT NULL',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. purchase_deductions.impact_type -----------------------------------------
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_deductions' AND COLUMN_NAME = 'impact_type'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE purchase_deductions ADD COLUMN impact_type ENUM(''SUPPLIER_DEDUCTION'',''PURCHASE_COST'',''PRODUCTION_COST'',''OTHER'') NOT NULL DEFAULT ''SUPPLIER_DEDUCTION'' AFTER calculation_type',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. purchase_deduction_types.calculation_type -> tambah 'per_sack' ----------
SET @col_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_deduction_types' AND COLUMN_NAME = 'calculation_type'
);
SET @sql := IF(@col_type IS NOT NULL AND @col_type NOT LIKE '%per_sack%',
  'ALTER TABLE purchase_deduction_types MODIFY calculation_type ENUM(''fixed'',''per_kg'',''per_sack'',''percentage'') NOT NULL DEFAULT ''fixed''',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7. purchase_deduction_types.applies_to -------------------------------------
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_deduction_types' AND COLUMN_NAME = 'applies_to'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE purchase_deduction_types ADD COLUMN applies_to ENUM(''RAW_MATERIAL'',''FINISHED_GOOD'',''BOTH'') NOT NULL DEFAULT ''BOTH'' AFTER impact_type',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
