const pool = require('../config/db');

// Insert purchase header; called inside a transaction connection.
async function createHeader(conn, supplierId, purchaseDate, totalAmount) {
  const [result] = await conn.execute(
    `INSERT INTO purchases (supplier_id, purchase_date, total_amount)
     VALUES (?, ?, ?)`,
    [supplierId, purchaseDate, totalAmount]
  );
  return result.insertId;
}

// Insert one purchase detail row.
async function createDetail(conn, purchaseId, fruitId, quantity, unitCost, packagingSize) {
  await conn.execute(
    `INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size)
     VALUES (?, ?, ?, ?, ?)`,
    [purchaseId, fruitId, quantity, unitCost, packagingSize]
  );
}

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT p.purchase_id, p.supplier_id, s.business_name,
            p.purchase_date, p.total_amount
     FROM purchases p
     JOIN suppliers s ON s.supplier_id = p.supplier_id
     ORDER BY p.purchase_id DESC`
  );
  return rows;
}

async function findById(id) {
  const [headerRows] = await pool.execute(
    `SELECT p.purchase_id, p.supplier_id, s.business_name,
            p.purchase_date, p.total_amount
     FROM purchases p
     JOIN suppliers s ON s.supplier_id = p.supplier_id
     WHERE p.purchase_id = ?`,
    [id]
  );
  const header = headerRows[0];
  if (!header) return null;

  const [items] = await pool.execute(
    `SELECT pd.purchase_detail_id, pd.fruit_id, f.fruit_name,
            pd.quantity, pd.unit_cost, pd.packaging_size
     FROM purchase_details pd
     JOIN fruits f ON f.fruit_id = pd.fruit_id
     WHERE pd.purchase_id = ?
     ORDER BY pd.purchase_detail_id`,
    [id]
  );

  return { ...header, items };
}

module.exports = { createHeader, createDetail, findAll, findById };