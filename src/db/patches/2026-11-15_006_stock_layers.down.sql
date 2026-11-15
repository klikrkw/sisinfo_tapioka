-- Rollback: layer stok untuk HPP FIFO.
-- Jalankan manual, lalu hapus baris '2026-11-15_006_stock_layers.sql' dari schema_patches.

DROP TABLE IF EXISTS stock_layer_usages;
DROP TABLE IF EXISTS stock_layers;
