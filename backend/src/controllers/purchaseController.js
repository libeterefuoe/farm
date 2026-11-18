const pool = require('../config/db');
const { runTransaction } = require('../utils/transaction');
const purchaseModel = require('../models/purchaseModel');
const stockModel = require('../models/stockModel');
const supplierModel = require('../models/supplierModel');
const fruitModel = require('../models/fruitModel');
const { salesLineTotal, orderTotal } = require('../utils/calculateTotals');
const {
  badRequest, notFound, isPositiveInt, isPositiveNumber, isValidPackagingSize
} = require('../middleware/validate');

async function list(req, res, next) {
  try {
    const purchases = await purchaseModel.findAll();
    res.json({ success: true, data: purchases });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const purchase = await purchaseModel.findById(req.params.id);
    if (!purchase) return notFound(res, 'Purchase not found');
    res.json({ success: true, data: purchase });
  } catch (err) { next(err); }
}

// POST /api/purchases
// Body: { supplier_id, items:[{fruit_id, packaging_size, quantity, unit_cost}] }
async function create(req, res, next) {
  try {
    const { supplier_id, items } = req.body || {};

    if (!isPositiveInt(supplier_id)) {
      return badRequest(res, 'supplier_id must be a positive integer.');
    }
    const supplier = await supplierModel.findById(supplier_id);
    if (!supplier) return notFound(res, 'Supplier not found.');

    if (!Array.isArray(items) || items.length === 0) {
      return badRequest(res, 'items must be a non-empty array.');
    }
    for (const [i, it] of items.entries()) {
      if (!isPositiveInt(it.fruit_id)) return badRequest(res, `items[${i}].fruit_id must be a positive integer.`);
      if (!isValidPackagingSize(it.packaging_size)) return badRequest(res, `items[${i}].packaging_size must be SMALL, MEDIUM or LARGE.`);
      if (!isPositiveInt(it.quantity)) return badRequest(res, `items[${i}].quantity must be a positive integer.`);
      if (!isPositiveNumber(it.unit_cost)) return badRequest(res, `items[${i}].unit_cost must be a positive number.`);

      const fruit = await fruitModel.findById(it.fruit_id);
      if (!fruit) return notFound(res, `Fruit ${it.fruit_id} not found.`);
    }

    // Server computes totals (never trust client)
    const total = orderTotal(items.map(it => ({
      quantity: it.quantity,
      unit_price: it.unit_cost
    })));

    const purchaseId = await runTransaction(async (conn) => {
      const purchaseDate = new Date().toISOString().slice(0, 10);
      const id = await purchaseModel.createHeader(conn, supplier_id, purchaseDate, total);

      for (const it of items) {
        await purchaseModel.createDetail(
          conn, id, it.fruit_id, it.quantity, it.unit_cost, it.packaging_size
        );
        // Increase stock for the right (fruit, packaging_size) row
        await stockModel.increaseStock(conn, it.fruit_id, it.packaging_size, it.quantity);
      }
      return id;
    });

    const created = await purchaseModel.findById(purchaseId);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
}

module.exports = { list, getById, create };