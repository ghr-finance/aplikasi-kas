const db = require("../config/database");

class Transaksi {

  static async getAll() {
    const [rows] = await db.query(`
      SELECT 
        t.*,
        a.nama AS nama_anggota,
        a.nomor_anggota,
        p.nama_pos AS nama_pos_pengeluaran,
        e.nama_event
      FROM transaksi t
      LEFT JOIN anggota a ON t.anggota_id = a.id
      LEFT JOIN pos_pengeluaran p ON t.pos_pengeluaran_id = p.id
      LEFT JOIN event_anggaran e ON t.event_id = e.id
      ORDER BY t.tanggal DESC, t.id DESC
    `);

    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute(`
      SELECT 
        t.*,
        a.nama AS nama_anggota,
        a.nomor_anggota,
        p.nama_pos AS nama_pos_pengeluaran,
        e.nama_event
      FROM transaksi t
      LEFT JOIN anggota a ON t.anggota_id = a.id
      LEFT JOIN pos_pengeluaran p ON t.pos_pengeluaran_id = p.id
      LEFT JOIN event_anggaran e ON t.event_id = e.id
      WHERE t.id = ?
    `, [id]);

    return rows[0] || null;
  }

  static async create(data) {
    const subjek = data.subjek ? String(data.subjek).trim() : null;
    const anggota_id = (data.anggota_id && Number(data.anggota_id) > 0) ? Number(data.anggota_id) : null;
    const pos_pengeluaran_id = (data.pos_pengeluaran_id && Number(data.pos_pengeluaran_id) > 0) ? Number(data.pos_pengeluaran_id) : null;
    const event_id = (data.event_id && Number(data.event_id) > 0) ? Number(data.event_id) : null;

    const [result] = await db.execute(
      `INSERT INTO transaksi
       (tanggal, keterangan, jenis, jumlah, subjek, anggota_id, pos_pengeluaran_id, event_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        data.tanggal,
        data.keterangan,
        data.jenis,
        data.jumlah,
        subjek,
        anggota_id,
        pos_pengeluaran_id,
        event_id
      ]
    );

    return this.getById(result.insertId);
  }

  static async update(id, data) {
    const subjek = data.subjek ? String(data.subjek).trim() : null;
    const anggota_id = (data.anggota_id && Number(data.anggota_id) > 0) ? Number(data.anggota_id) : null;
    const pos_pengeluaran_id = (data.pos_pengeluaran_id && Number(data.pos_pengeluaran_id) > 0) ? Number(data.pos_pengeluaran_id) : null;
    const event_id = (data.event_id && Number(data.event_id) > 0) ? Number(data.event_id) : null;

    const [result] = await db.execute(
      `UPDATE transaksi
       SET tanggal            = ?,
           keterangan         = ?,
           jenis              = ?,
           jumlah             = ?,
           subjek             = ?,
           anggota_id         = ?,
           pos_pengeluaran_id = ?,
           event_id           = ?,
           updated_at         = NOW()
       WHERE id = ?`,
      [
        data.tanggal,
        data.keterangan,
        data.jenis,
        data.jumlah,
        subjek,
        anggota_id,
        pos_pengeluaran_id,
        event_id,
        id
      ]
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
      "DELETE FROM transaksi WHERE id = ?",
      [id]
    );

    return result.affectedRows > 0;
  }

  static async getSaldo() {
    const [rows] = await db.query(`
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN jenis = 'masuk' THEN jumlah
              ELSE -jumlah
            END
          ), 0
        ) AS saldo
      FROM transaksi
    `);

    return Number(rows[0].saldo);
  }
}

module.exports = Transaksi;
