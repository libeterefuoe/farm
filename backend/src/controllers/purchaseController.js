const pool = require('../config/db');
const { runTransaction } = require('../utils/transaction');
const purchaseModel = require('../models/purchaseModel');
const stockModel = require('../models/stockModel');
const supplierModel = require('../models/supplierModel');
const fruitModel = require('../models/fruitModel');
const { MAX_DECIMAL_10_2, fitsDecimal10_2, orderTotal } = require('../utils/calculateTotals');
const {
  badRequest, notFound, isPositiveInt, isPositiveNumber, isValidPackagingSize
} = require('../middleware/validate');

async function list(req, res, next) {
  try {
    const purchases = await purchaseModel.findAll();
    res.json({ success: true, data: purchases });
  } catch (err) { next(err); }
}

async function listUnstockedHistory(req, res, next) {
  try {
    const items = await purchaseModel.findUnstockedHistory();
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const purchase = await purchaseModel.findById(req.params.id);
    if (!purchase) return notFound(res, 'Purchase not found');
    res.json({ success: true, data: purchase });
  } catch (err) { next(err); }
}

async function reconcileStock(req, res, next) {
  try {
    const { fruit_id, packaging_size, selling_price } = req.body || {};
    if (!isPositiveInt(fruit_id)) {
      return badRequest(res, 'fruit_id must be a positive integer.');
    }
    if (!isValidPackagingSize(packaging_size)) {
      return badRequest(res, 'packaging_size must be SMALL, MEDIUM or LARGE.');
    }
    if (!isPositiveNumber(selling_price)) {
      return badRequest(res, 'selling_price must be a positive number.');
    }

    const fruit = await fruitModel.findById(fruit_id);
    if (!fruit) return notFound(res, 'Fruit not found.');

    const quantity = await runTransaction((conn) =>
      stockModel.initializeFromHistory(conn, fruit_id, packaging_size, selling_price)
    );
    res.status(201).json({
      success: true,
      data: { fruit_id, fruit_name: fruit.fruit_name, packaging_size, available_quantity: quantity, selling_price }
    });
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
      if (it.selling_price !== undefined && !isPositiveNumber(it.selling_price)) {
        return badRequest(res, `items[${i}].selling_price must be a positive number.`);
      }

      const fruit = await fruitModel.findById(it.fruit_id);
      if (!fruit) return notFound(res, `Fruit ${it.fruit_id} not found.`);
    }

    // Server computes totals (never trust client)
    const total = orderTotal(items.map(it => ({
      quantity: it.quantity,
      unit_price: it.unit_cost
    })));
    if (!fitsDecimal10_2(total)) {
      return badRequest(
        res,
        `Purchase total exceeds the supported maximum of M ${MAX_DECIMAL_10_2.toFixed(2)}.`
      );
    }

    const purchaseId = await runTransaction(async (conn) => {
      const purchaseDate = new Date().toISOString().slice(0, 10);
      const id = await purchaseModel.createHeader(conn, supplier_id, purchaseDate, total);

      for (const it of items) {
        await purchaseModel.createDetail(
          conn, id, it.fruit_id, it.quantity, it.unit_cost, it.packaging_size
        );
        // A missing stock row is initialized with its first selling price.
        await stockModel.increaseStock(
          conn, it.fruit_id, it.packaging_size, it.quantity, it.selling_price
        );
      }
      return id;
    });

    const created = await purchaseModel.findById(purchaseId);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
}

module.exports = { list, listUnstockedHistory, getById, reconcileStock, create };