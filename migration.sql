-- ============================================================
-- Migration: Konfigurasi Timestamp Tabel Transaksi
-- ============================================================

-- 1. Pastikan kolom created_at terisi otomatis saat data dibuat
-- ALTER TABLE transaksi ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Pastikan updated_at bernilai NULL secara default (hanya terisi saat diedit)
ALTER TABLE transaksi
  MODIFY COLUMN updated_at TIMESTAMP NULL DEFAULT NULL;

-- 3. Reset data yang nilai updated_at-nya masih sama dengan created_at menjadi NULL
UPDATE transaksi
SET updated_at = NULL
WHERE updated_at = created_at;
