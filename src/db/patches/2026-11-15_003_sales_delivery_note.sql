-- Patch: nomor Surat Jalan pada transaksi penjualan.
--
-- Tujuan:
--   Menyimpan nomor surat jalan per penjualan agar stabil saat dicetak ulang.
--   Nomor dibuat otomatis oleh aplikasi dari document_sequences (docType DELIVERY_NOTE,
--   prefix SJ, format SJ/{YYYY}/{MM}/{000001}) saat halaman surat jalan pertama dibuka.
--
-- Dampak: menambah satu kolom nullable; data lama tidak berubah (NULL).
-- Idempotent: dicek ke information_schema, aman dijalankan ulang.
--
-- Rollback: lihat 2026-11-15_003_sales_delivery_note.down.sql

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'delivery_note_number'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE sales ADD COLUMN delivery_note_number VARCHAR(50) NULL AFTER number',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
