const pool = require('../config/db');

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT supplier_id, business_name, contact_person, phone, province, address
     FROM suppliers ORDER BY supplier_id`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT supplier_id, business_name, contact_person, phone, province, address
     FROM suppliers WHERE supplier_id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const { business_name, contact_person, phone, province, address } = data;
  const [result] = await pool.execute(
    `INSERT INTO suppliers (business_name, contact_person, phone, province, address)
     VALUES (?, ?, ?, ?, ?)`,
    [business_name, contact_person, phone, province, address]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const { business_name, contact_person, phone, province, address } = data;
  await pool.execute(
    `UPDATE suppliers SET business_name=?, contact_person=?, phone=?, province=?, address=?
     WHERE supplier_id=?`,
    [business_name, contact_person, phone, province, address, id]
  );
  return findById(id);
}

async function hasPurchases(id) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt FROM purchases WHERE supplier_id = ?`,
    [id]
  );
  return rows[0].cnt > 0;
}

async function remove(id) {
  await pool.execute(`DELETE FROM suppliers WHERE supplier_id = ?`, [id]);
}

module.exports = { findAll, findById, create, update, hasPurchases, remove };