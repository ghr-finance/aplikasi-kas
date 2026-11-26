-- ============================================================
-- Migrasi Database: Pengaturan Manajemen Keuangan Administrator
-- 1. Tabel Periode Keuangan & Durasi
-- 2. Pembaruan Tabel Anggota (Status Aktif, Tidak Aktif, Dialihkan & Durasi)
-- 3. Tabel Tarif Iuran Berdasarkan Status Anggota
-- 4. Tabel Event & Alokasi Budget
-- 5. Relasi Transaksi ke Event
-- ============================================================

-- 1. TABEL PERIODE KEUANGAN
CREATE TABLE IF NOT EXISTS periode_keuangan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_periode VARCHAR(100) NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  is_aktif TINYINT(1) DEFAULT 0,
  keterangan TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TABEL TARIF IURAN BULANAN
CREATE TABLE IF NOT EXISTS tarif_iuran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_anggota VARCHAR(50) UNIQUE NOT NULL,
  nominal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  keterangan VARCHAR(255) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. TABEL EVENT & BUDGET
CREATE TABLE IF NOT EXISTS event_anggaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_event VARCHAR(150) NOT NULL,
  periode_id INT NULL,
  anggaran DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tanggal_mulai DATE NULL,
  tanggal_selesai DATE NULL,
  status ENUM('perencanaan', 'berjalan', 'selesai', 'dibatalkan') DEFAULT 'berjalan',
  deskripsi TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_periode
    FOREIGN KEY (periode_id) REFERENCES periode_keuangan(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- 4. PEMBARUAN TABEL ANGGOTA
-- Memperbarui kolom status dan menambah kolom pengalihan keanggotaan
ALTER TABLE anggota 
  MODIFY COLUMN status ENUM('aktif', 'tidak_aktif', 'dialihkan') DEFAULT 'aktif';

-- Tambahkan kolom pengalihan jika belum ada
ALTER TABLE anggota
  ADD COLUMN IF NOT EXISTS dialihkan_ke_id INT NULL AFTER status,
  ADD COLUMN IF NOT EXISTS pengalihan_mulai DATE NULL AFTER dialihkan_ke_id,
  ADD COLUMN IF NOT EXISTS pengalihan_selesai DATE NULL AFTER pengalihan_mulai,
  ADD COLUMN IF NOT EXISTS catatan_pengalihan TEXT NULL AFTER pengalihan_selesai;

-- Foreign key relasi anggota yang dialihkan
ALTER TABLE anggota
  ADD CONSTRAINT fk_anggota_dialihkan
    FOREIGN KEY (dialihkan_ke_id) REFERENCES anggota(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- 5. PEMBARUAN TABEL TRANSAKSI
-- Menambahkan event_id ke transaksi
ALTER TABLE transaksi
  ADD COLUMN IF NOT EXISTS event_id INT NULL AFTER pos_pengeluaran_id;

ALTER TABLE transaksi
  ADD CONSTRAINT fk_transaksi_event
    FOREIGN KEY (event_id) REFERENCES event_anggaran(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- 6. DATA AWAL (SEEDER)
-- Periode Default
INSERT INTO periode_keuangan (nama_periode, tanggal_mulai, tanggal_selesai, is_aktif, keterangan)
VALUES ('Tahun Buku 2026', '2026-01-01', '2026-12-31', 1, 'Periode aktif buku kas tahun anggaran 2026')
ON DUPLICATE KEY UPDATE nama_periode = VALUES(nama_periode);

-- Tarif Iuran Default Berdasarkan Status
INSERT INTO tarif_iuran (status_anggota, nominal, keterangan) VALUES
  ('aktif', 50000, 'Iuran bulanan anggota aktif reguler'),
  ('tidak_aktif', 0, 'Anggota berstatus tidak aktif / cuti sementara'),
  ('dialihkan', 50000, 'Iuran dibebankan pada hak keanggotaan yang dialihkan')
ON DUPLICATE KEY UPDATE nominal = VALUES(nominal), keterangan = VALUES(keterangan);

-- Contoh Event Awal
INSERT INTO event_anggaran (nama_event, periode_id, anggaran, tanggal_mulai, tanggal_selesai, status, deskripsi)
VALUES ('Peringatan HUT RI Ke-81', 1, 5000000, '2026-08-01', '2026-08-17', 'perencanaan', 'Kegiatan perayaan dan perlombaan HUT RI bersama seluruh anggota')
ON DUPLICATE KEY UPDATE nama_event = VALUES(nama_event);
