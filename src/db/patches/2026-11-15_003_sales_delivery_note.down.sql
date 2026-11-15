-- Rollback: nomor Surat Jalan pada transaksi penjualan.
--
-- Jalankan MANUAL bila perlu membatalkan 2026-11-15_003_sales_delivery_note.sql,
-- lalu hapus barisnya dari tabel `schema_patches`.
--
-- PERINGATAN: nomor surat jalan yang tersimpan akan hilang. Backup terlebih dahulu.

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'delivery_note_number'
);
SET @sql := IF(@has_col > 0,
  'ALTER TABLE sales DROP COLUMN delivery_note_number',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
