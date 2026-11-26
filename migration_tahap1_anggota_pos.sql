-- ============================================================
-- Migrasi Database Tahap 1:
-- 1. Tabel Master Anggota
-- 2. Tabel Master Pos Pengeluaran
-- 3. Relasi Subjek, Anggota, dan Pos Pengeluaran pada Tabel Transaksi
-- ============================================================

-- 1. TABEL ANGGOTA
CREATE TABLE IF NOT EXISTS anggota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nomor_anggota VARCHAR(50) UNIQUE NULL,
  nama VARCHAR(100) NOT NULL,
  telepon VARCHAR(20) NULL,
  status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TABEL POS PENGELUARAN
CREATE TABLE IF NOT EXISTS pos_pengeluaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_pos VARCHAR(100) NOT NULL,
  deskripsi TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-- 3. PENYESUAIAN TABEL TRANSAKSI
-- Menambahkan kolom subjek, anggota_id, dan pos_pengeluaran_id
ALTER TABLE transaksi
  ADD COLUMN subjek VARCHAR(100) NULL AFTER jenis,
  ADD COLUMN anggota_id INT NULL AFTER subjek,
  ADD COLUMN pos_pengeluaran_id INT NULL AFTER anggota_id;

-- Menambahkan Foreign Key Constraints
ALTER TABLE transaksi
  ADD CONSTRAINT fk_transaksi_anggota
    FOREIGN KEY (anggota_id) REFERENCES anggota(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  ADD CONSTRAINT fk_transaksi_pos
    FOREIGN KEY (pos_pengeluaran_id) REFERENCES pos_pengeluaran(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- 4. DATA AWAL (SEEDER) CONTOH (OPSIONAL)
-- Contoh Pos Pengeluaran Standar
INSERT INTO pos_pengeluaran (nama_pos, deskripsi) VALUES
  ('Operasional & Kebersihan', 'Biaya listrik, air, dan kebersihan sekretariat'),
  ('Konsumsi & Acara', 'Konsumsi rapat rutin dan kegiatan'),
  ('Administrasi & ATK', 'Kertas, cetak dokumen, dan perlengkapan kas'),
  ('Sosial & Donasi Keluar', 'Sumbangan atau santunan')
ON DUPLICATE KEY UPDATE nama_pos = VALUES(nama_pos);

-- Contoh Data Anggota Awal
INSERT INTO anggota (nomor_anggota, nama, telepon, status) VALUES
  ('AGT-001', 'Ahmad Santoso', '081234567890', 'aktif'),
  ('AGT-002', 'Budi Pratama', '081298765432', 'aktif'),
  ('AGT-003', 'Citra Lestari', '081311223344', 'aktif')
ON DUPLICATE KEY UPDATE nama = VALUES(nama);
