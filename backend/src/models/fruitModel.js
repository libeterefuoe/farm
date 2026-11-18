const pool = require('../config/db');

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT fruit_id, fruit_name, description, status
     FROM fruits ORDER BY fruit_id`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT fruit_id, fruit_name, description, status
     FROM fruits WHERE fruit_id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findByName(name) {
  const [rows] = await pool.execute(
    `SELECT fruit_id FROM fruits WHERE fruit_name = ?`,
    [name]
  );
  return rows[0] || null;
}

async function create(data) {
  const { fruit_name, description, status } = data;
  const [result] = await pool.execute(
    `INSERT INTO fruits (fruit_name, description, status) VALUES (?, ?, ?)`,
    [fruit_name, description || null, status]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const { fruit_name, description, status } = data;
  await pool.execute(
    `UPDATE fruits SET fruit_name=?, description=?, status=? WHERE fruit_id=?`,
    [fruit_name, description || null, status, id]
  );
  return findById(id);
}

module.exports = { findAll, findById, findByName, create, update };