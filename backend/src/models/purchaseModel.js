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

async function findUnstockedHistory() {
  const [rows] = await pool.execute(
    `SELECT f.fruit_id, f.fruit_name, pd.packaging_size,
            SUM(pd.quantity) - COALESCE(sd.sold_quantity, 0) AS available_quantity
     FROM purchase_details pd
     JOIN fruits f ON f.fruit_id = pd.fruit_id
     LEFT JOIN (
       SELECT fruit_id, packaging_size, SUM(quantity) AS sold_quantity
       FROM sales_details
       GROUP BY fruit_id, packaging_size
     ) sd ON sd.fruit_id = pd.fruit_id AND sd.packaging_size = pd.packaging_size
     LEFT JOIN stock st
       ON st.fruit_id = pd.fruit_id AND st.packaging_size = pd.packaging_size
     WHERE st.stock_id IS NULL
     GROUP BY f.fruit_id, f.fruit_name, pd.packaging_size, sd.sold_quantity
     HAVING available_quantity > 0
     ORDER BY f.fruit_name, FIELD(pd.packaging_size,'SMALL','MEDIUM','LARGE')`
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

module.exports = { createHeader, createDetail, findAll, findUnstockedHistory, findById };