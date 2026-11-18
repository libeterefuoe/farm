const stockModel = require('../models/stockModel');

async function list(req, res, next) {
  try {
    const stock = await stockModel.findAllWithFruit();
    res.json({ success: true, data: stock });
  } catch (err) { next(err); }
}

async function lowStock(req, res, next) {
  try {
    const stock = await stockModel.findLowStock();
    res.json({ success: true, data: stock });
  } catch (err) { next(err); }
}

module.exports = { list, lowStock };