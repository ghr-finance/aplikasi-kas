const db = require("../config/database");

class EventAnggaran {
  static async getAll() {
    // Ambil event sekaligus total realisasi pengeluaran kas yang terkait event tersebut
    const [rows] = await db.query(`
      SELECT 
        e.*,
        p.nama_periode,
        COALESCE(SUM(CASE WHEN t.jenis = 'keluar' THEN t.jumlah ELSE 0 END), 0) AS total_pengeluaran,
        COALESCE(SUM(CASE WHEN t.jenis = 'masuk' THEN t.jumlah ELSE 0 END), 0) AS total_pemasukan,
        (e.anggaran - COALESCE(SUM(CASE WHEN t.jenis = 'keluar' THEN t.jumlah ELSE 0 END), 0)) AS sisa_anggaran
      FROM event_anggaran e
      LEFT JOIN periode_keuangan p ON e.periode_id = p.id
      LEFT JOIN transaksi t ON t.event_id = e.id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute(`
      SELECT 
        e.*,
        p.nama_periode,
        COALESCE(SUM(CASE WHEN t.jenis = 'keluar' THEN t.jumlah ELSE 0 END), 0) AS total_pengeluaran,
        COALESCE(SUM(CASE WHEN t.jenis = 'masuk' THEN t.jumlah ELSE 0 END), 0) AS total_pemasukan,
        (e.anggaran - COALESCE(SUM(CASE WHEN t.jenis = 'keluar' THEN t.jumlah ELSE 0 END), 0)) AS sisa_anggaran
      FROM event_anggaran e
      LEFT JOIN periode_keuangan p ON e.periode_id = p.id
      LEFT JOIN transaksi t ON t.event_id = e.id
      WHERE e.id = ?
      GROUP BY e.id
    `, [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const nama_event = String(data.nama_event).trim();
    const periode_id = data.periode_id ? Number(data.periode_id) : null;
    const anggaran = Number(data.anggaran) || 0;
    const tanggal_mulai = data.tanggal_mulai || null;
    const tanggal_selesai = data.tanggal_selesai || null;
    const status = data.status || "berjalan";
    const deskripsi = data.deskripsi ? String(data.deskripsi).trim() : null;

    const [result] = await db.execute(`
      INSERT INTO event_anggaran (nama_event, periode_id, anggaran, tanggal_mulai, tanggal_selesai, status, deskripsi)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [nama_event, periode_id, anggaran, tanggal_mulai, tanggal_selesai, status, deskripsi]);

    return this.getById(result.insertId);
  }

  static async update(id, data) {
    const nama_event = String(data.nama_event).trim();
    const periode_id = data.periode_id ? Number(data.periode_id) : null;
    const anggaran = Number(data.anggaran) || 0;
    const tanggal_mulai = data.tanggal_mulai || null;
    const tanggal_selesai = data.tanggal_selesai || null;
    const status = data.status || "berjalan";
    const deskripsi = data.deskripsi ? String(data.deskripsi).trim() : null;

    await db.execute(`
      UPDATE event_anggaran
      SET nama_event = ?, periode_id = ?, anggaran = ?, tanggal_mulai = ?, tanggal_selesai = ?, status = ?, deskripsi = ?, updated_at = NOW()
      WHERE id = ?
    `, [nama_event, periode_id, anggaran, tanggal_mulai, tanggal_selesai, status, deskripsi, id]);

    return this.getById(id);
  }

  static async delete(id) {
    const [result] = await db.execute(
      "DELETE FROM event_anggaran WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = EventAnggaran;
