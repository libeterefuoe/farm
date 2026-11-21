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

async function getHistoricalQuantity(conn, fruitId, packagingSize) {
  const [rows] = await conn.execute(
    `SELECT
       COALESCE((
         SELECT SUM(quantity) FROM purchase_details
         WHERE fruit_id = ? AND packaging_size = ?
       ), 0) - COALESCE((
         SELECT SUM(quantity) FROM sales_details
         WHERE fruit_id = ? AND packaging_size = ?
       ), 0) AS available_quantity`,
    [fruitId, packagingSize, fruitId, packagingSize]
  );
  return Number(rows[0].available_quantity);
}

async function initializeFromHistory(conn, fruitId, packagingSize, sellingPrice) {
  const existing = await findByFruitAndSizeForUpdate(conn, fruitId, packagingSize);
  if (existing) {
    const err = new Error(`Stock already exists for fruit ${fruitId} (${packagingSize}).`);
    err.status = 409;
    throw err;
  }

  const quantity = await getHistoricalQuantity(conn, fruitId, packagingSize);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    const err = new Error(`No unstocked purchase quantity exists for fruit ${fruitId} (${packagingSize}).`);
    err.status = 400;
    throw err;
  }

  await conn.execute(
    `INSERT INTO stock (fruit_id, packaging_size, available_quantity, selling_price)
     VALUES (?, ?, ?, ?)`,
    [fruitId, packagingSize, quantity, sellingPrice]
  );
  return quantity;
}

// Increase existing stock, or create its first row with a selling price.
async function increaseStock(conn, fruitId, packagingSize, qty, sellingPrice) {
  const [result] = await conn.execute(
    `UPDATE stock
     SET available_quantity = available_quantity + ?
     WHERE fruit_id = ? AND packaging_size = ?`,
    [qty, fruitId, packagingSize]
  );
  if (result.affectedRows > 0) return;

  if (sellingPrice === undefined) {
    const err = new Error(
      `A selling_price is required to stock fruit ${fruitId} (${packagingSize}) for the first time.`
    );
    err.status = 400;
    throw err;
  }

  const initialQuantity = await getHistoricalQuantity(conn, fruitId, packagingSize);
  if (!Number.isInteger(initialQuantity) || initialQuantity < qty) {
    const err = new Error(
      `Cannot initialize stock for fruit ${fruitId} (${packagingSize}) because purchase and sale history is inconsistent.`
    );
    err.status = 409;
    throw err;
  }

  await conn.execute(
    `INSERT INTO stock (fruit_id, packaging_size, available_quantity, selling_price)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE available_quantity = available_quantity + ?`,
    [fruitId, packagingSize, initialQuantity, sellingPrice, qty]
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
  initializeFromHistory,
  increaseStock,
  decreaseStock
};