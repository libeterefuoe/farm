// MySQL connection pool using mysql2/promise.
// All credentials come from .env ONLY.
// If the DB is down, this module must NOT crash the process.

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true   // return DECIMAL as Number, not String
});

// Log pool-level errors so the app never dies silently.
pool.on('error', (err) => {
  console.error('[db] Pool error:', err.code || err.message);
});

// Simple health-check helper used by /api/health and startup.
async function pingDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
    return true;
  } finally {
    conn.release();
  }
}

module.exports = pool;
module.exports.pingDatabase = pingDatabase;