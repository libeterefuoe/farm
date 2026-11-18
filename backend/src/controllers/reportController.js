const reportModel = require('../models/reportModel');
const { badRequest, isValidDate } = require('../middleware/validate');

async function topFruits(req, res, next) {
  try {
    const data = await reportModel.topFruits();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function revenue(req, res, next) {
  try {
    const { from, to } = req.query;
    if (!isValidDate(from) || !isValidDate(to)) {
      return badRequest(res, 'Both "from" and "to" (YYYY-MM-DD) are required.');
    }
    const data = await reportModel.revenueBetween(from, to);
    res.json({ success: true, data: { from, to, ...data } });
  } catch (err) { next(err); }
}

async function topVendor(req, res, next) {
  try {
    const data = await reportModel.topVendor();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function stockLevels(req, res, next) {
  try {
    const data = await reportModel.stockLevels();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function outstandingBalances(req, res, next) {
  try {
    const data = await reportModel.outstandingBalances();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

module.exports = { topFruits, revenue, topVendor, stockLevels, outstandingBalances };