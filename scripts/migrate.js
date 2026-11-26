const fs = require("fs");
const path = require("path");
const db = require("../config/database");

async function migrate() {
  try {
    const sqlPath = path.resolve(__dirname, "..", "database_vercel.sql");
    const rawSql = fs.readFileSync(sqlPath, "utf8");

    // Hapus komentar baris (--) lalu pisahkan berdasarkan titik koma
    const cleanedSql = rawSql
      .split(/\r?\n/)
      .filter(line => !line.trim().startsWith("--"))
      .join("\n");

    const statements = cleanedSql
      .split(/;\s*(?:\r?\n|$)/)
      .map(s => s.trim())
      .filter(Boolean);

    console.log(`Memulai migrasi ke database (${statements.length} perintah SQL)...`);

    for (const stmt of statements) {
      await db.query(stmt);
    }

    console.log("Migrasi database selesai tanpa error!");
    await db.end();
    process.exit(0);
  } catch (err) {
    console.error("Gagal menjalankan migrasi database:", err.message);
    process.exit(1);
  }
}

migrate();
