const EventAnggaran = require("../models/EventAnggaran");

class EventAnggaranController {
  static async index(req, res) {
    try {
      const data = await EventAnggaran.getAll();
      res.json(data);
    } catch (err) {
      console.error("index EventAnggaran:", err);
      res.status(500).json({ pesan: "Gagal mengambil data event & budget" });
    }
  }

  static async show(req, res) {
    try {
      const data = await EventAnggaran.getById(req.params.id);
      if (!data) return res.status(404).json({ pesan: "Event tidak ditemukan" });
      res.json(data);
    } catch (err) {
      console.error("show EventAnggaran:", err);
      res.status(500).json({ pesan: "Gagal mengambil detail event" });
    }
  }

  static async store(req, res) {
    try {
      const { nama_event, anggaran } = req.body;
      if (!nama_event || anggaran === undefined) {
        return res.status(400).json({ pesan: "Nama event dan anggaran wajib diisi" });
      }

      const hasil = await EventAnggaran.create(req.body);
      res.status(201).json({ pesan: "Event & anggaran berhasil ditambahkan", data: hasil });
    } catch (err) {
      console.error("store EventAnggaran:", err);
      res.status(500).json({ pesan: "Gagal menambahkan event & anggaran" });
    }
  }

  static async update(req, res) {
    try {
      const { nama_event, anggaran } = req.body;
      if (!nama_event || anggaran === undefined) {
        return res.status(400).json({ pesan: "Nama event dan anggaran wajib diisi" });
      }

      const hasil = await EventAnggaran.update(req.params.id, req.body);
      if (!hasil) return res.status(404).json({ pesan: "Event tidak ditemukan" });
      res.json({ pesan: "Event & anggaran berhasil diperbarui", data: hasil });
    } catch (err) {
      console.error("update EventAnggaran:", err);
      res.status(500).json({ pesan: "Gagal memperbarui event & anggaran" });
    }
  }

  static async destroy(req, res) {
    try {
      const berhasil = await EventAnggaran.delete(req.params.id);
      if (!berhasil) return res.status(404).json({ pesan: "Event tidak ditemukan" });
      res.json({ pesan: "Event & anggaran berhasil dihapus" });
    } catch (err) {
      console.error("destroy EventAnggaran:", err);
      res.status(500).json({ pesan: "Gagal menghapus event & anggaran" });
    }
  }
}

module.exports = EventAnggaranController;
