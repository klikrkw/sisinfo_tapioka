-- Patch: master satuan (unit).
--
-- Tujuan:
--   Menyediakan tabel `units` sebagai sumber pilihan satuan pada master produk,
--   dengan data awal dari satuan produk yang sudah ada.
--
-- Dampak: tabel baru `units`; tabel lama tidak diubah.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + INSERT IGNORE.
--
-- Rollback: lihat 2026-11-15_008_units.down.sql

CREATE TABLE IF NOT EXISTS units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_units_name (name)
);

INSERT IGNORE INTO units (name)
SELECT DISTINCT TRIM(unit) FROM products WHERE unit IS NOT NULL AND TRIM(unit) <> '';

-- Satuan umum sebagai pilihan awal (bisa ditambah/dinonaktifkan di Master → Satuan).
INSERT IGNORE INTO units (name) VALUES ('Kg'), ('Sak'), ('Pcs'), ('Liter'), ('Ton');
