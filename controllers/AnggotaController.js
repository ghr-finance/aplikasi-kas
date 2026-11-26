const Anggota = require("../models/Anggota");

class AnggotaController {

  static async index(req, res) {
    try {
      const data = await Anggota.getAll();
      res.json(data);
    } catch (err) {
      console.error("Anggota index error:", err.message);
      res.status(500).json({ pesan: "Gagal mengambil data anggota" });
    }
  }

  static async show(req, res) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ pesan: "ID anggota tidak valid" });
    }

    try {
      const data = await Anggota.getById(id);
      if (!data) {
        return res.status(404).json({ pesan: "Anggota tidak ditemukan" });
      }
      res.json(data);
    } catch (err) {
      console.error("Anggota show error:", err.message);
      res.status(500).json({ pesan: "Gagal mengambil anggota" });
    }
  }

  static async store(req, res) {
    const { nama, nomor_anggota, telepon, status, dialihkan_ke_id, pengalihan_mulai, pengalihan_selesai, catatan_pengalihan } = req.body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return res.status(400).json({ pesan: "Nama anggota wajib diisi" });
    }

    try {
      const data = await Anggota.create({ 
        nama, 
        nomor_anggota, 
        telepon, 
        status, 
        dialihkan_ke_id, 
        pengalihan_mulai, 
        pengalihan_selesai, 
        catatan_pengalihan 
      });
      res.status(201).json({
        pesan: "Anggota berhasil ditambahkan",
        data
      });
    } catch (err) {
      console.error("Anggota store error:", err.message);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ pesan: "Nomor anggota sudah digunakan" });
      }
      res.status(500).json({ pesan: `Gagal menambahkan anggota: ${err.message}` });
    }
  }

  static async update(req, res) {
    const id = Number(req.params.id);
    const { nama, nomor_anggota, telepon, status, dialihkan_ke_id, pengalihan_mulai, pengalihan_selesai, catatan_pengalihan } = req.body;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ pesan: "ID anggota tidak valid" });
    }

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return res.status(400).json({ pesan: "Nama anggota wajib diisi" });
    }

    try {
      const data = await Anggota.update(id, { 
        nama, 
        nomor_anggota, 
        telepon, 
        status, 
        dialihkan_ke_id, 
        pengalihan_mulai, 
        pengalihan_selesai, 
        catatan_pengalihan 
      });
      if (!data) {
        return res.status(404).json({ pesan: "Anggota tidak ditemukan" });
      }
      res.json({
        pesan: "Data anggota berhasil diperbarui",
        data
      });
    } catch (err) {
      console.error("Anggota update error:", err.message);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ pesan: "Nomor anggota sudah digunakan" });
      }
      res.status(500).json({ pesan: `Gagal memperbarui anggota: ${err.message}` });
    }
  }

  static async destroy(req, res) {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ pesan: "ID anggota tidak valid" });
    }

    try {
      const berhasil = await Anggota.delete(id);
      if (!berhasil) {
        return res.status(404).json({ pesan: "Anggota tidak ditemukan" });
      }
      res.json({ pesan: "Anggota berhasil dihapus" });
    } catch (err) {
      console.error("Anggota destroy error:", err.message);
      res.status(500).json({ pesan: `Gagal menghapus anggota: ${err.message}` });
    }
  }
}

module.exports = AnggotaController;
