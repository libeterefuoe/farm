const pool = require('../config/db');

// Report 1: Top 5 most frequently sold fruits by BOXES sold.
async function topFruits() {
  const [rows] = await pool.execute(
    `SELECT f.fruit_id, f.fruit_name,
            SUM(sd.quantity) AS total_boxes_sold
     FROM sales_details sd
     JOIN fruits f ON f.fruit_id = sd.fruit_id
     GROUP BY f.fruit_id, f.fruit_name
     ORDER BY total_boxes_sold DESC
     LIMIT 5`
  );
  return rows;
}

// Report 2: Total sales revenue in a date range.
async function revenueBetween(from, to) {
  const [rows] = await pool.execute(
    `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue,
            COUNT(*) AS sale_count
     FROM sales
     WHERE sale_date BETWEEN ? AND ?`,
    [from, to]
  );
  return rows[0];
}

// Report 3: Vendor who purchased the highest number of boxes.
async function topVendor() {
  const [rows] = await pool.execute(
    `SELECT v.vendor_id, v.vendor_name,
            SUM(sd.quantity) AS total_boxes
     FROM sales_details sd
     JOIN sales s ON s.sale_id = sd.sale_id
     JOIN vendors v ON v.vendor_id = s.vendor_id
     GROUP BY v.vendor_id, v.vendor_name
     ORDER BY total_boxes DESC
     LIMIT 1`
  );
  return rows[0] || null;
}

// Report 4: Current stock levels per fruit & size.
async function stockLevels() {
  const [rows] = await pool.execute(
    `SELECT f.fruit_id, f.fruit_name,
            s.packaging_size, s.available_quantity, s.reorder_level
     FROM stock s
     JOIN fruits f ON f.fruit_id = s.fruit_id
     ORDER BY f.fruit_name, FIELD(s.packaging_size,'SMALL','MEDIUM','LARGE')`
  );
  return rows;
}

// Report 5: Outstanding balance per vendor.
async function outstandingBalances() {
  const [rows] = await pool.execute(
    `SELECT v.vendor_id, v.vendor_name,
            COALESCE(SUM(s.total_amount), 0) AS total_billed,
            COALESCE(SUM(s.amount_paid),   0) AS total_paid,
            COALESCE(SUM(s.total_amount - s.amount_paid), 0) AS outstanding_balance
     FROM vendors v
     LEFT JOIN sales s ON s.vendor_id = v.vendor_id
     GROUP BY v.vendor_id, v.vendor_name
     ORDER BY outstanding_balance DESC`
  );
  return rows;
}

module.exports = { topFruits, revenueBetween, topVendor, stockLevels, outstandingBalances };