const { runTransaction } = require('../utils/transaction');
const salesModel = require('../models/salesModel');
const stockModel = require('../models/stockModel');
const vendorModel = require('../models/vendorModel');
const fruitModel = require('../models/fruitModel');
const { derivePaymentStatus } = require('../utils/paymentStatus');
const { MAX_SUPPORTED_TOTAL, isSupportedTotal, orderTotal } = require('../utils/calculateTotals');
const {
  badRequest, notFound,
  isPositiveInt, isNonNegativeNumber,
  isValidPackagingSize, isValidPaymentMethod
} = require('../middleware/validate');

// ---------------------------------------------------------------
// GET /api/sales
// ---------------------------------------------------------------
async function list(req, res, next) {
  try {
    const sales = await salesModel.findAll();
    res.json({ success: true, data: sales });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------
// GET /api/sales/:id
// ---------------------------------------------------------------
async function getById(req, res, next) {
  try {
    const sale = await salesModel.findById(req.params.id);
    if (!sale) return notFound(res, 'Sale not found');
    res.json({ success: true, data: sale });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------
// POST /api/sales
// Body: { vendor_id, payment_method, amount_paid, items:[{fruit_id, packaging_size, quantity}] }
// ---------------------------------------------------------------
async function create(req, res, next) {
  try {
    const { vendor_id, payment_method, amount_paid, items } = req.body || {};

    // --- Basic validation (same as before) ---
    if (!isPositiveInt(vendor_id)) return badRequest(res, 'vendor_id must be a positive integer.');
    const vendor = await vendorModel.findById(vendor_id);
    if (!vendor) return notFound(res, 'Vendor not found.');

    if (!isValidPaymentMethod(payment_method)) {
      return badRequest(res, 'payment_method must be CASH, MOBILE_MONEY or CREDIT.');
    }
    if (!isNonNegativeNumber(amount_paid)) {
      return badRequest(res, 'amount_paid must be a non-negative number.');
    }

    if (!Array.isArray(items) || items.length === 0) {
      return badRequest(res, 'items must be a non-empty array.');
    }
    for (const [i, it] of items.entries()) {
      if (!isPositiveInt(it.fruit_id)) return badRequest(res, `items[${i}].fruit_id must be a positive integer.`);
      if (!isValidPackagingSize(it.packaging_size)) return badRequest(res, `items[${i}].packaging_size must be SMALL, MEDIUM or LARGE.`);
      if (!isPositiveInt(it.quantity)) return badRequest(res, `items[${i}].quantity must be a positive integer.`);

      // Fail early if the fruit doesn't exist at all (faster feedback)
      const fruit = await fruitModel.findById(it.fruit_id);
      if (!fruit) return notFound(res, `Fruit ${it.fruit_id} not found.`);
    }

    // ---- TRANSACTION ----
    // 1) SELECT ... FOR UPDATE each stock row
    // 2) Validate all quantities
    // 3) Insert sale + details
    // 4) Decrease stock
    // 5) COMMIT (or ROLLBACK on any failure)
    const result = await runTransaction(async (conn) => {
      const resolved = [];

      for (const it of items) {
        const row = await stockModel.findByFruitAndSizeForUpdate(conn, it.fruit_id, it.packaging_size);

        // CHANGED: clearer message when the stock row itself is missing.
        // This is usually a data problem (seed not run) or a fruit/size
        // combination that has never been stocked — not a code bug.
        if (!row) {
          const fruit = await fruitModel.findById(it.fruit_id);
          const err = new Error(
            `No stock record for ${fruit.fruit_name} (${it.packaging_size}). ` +
            `Please record a purchase for this fruit and size before selling it.`
          );
          err.status = 400;
          throw err;
        }

        if (row.available_quantity < it.quantity) {
          const fruit = await fruitModel.findById(it.fruit_id);
          const err = new Error(
            `Insufficient stock for ${fruit.fruit_name} (${it.packaging_size}): ` +
            `requested ${it.quantity}, available ${row.available_quantity}`
          );
          err.status = 400;
          throw err;
        }

        resolved.push({
          fruit_id: it.fruit_id,
          packaging_size: it.packaging_size,
          quantity: it.quantity,
          unit_price: row.selling_price   // <-- price from DB, never client
        });
      }

      const total = orderTotal(resolved.map(r => ({
        quantity: r.quantity,
        unit_price: r.unit_price
      })));

      if (!isSupportedTotal(total)) {
        const err = new Error(
          `Sale total exceeds the supported maximum of M ${MAX_SUPPORTED_TOTAL.toFixed(2)}.`
        );
        err.status = 400;
        throw err;
      }

      if (Number(amount_paid) > total) {
        const err = new Error(`amount_paid (${amount_paid}) cannot exceed total (${total}).`);
        err.status = 400;
        throw err;
      }

      const status = derivePaymentStatus(amount_paid, total);
      const saleDate = new Date().toISOString().slice(0, 10);

      const saleId = await salesModel.createHeader(
        conn, vendor_id, saleDate, status, total, Number(amount_paid), payment_method
      );

      for (const r of resolved) {
        await salesModel.createDetail(
          conn, saleId, r.fruit_id, r.packaging_size, r.quantity, r.unit_price
        );
        const affected = await stockModel.decreaseStock(
          conn, r.fruit_id, r.packaging_size, r.quantity
        );
        if (affected === 0) {
          // Safety net — should never fire because we locked the row
          const err = new Error('Stock update failed — concurrent modification.');
          err.status = 409;
          throw err;
        }
      }

      return saleId;
    });

    const created = await salesModel.findById(result);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    // CHANGED: any error with a status set (400 or 409) is a business
    // validation error and should be reported to the client with that status.
    if (err.status === 400) return badRequest(res, err.message);
    if (err.status === 409) {
      return res.status(409).json({ success: false, message: err.message });
    }
    next(err);
  }
}

// ---------------------------------------------------------------
// POST /api/sales/:id/payments
// Body: { payment_method, amount }
// ---------------------------------------------------------------
async function addPayment(req, res, next) {
  try {
    const { payment_method, amount } = req.body || {};
    if (!isValidPaymentMethod(payment_method)) {
      return badRequest(res, 'payment_method must be CASH, MOBILE_MONEY or CREDIT.');
    }
    if (!isNonNegativeNumber(amount) || Number(amount) <= 0) {
      return badRequest(res, 'amount must be a positive number.');
    }

    const sale = await salesModel.findById(req.params.id);
    if (!sale) return notFound(res, 'Sale not found');

    const newPaid = Number((sale.amount_paid + Number(amount)).toFixed(2));
    if (newPaid > sale.total_amount) {
      return badRequest(
        res,
        `Payment exceeds outstanding. Total: ${sale.total_amount}, already paid: ${sale.amount_paid}.`
      );
    }
    const newStatus = derivePaymentStatus(newPaid, sale.total_amount);

    await runTransaction(async (conn) => {
      await salesModel.addPayment(conn, sale.sale_id, Number(amount), newStatus);
    });

    const updated = await salesModel.findById(sale.sale_id);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, addPayment };