const PeriodeKeuangan = require("../models/PeriodeKeuangan");

class PeriodeKeuanganController {
  static async index(req, res) {
    try {
      const data = await PeriodeKeuangan.getAll();
      res.json(data);
    } catch (err) {
      console.error("index PeriodeKeuangan:", err);
      res.status(500).json({ pesan: "Gagal mengambil data periode keuangan" });
    }
  }

  static async getActive(req, res) {
    try {
      const data = await PeriodeKeuangan.getActive();
      res.json(data);
    } catch (err) {
      console.error("getActive PeriodeKeuangan:", err);
      res.status(500).json({ pesan: "Gagal mengambil periode aktif" });
    }
  }

  static async show(req, res) {
    try {
      const data = await PeriodeKeuangan.getById(req.params.id);
      if (!data) return res.status(404).json({ pesan: "Periode tidak ditemukan" });
      res.json(data);
    } catch (err) {
      console.error("show PeriodeKeuangan:", err);
      res.status(500).json({ pesan: "Gagal mengambil detail periode" });
    }
  }

  static async store(req, res) {
    try {
      const { nama_periode, tanggal_mulai, tanggal_selesai } = req.body;
      if (!nama_periode || !tanggal_mulai || !tanggal_selesai) {
        return res.status(400).json({ pesan: "Nama periode, tanggal mulai, dan tanggal selesai wajib diisi" });
      }

      const hasil = await PeriodeKeuangan.create(req.body);
      res.status(201).json({ pesan: "Periode keuangan berhasil ditambahkan", data: hasil });
    } catch (err) {
      console.error("store PeriodeKeuangan:", err);
      res.status(500).json({ pesan: "Gagal menambahkan periode keuangan" });
    }
  }

  static async update(req, res) {
    try {
      const { nama_periode, tanggal_mulai, tanggal_selesai } = req.body;
      if (!nama_periode || !tanggal_mulai || !tanggal_selesai) {
        return res.status(400).json({ pesan: "Nama periode, tanggal mulai, dan tanggal selesai wajib diisi" });
      }

      const hasil = await PeriodeKeuangan.update(req.params.id, req.body);
      if (!hasil) return res.status(404).json({ pesan: "Periode tidak ditemukan" });
      res.json({ pesan: "Periode keuangan berhasil diperbarui", data: hasil });
    } catch (err) {
      console.error("update PeriodeKeuangan:", err);
      res.status(500).json({ pesan: "Gagal memperbarui periode keuangan" });
    }
  }

  static async setActive(req, res) {
    try {
      const hasil = await PeriodeKeuangan.setActive(req.params.id);
      if (!hasil) return res.status(404).json({ pesan: "Periode tidak ditemukan" });
      res.json({ pesan: "Periode aktif berhasil diubah", data: hasil });
    } catch (err) {
      console.error("setActive PeriodeKeuangan:", err);
      res.status(500).json({ pesan: "Gagal menetapkan periode aktif" });
    }
  }

  static async destroy(req, res) {
    try {
      const berhasil = await PeriodeKeuangan.delete(req.params.id);
      if (!berhasil) return res.status(404).json({ pesan: "Periode tidak ditemukan" });
      res.json({ pesan: "Periode keuangan berhasil dihapus" });
    } catch (err) {
      console.error("destroy PeriodeKeuangan:", err);
      res.status(500).json({ pesan: "Gagal menghapus periode keuangan" });
    }
  }
}

module.exports = PeriodeKeuanganController;
