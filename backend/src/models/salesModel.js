const pool = require('../config/db');

// All sales with vendor name.
async function findAll() {
  const [rows] = await pool.execute(
    `SELECT s.sale_id, s.vendor_id, v.vendor_name, s.sale_date,
            s.payment_status, s.total_amount, s.amount_paid, s.payment_method
     FROM sales s
     JOIN vendors v ON v.vendor_id = s.vendor_id
     ORDER BY s.sale_id DESC`
  );
  return rows;
}

async function findById(id) {
  const [headerRows] = await pool.execute(
    `SELECT s.sale_id, s.vendor_id, v.vendor_name, s.sale_date,
            s.payment_status, s.total_amount, s.amount_paid, s.payment_method
     FROM sales s
     JOIN vendors v ON v.vendor_id = s.vendor_id
     WHERE s.sale_id = ?`,
    [id]
  );
  const header = headerRows[0];
  if (!header) return null;

  const [items] = await pool.execute(
    `SELECT sd.sales_detail_id, sd.fruit_id, f.fruit_name,
            sd.packaging_size, sd.quantity, sd.unit_price
     FROM sales_details sd
     JOIN fruits f ON f.fruit_id = sd.fruit_id
     WHERE sd.sale_id = ?
     ORDER BY sd.sales_detail_id`,
    [id]
  );

  return { ...header, items };
}

async function createHeader(conn, vendorId, saleDate, paymentStatus, totalAmount, amountPaid, paymentMethod) {
  const [result] = await conn.execute(
    `INSERT INTO sales (vendor_id, sale_date, payment_status, total_amount, amount_paid, payment_method)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [vendorId, saleDate, paymentStatus, totalAmount, amountPaid, paymentMethod]
  );
  return result.insertId;
}

async function createDetail(conn, saleId, fruitId, packagingSize, quantity, unitPrice) {
  await conn.execute(
    `INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price)
     VALUES (?, ?, ?, ?, ?)`,
    [saleId, fruitId, packagingSize, quantity, unitPrice]
  );
}

// Used by POST /sales/:id/payments
async function addPayment(conn, saleId, extraAmount, newStatus) {
  await conn.execute(
    `UPDATE sales
     SET amount_paid = amount_paid + ?,
         payment_status = ?
     WHERE sale_id = ?`,
    [extraAmount, newStatus, saleId]
  );
}

module.exports = {
  findAll,
  findById,
  createHeader,
  createDetail,
  addPayment
};