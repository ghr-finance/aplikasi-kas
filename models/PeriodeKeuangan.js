const db = require("../config/database");

class PeriodeKeuangan {
  static async getAll() {
    const [rows] = await db.query(
      "SELECT * FROM periode_keuangan ORDER BY tanggal_mulai DESC"
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute(
      "SELECT * FROM periode_keuangan WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }

  static async getActive() {
    const [rows] = await db.query(
      "SELECT * FROM periode_keuangan WHERE is_aktif = 1 LIMIT 1"
    );
    return rows[0] || null;
  }

  static async create(data) {
    const nama_periode = String(data.nama_periode).trim();
    const tanggal_mulai = data.tanggal_mulai;
    const tanggal_selesai = data.tanggal_selesai;
    const is_aktif = data.is_aktif ? 1 : 0;
    const keterangan = data.keterangan ? String(data.keterangan).trim() : null;

    if (is_aktif) {
      await db.query("UPDATE periode_keuangan SET is_aktif = 0");
    }

    const [result] = await db.execute(
      `INSERT INTO periode_keuangan (nama_periode, tanggal_mulai, tanggal_selesai, is_aktif, keterangan)
       VALUES (?, ?, ?, ?, ?)`,
      [nama_periode, tanggal_mulai, tanggal_selesai, is_aktif, keterangan]
    );

    return this.getById(result.insertId);
  }

  static async update(id, data) {
    const nama_periode = String(data.nama_periode).trim();
    const tanggal_mulai = data.tanggal_mulai;
    const tanggal_selesai = data.tanggal_selesai;
    const is_aktif = data.is_aktif ? 1 : 0;
    const keterangan = data.keterangan ? String(data.keterangan).trim() : null;

    if (is_aktif) {
      await db.execute("UPDATE periode_keuangan SET is_aktif = 0 WHERE id != ?", [id]);
    }

    await db.execute(
      `UPDATE periode_keuangan
       SET nama_periode = ?, tanggal_mulai = ?, tanggal_selesai = ?, is_aktif = ?, keterangan = ?, updated_at = NOW()
       WHERE id = ?`,
      [nama_periode, tanggal_mulai, tanggal_selesai, is_aktif, keterangan, id]
    );

    return this.getById(id);
  }

  static async setActive(id) {
    await db.query("UPDATE periode_keuangan SET is_aktif = 0");
    await db.execute("UPDATE periode_keuangan SET is_aktif = 1, updated_at = NOW() WHERE id = ?", [id]);
    return this.getById(id);
  }

  static async delete(id) {
    const [result] = await db.execute(
      "DELETE FROM periode_keuangan WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = PeriodeKeuangan;
