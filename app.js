require("./config/env");
const path = require("path");
const express = require("express");
const app = express();

const transaksiRoutes = require("./routes/transaksiRoutes");
const anggotaRoutes = require("./routes/anggotaRoutes");
const posPengeluaranRoutes = require("./routes/posPengeluaranRoutes");
const periodeKeuanganRoutes = require("./routes/periodeKeuanganRoutes");
const tarifIuranRoutes = require("./routes/tarifIuranRoutes");
const eventAnggaranRoutes = require("./routes/eventAnggaranRoutes");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/transaksi", transaksiRoutes);
app.use("/api/anggota", anggotaRoutes);
app.use("/api/pos-pengeluaran", posPengeluaranRoutes);
app.use("/api/periode-keuangan", periodeKeuanganRoutes);
app.use("/api/tarif-iuran", tarifIuranRoutes);
app.use("/api/event-anggaran", eventAnggaranRoutes);

// Healthcheck endpoint untuk verifikasi deployment Vercel
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
});

// Hanya jalankan server HTTP jika dieksekusi langsung (lokal),
// di Vercel aplikasi di-export sebagai Serverless Function handler.
if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3025;
  app.listen(PORT, () => {
    console.log(`Aplikasi berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
