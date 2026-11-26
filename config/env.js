const fs = require("fs");
const path = require("path");

/**
 * Zero-dependency .env loader.
 * Di Vercel, environment variables sudah otomatis di-inject ke process.env.
 * Di lokal, fungsi ini membaca file .env jika tersedia.
 */
function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(envPath);
      return;
    }
  } catch {
    // Fallback ke parser manual jika loadEnvFile gagal
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let val = line.slice(eqIndex + 1).trim();

    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadEnv();
