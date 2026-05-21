import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// ─── Connection Pool ──────────────────────────────────────────────────────────
// Pool reuses connections instead of opening a new one per request,
// which is critical under concurrent load.

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "school_management",
  waitForConnections: true,
  connectionLimit: 10,       // max simultaneous connections
  queueLimit: 0,             // unlimited queue
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// ─── Health Check ─────────────────────────────────────────────────────────────

export const testConnection = async (): Promise<void> => {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
};

export default pool;
