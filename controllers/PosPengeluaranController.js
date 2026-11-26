const PosPengeluaran = require("../models/PosPengeluaran");

class PosPengeluaranController {

  static async index(req, res) {
    try {
      const data = await PosPengeluaran.getAll();
      res.json(data);
    } catch (err) {
      console.error("PosPengeluaran index error:", err.message);
      res.status(500).json({ pesan: "Gagal mengambil data pos pengeluaran" });
    }
  }

  static async show(req, res) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ pesan: "ID pos pengeluaran tidak valid" });
    }

    try {
      const data = await PosPengeluaran.getById(id);
      if (!data) {
        return res.status(404).json({ pesan: "Pos pengeluaran tidak ditemukan" });
      }
      res.json(data);
    } catch (err) {
      console.error("PosPengeluaran show error:", err.message);
      res.status(500).json({ pesan: "Gagal mengambil pos pengeluaran" });
    }
  }

  static async store(req, res) {
    const { nama_pos, deskripsi } = req.body;

    if (!nama_pos || typeof nama_pos !== "string" || nama_pos.trim().length === 0) {
      return res.status(400).json({ pesan: "Nama pos pengeluaran wajib diisi" });
    }

    try {
      const data = await PosPengeluaran.create({ nama_pos, deskripsi });
      res.status(201).json({
        pesan: "Pos pengeluaran berhasil ditambahkan",
        data
      });
    } catch (err) {
      console.error("PosPengeluaran store error:", err.message);
      res.status(500).json({ pesan: `Gagal menambahkan pos: ${err.message}` });
    }
  }

  static async update(req, res) {
    const id = Number(req.params.id);
    const { nama_pos, deskripsi } = req.body;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ pesan: "ID pos pengeluaran tidak valid" });
    }

    if (!nama_pos || typeof nama_pos !== "string" || nama_pos.trim().length === 0) {
      return res.status(400).json({ pesan: "Nama pos pengeluaran wajib diisi" });
    }

    try {
      const data = await PosPengeluaran.update(id, { nama_pos, deskripsi });
      if (!data) {
        return res.status(404).json({ pesan: "Pos pengeluaran tidak ditemukan" });
      }
      res.json({
        pesan: "Pos pengeluaran berhasil diperbarui",
        data
      });
    } catch (err) {
      console.error("PosPengeluaran update error:", err.message);
      res.status(500).json({ pesan: `Gagal memperbarui pos: ${err.message}` });
    }
  }

  static async destroy(req, res) {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ pesan: "ID pos pengeluaran tidak valid" });
    }

    try {
      const berhasil = await PosPengeluaran.delete(id);
      if (!berhasil) {
        return res.status(404).json({ pesan: "Pos pengeluaran tidak ditemukan" });
      }
      res.json({ pesan: "Pos pengeluaran berhasil dihapus" });
    } catch (err) {
      console.error("PosPengeluaran destroy error:", err.message);
      res.status(500).json({ pesan: `Gagal menghapus pos: ${err.message}` });
    }
  }
}

module.exports = PosPengeluaranController;
