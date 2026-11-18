const pool = require('../config/db');

// All stock rows joined with fruit name.
async function findAllWithFruit() {
  const [rows] = await pool.execute(
    `SELECT s.stock_id, s.fruit_id, f.fruit_name, s.packaging_size,
            s.available_quantity, s.selling_price, s.reorder_level
     FROM stock s
     JOIN fruits f ON f.fruit_id = s.fruit_id
     ORDER BY f.fruit_name, FIELD(s.packaging_size,'SMALL','MEDIUM','LARGE')`
  );
  return rows;
}

// Fruits whose stock is at or below reorder_level.
async function findLowStock() {
  const [rows] = await pool.execute(
    `SELECT s.stock_id, s.fruit_id, f.fruit_name, s.packaging_size,
            s.available_quantity, s.reorder_level
     FROM stock s
     JOIN fruits f ON f.fruit_id = s.fruit_id
     WHERE s.available_quantity <= s.reorder_level
     ORDER BY s.available_quantity ASC, f.fruit_name`
  );
  return rows;
}

// Fetch a single stock row for a given (fruit, packaging_size).
// Used inside transactions with FOR UPDATE in salesModel.
async function findByFruitAndSize(conn, fruitId, packagingSize) {
  const executor = conn || pool;
  const [rows] = await executor.execute(
    `SELECT stock_id, fruit_id, packaging_size, available_quantity, selling_price
     FROM stock WHERE fruit_id = ? AND packaging_size = ?`,
    [fruitId, packagingSize]
  );
  return rows[0] || null;
}

async function findByFruitAndSizeForUpdate(conn, fruitId, packagingSize) {
  const [rows] = await conn.execute(
    `SELECT stock_id, available_quantity, selling_price
     FROM stock WHERE fruit_id = ? AND packaging_size = ? FOR UPDATE`,
    [fruitId, packagingSize]
  );
  return rows[0] || null;
}

// Increase stock. Assumes the row exists (schema+seed guarantee it).
async function increaseStock(conn, fruitId, packagingSize, qty) {
  await conn.execute(
    `UPDATE stock
     SET available_quantity = available_quantity + ?
     WHERE fruit_id = ? AND packaging_size = ?`,
    [qty, fruitId, packagingSize]
  );
}

// Decrease stock — returns rowsAffected for safety.
async function decreaseStock(conn, fruitId, packagingSize, qty) {
  const [result] = await conn.execute(
    `UPDATE stock
     SET available_quantity = available_quantity - ?
     WHERE fruit_id = ? AND packaging_size = ?
       AND available_quantity >= ?`,
    [qty, fruitId, packagingSize, qty]
  );
  return result.affectedRows;
}

module.exports = {
  findAllWithFruit,
  findLowStock,
  findByFruitAndSize,
  findByFruitAndSizeForUpdate,
  increaseStock,
  decreaseStock
};