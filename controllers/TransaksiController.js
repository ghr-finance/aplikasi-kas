
const Transaksi = require("../models/Transaksi");

class TransaksiController {

  static async index(req, res) {
    try {
      const data = await Transaksi.getAll();
      res.json(data);
    } catch (err) {
      console.error("index:", err.message);
      res.status(500).json({ pesan: "Gagal mengambil data transaksi" });
    }
  }

  static async show(req, res) {
    try {
      const data = await Transaksi.getById(Number(req.params.id));

      if (!data) {
        return res.status(404).json({
          pesan: "Transaksi tidak ditemukan"
        });
      }

      res.json(data);
    } catch (err) {
      console.error("show:", err.message);
      res.status(500).json({ pesan: "Gagal mengambil transaksi" });
    }
  }

  static async store(req, res) {
    const { tanggal, keterangan, jenis, jumlah, subjek, anggota_id, pos_pengeluaran_id, event_id } = req.body;

    if (!TransaksiController.validasi(req.body)) {
      return res.status(400).json({
        pesan: "Data transaksi tidak valid"
      });
    }

    try {
      const data = await Transaksi.create({
        tanggal,
        keterangan,
        jenis,
        jumlah,
        subjek,
        anggota_id,
        pos_pengeluaran_id,
        event_id
      });

      res.status(201).json({
        pesan: "Transaksi berhasil disimpan",
        data
      });
    } catch (err) {
      console.error("store:", err.message);
      res.status(500).json({ pesan: `Gagal menyimpan: ${err.message}` });
    }
  }

  static async update(req, res) {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0 ||
      !TransaksiController.validasi(req.body)) {
      return res.status(400).json({
        pesan: "Data transaksi tidak valid"
      });
    }

    try {
      const data = await Transaksi.update(id, req.body);

      if (!data) {
        return res.status(404).json({
          pesan: "Transaksi tidak ditemukan"
        });
      }

      res.json({
        pesan: "Transaksi berhasil diperbarui",
        data
      });
    } catch (err) {
      console.error("update:", err.message);
      res.status(500).json({ pesan: `Gagal memperbarui: ${err.message}` });
    }
  }

  static async destroy(req, res) {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        pesan: "ID tidak valid"
      });
    }

    try {
      const berhasil = await Transaksi.delete(id);

      if (!berhasil) {
        return res.status(404).json({
          pesan: "Transaksi tidak ditemukan"
        });
      }

      res.json({
        pesan: "Transaksi berhasil dihapus"
      });
    } catch (err) {
      console.error("destroy:", err.message);
      res.status(500).json({ pesan: `Gagal menghapus: ${err.message}` });
    }
  }

  static async saldo(req, res) {
    try {
      const saldo = await Transaksi.getSaldo();
      res.json({ saldo });
    } catch (err) {
      console.error("saldo:", err.message);
      res.status(500).json({ pesan: "Gagal mengambil saldo" });
    }
  }

  static validasi(data) {
    const { tanggal, keterangan, jenis, jumlah } = data;

    const tanggalValid =
      typeof tanggal === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(tanggal) &&
      !Number.isNaN(Date.parse(tanggal));

    return (
      tanggalValid &&
      typeof keterangan === "string" &&
      keterangan.trim().length > 0 &&
      ["masuk", "keluar"].includes(jenis) &&
      jumlah !== "" &&
      jumlah !== null &&
      jumlah !== undefined &&
      Number.isFinite(Number(jumlah)) &&
      Number(jumlah) > 0
    );
  }
}

module.exports = TransaksiController;
