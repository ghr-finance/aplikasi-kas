const TarifIuran = require("../models/TarifIuran");

class TarifIuranController {
  static async index(req, res) {
    try {
      const data = await TarifIuran.getAll();
      res.json(data);
    } catch (err) {
      console.error("index TarifIuran:", err);
      res.status(500).json({ pesan: "Gagal mengambil data tarif iuran" });
    }
  }

  static async show(req, res) {
    try {
      const data = await TarifIuran.getByStatus(req.params.status);
      if (!data) return res.status(404).json({ pesan: "Tarif untuk status tersebut belum diatur" });
      res.json(data);
    } catch (err) {
      console.error("show TarifIuran:", err);
      res.status(500).json({ pesan: "Gagal mengambil tarif iuran" });
    }
  }

  static async update(req, res) {
    try {
      const { status } = req.params;
      const { nominal, keterangan } = req.body;

      if (nominal === undefined || isNaN(Number(nominal))) {
        return res.status(400).json({ pesan: "Nominal iuran harus berupa angka valid" });
      }

      const hasil = await TarifIuran.update(status, { nominal, keterangan });
      res.json({ pesan: `Tarif iuran untuk status ${status} berhasil diperbarui`, data: hasil });
    } catch (err) {
      console.error("update TarifIuran:", err);
      res.status(500).json({ pesan: "Gagal memperbarui tarif iuran" });
    }
  }
}

module.exports = TarifIuranController;
