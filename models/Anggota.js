const db = require("../config/database");

class Anggota {
  static async getAll() {
    const [rows] = await db.query(`
      SELECT 
        a.*,
        p.nama AS nama_dialihkan_ke,
        p.nomor_anggota AS nomor_dialihkan_ke
      FROM anggota a
      LEFT JOIN anggota p ON a.dialihkan_ke_id = p.id
      ORDER BY a.nama ASC
    `);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute(`
      SELECT 
        a.*,
        p.nama AS nama_dialihkan_ke,
        p.nomor_anggota AS nomor_dialihkan_ke
      FROM anggota a
      LEFT JOIN anggota p ON a.dialihkan_ke_id = p.id
      WHERE a.id = ?
    `, [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const nomor_anggota = data.nomor_anggota ? String(data.nomor_anggota).trim() : null;
    const nama = String(data.nama).trim();
    const telepon = data.telepon ? String(data.telepon).trim() : null;
    
    // Normalisasi status
    let status = "aktif";
    if (data.status === "tidak_aktif" || data.status === "nonaktif") {
      status = "tidak_aktif";
    } else if (data.status === "dialihkan") {
      status = "dialihkan";
    }

    const dialihkan_ke_id = status === "dialihkan" && data.dialihkan_ke_id ? Number(data.dialihkan_ke_id) : null;
    const pengalihan_mulai = status === "dialihkan" ? (data.pengalihan_mulai || null) : null;
    const pengalihan_selesai = status === "dialihkan" ? (data.pengalihan_selesai || null) : null;
    const catatan_pengalihan = status === "dialihkan" && data.catatan_pengalihan ? String(data.catatan_pengalihan).trim() : null;

    const [result] = await db.execute(`
      INSERT INTO anggota (
        nomor_anggota, nama, telepon, status, 
        dialihkan_ke_id, pengalihan_mulai, pengalihan_selesai, catatan_pengalihan, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `, [nomor_anggota, nama, telepon, status, dialihkan_ke_id, pengalihan_mulai, pengalihan_selesai, catatan_pengalihan]);

    return this.getById(result.insertId);
  }

  static async update(id, data) {
    const nomor_anggota = data.nomor_anggota ? String(data.nomor_anggota).trim() : null;
    const nama = String(data.nama).trim();
    const telepon = data.telepon ? String(data.telepon).trim() : null;

    let status = "aktif";
    if (data.status === "tidak_aktif" || data.status === "nonaktif") {
      status = "tidak_aktif";
    } else if (data.status === "dialihkan") {
      status = "dialihkan";
    }

    const dialihkan_ke_id = status === "dialihkan" && data.dialihkan_ke_id ? Number(data.dialihkan_ke_id) : null;
    const pengalihan_mulai = status === "dialihkan" ? (data.pengalihan_mulai || null) : null;
    const pengalihan_selesai = status === "dialihkan" ? (data.pengalihan_selesai || null) : null;
    const catatan_pengalihan = status === "dialihkan" && data.catatan_pengalihan ? String(data.catatan_pengalihan).trim() : null;

    await db.execute(`
      UPDATE anggota
      SET nomor_anggota       = ?,
          nama                = ?,
          telepon             = ?,
          status              = ?,
          dialihkan_ke_id     = ?,
          pengalihan_mulai    = ?,
          pengalihan_selesai  = ?,
          catatan_pengalihan  = ?,
          updated_at          = NOW()
      WHERE id = ?
    `, [nomor_anggota, nama, telepon, status, dialihkan_ke_id, pengalihan_mulai, pengalihan_selesai, catatan_pengalihan, id]);

    return this.getById(id);
  }

  static async delete(id) {
    const [result] = await db.execute(
      "DELETE FROM anggota WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Anggota;
