-- ============================================================
-- MIGRASI DATABASE LENGKAP (SIAP UNTUK VERCEL & CLOUD MYSQL)
-- Kompatibel dengan: Aiven, TiDB Cloud, Railway, Clever Cloud, MySQL 8.0+
-- Urutan tabel disesuaikan dengan Foreign Key dependencies.
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

-- 2. TABEL POS PENGELUARAN
CREATE TABLE IF NOT EXISTS pos_pengeluaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_pos VARCHAR(100) NOT NULL UNIQUE,
  deskripsi TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-- 3. TABEL ANGGOTA (Mendukung Status Aktif, Tidak Aktif, Dialihkan)
CREATE TABLE IF NOT EXISTS anggota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nomor_anggota VARCHAR(50) UNIQUE NULL,
  nama VARCHAR(100) NOT NULL,
  telepon VARCHAR(20) NULL,
  status ENUM('aktif', 'tidak_aktif', 'dialihkan') DEFAULT 'aktif',
  dialihkan_ke_id INT NULL,
  pengalihan_mulai DATE NULL,
  pengalihan_selesai DATE NULL,
  catatan_pengalihan TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_anggota_dialihkan
    FOREIGN KEY (dialihkan_ke_id) REFERENCES anggota(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- 4. TABEL TARIF IURAN BULANAN BERDASARKAN STATUS
CREATE TABLE IF NOT EXISTS tarif_iuran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_anggota VARCHAR(50) UNIQUE NOT NULL,
  nominal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  keterangan VARCHAR(255) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. TABEL EVENT & ALOKASI BUDGET
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

-- 6. TABEL TRANSAKSI KAS
CREATE TABLE IF NOT EXISTS transaksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  keterangan VARCHAR(255) NOT NULL,
  jenis ENUM('masuk', 'keluar') NOT NULL,
  subjek VARCHAR(100) NULL,
  anggota_id INT NULL,
  pos_pengeluaran_id INT NULL,
  event_id INT NULL,
  jumlah DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transaksi_anggota
    FOREIGN KEY (anggota_id) REFERENCES anggota(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_transaksi_pos
    FOREIGN KEY (pos_pengeluaran_id) REFERENCES pos_pengeluaran(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_transaksi_event
    FOREIGN KEY (event_id) REFERENCES event_anggaran(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- ============================================================
-- 7. DATA AWAL (SEEDER IDEMPOTENT)
-- ============================================================

INSERT INTO periode_keuangan (id, nama_periode, tanggal_mulai, tanggal_selesai, is_aktif, keterangan)
VALUES (1, 'Tahun Buku 2026', '2026-01-01', '2026-12-31', 1, 'Periode aktif buku kas tahun anggaran 2026')
ON DUPLICATE KEY UPDATE nama_periode = VALUES(nama_periode);

INSERT INTO pos_pengeluaran (nama_pos, deskripsi) VALUES
  ('Operasional & Kebersihan', 'Biaya listrik, air, dan kebersihan sekretariat'),
  ('Konsumsi & Acara', 'Konsumsi rapat rutin dan kegiatan'),
  ('Administrasi & ATK', 'Kertas, cetak dokumen, dan perlengkapan kas'),
  ('Sosial & Donasi Keluar', 'Sumbangan atau santunan')
ON DUPLICATE KEY UPDATE deskripsi = VALUES(deskripsi);

INSERT INTO anggota (nomor_anggota, nama, telepon, status) VALUES
  ('AGT-001', 'Ahmad Santoso', '081234567890', 'aktif'),
  ('AGT-002', 'Budi Pratama', '081298765432', 'aktif'),
  ('AGT-003', 'Citra Lestari', '081311223344', 'aktif')
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

INSERT INTO tarif_iuran (status_anggota, nominal, keterangan) VALUES
  ('aktif', 50000, 'Iuran bulanan anggota aktif reguler'),
  ('tidak_aktif', 0, 'Anggota berstatus tidak aktif / cuti sementara'),
  ('dialihkan', 50000, 'Iuran dibebankan pada hak keanggotaan yang dialihkan')
ON DUPLICATE KEY UPDATE nominal = VALUES(nominal), keterangan = VALUES(keterangan);

INSERT INTO event_anggaran (id, nama_event, periode_id, anggaran, tanggal_mulai, tanggal_selesai, status, deskripsi)
VALUES (1, 'Peringatan HUT RI Ke-81', 1, 5000000, '2026-08-01', '2026-08-17', 'perencanaan', 'Kegiatan perayaan dan perlombaan HUT RI bersama seluruh anggota')
ON DUPLICATE KEY UPDATE nama_event = VALUES(nama_event);
