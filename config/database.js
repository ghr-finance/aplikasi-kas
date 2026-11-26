require("./env");
const mysql = require("mysql2/promise");

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

let poolConfig;

if (databaseUrl) {
  const parsed = new URL(databaseUrl);
  const useSsl =
    process.env.DB_SSL === "true" ||
    parsed.searchParams.get("ssl-mode") === "REQUIRED" ||
    parsed.searchParams.get("ssl") === "true";

  poolConfig = {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 5,
    dateStrings: true,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
  };
} else {
  const useSsl = process.env.DB_SSL === "true";

  poolConfig = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "P@$$v0rt@mysql",
    database: process.env.DB_NAME || "aplikasi_kas",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 5,
    dateStrings: true,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
  };
}

const db = mysql.createPool(poolConfig);

module.exports = db;