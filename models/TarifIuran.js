const db = require("../config/database");

class TarifIuran {
  static async getAll() {
    const [rows] = await db.query(
      "SELECT * FROM tarif_iuran ORDER BY id ASC"
    );
    return rows;
  }

  static async getByStatus(status) {
    const [rows] = await db.execute(
      "SELECT * FROM tarif_iuran WHERE status_anggota = ?",
      [status]
    );
    return rows[0] || null;
  }

  static async update(status_anggota, data) {
    const nominal = Number(data.nominal) || 0;
    const keterangan = data.keterangan ? String(data.keterangan).trim() : null;

    const [existing] = await db.execute(
      "SELECT * FROM tarif_iuran WHERE status_anggota = ?",
      [status_anggota]
    );

    if (existing.length === 0) {
      await db.execute(
        `INSERT INTO tarif_iuran (status_anggota, nominal, keterangan) VALUES (?, ?, ?)`,
        [status_anggota, nominal, keterangan]
      );
    } else {
      await db.execute(
        `UPDATE tarif_iuran SET nominal = ?, keterangan = ?, updated_at = NOW() WHERE status_anggota = ?`,
        [nominal, keterangan, status_anggota]
      );
    }

    return this.getByStatus(status_anggota);
  }
}

module.exports = TarifIuran;
