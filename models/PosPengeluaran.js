const db = require("../config/database");

class PosPengeluaran {

  static async getAll() {
    const [rows] = await db.query(
      "SELECT * FROM pos_pengeluaran ORDER BY nama_pos ASC"
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute(
      "SELECT * FROM pos_pengeluaran WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const nama_pos = String(data.nama_pos).trim();
    const deskripsi = data.deskripsi ? String(data.deskripsi).trim() : null;

    const [result] = await db.execute(
      `INSERT INTO pos_pengeluaran (nama_pos, deskripsi, updated_at)
       VALUES (?, ?, NULL)`,
      [nama_pos, deskripsi]
    );

    return this.getById(result.insertId);
  }

  static async update(id, data) {
    const nama_pos = String(data.nama_pos).trim();
    const deskripsi = data.deskripsi ? String(data.deskripsi).trim() : null;

    const [result] = await db.execute(
      `UPDATE pos_pengeluaran
       SET nama_pos   = ?,
           deskripsi  = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [nama_pos, deskripsi, id]
    );

    if (result.affectedRows === 0) {
      const existing = await this.getById(id);
      if (!existing) return null;
      return existing;
    }

    return this.getById(id);
  }

  static async delete(id) {
    const [result] = await db.execute(
      "DELETE FROM pos_pengeluaran WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = PosPengeluaran;
