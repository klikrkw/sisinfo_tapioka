-- Baseline: kolom nota pembelian pada tabel `purchases`.
--
-- Kolom berikut sudah ditambahkan manual ke database produksi pada 2026-11-07:
--   police_number, po_number, entry_time, exit_date, exit_time
--
-- Patch ini sengaja no-op. Fungsinya hanya mencatat baseline di tabel
-- `schema_patches` agar patch berikutnya berjalan berurutan.
--
-- Rollback: tidak ada perubahan yang perlu dibatalkan.

SELECT 1;
