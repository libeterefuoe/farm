const pool = require('../config/db');

// All vendors with their outstanding balance:
// outstanding = SUM(sales.total_amount) - SUM(sales.amount_paid)
async function findAllWithBalance() {
  const [rows] = await pool.execute(
    `SELECT v.vendor_id, v.vendor_name, v.phone_number, v.location, v.registration_date,
            COALESCE(SUM(s.total_amount - s.amount_paid), 0) AS outstanding_balance
     FROM vendors v
     LEFT JOIN sales s ON s.vendor_id = v.vendor_id
     GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location, v.registration_date
     ORDER BY v.vendor_id`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT vendor_id, vendor_name, phone_number, location, registration_date
     FROM vendors WHERE vendor_id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function searchByNameOrPhone(term) {
  const like = `%${term}%`;
  const [rows] = await pool.execute(
    `SELECT v.vendor_id, v.vendor_name, v.phone_number, v.location, v.registration_date,
            COALESCE(SUM(s.total_amount - s.amount_paid), 0) AS outstanding_balance
     FROM vendors v
     LEFT JOIN sales s ON s.vendor_id = v.vendor_id
     WHERE v.vendor_name LIKE ? OR v.phone_number LIKE ?
     GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location, v.registration_date
     ORDER BY v.vendor_id`,
    [like, like]
  );
  return rows;
}

async function create(data) {
  const { vendor_name, phone_number, location, registration_date } = data;
  const [result] = await pool.execute(
    `INSERT INTO vendors (vendor_name, phone_number, location, registration_date)
     VALUES (?, ?, ?, ?)`,
    [vendor_name, phone_number, location, registration_date]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const { vendor_name, phone_number, location, registration_date } = data;
  await pool.execute(
    `UPDATE vendors SET vendor_name=?, phone_number=?, location=?, registration_date=?
     WHERE vendor_id=?`,
    [vendor_name, phone_number, location, registration_date, id]
  );
  return findById(id);
}

module.exports = { findAllWithBalance, findById, searchByNameOrPhone, create, update };