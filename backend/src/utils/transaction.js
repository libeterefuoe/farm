// Wraps a MySQL transaction (BEGIN / COMMIT / ROLLBACK)
// so controllers can focus on business logic.
//
// Usage:
//   const result = await runTransaction(async (conn) => {
//     ... use conn.execute(...) ...
//     return someValue;
//   });

const pool = require('../config/db');

async function runTransaction(callback) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { runTransaction };