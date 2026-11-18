// Small validation helpers used by controllers.
// Each helper returns { ok: true } or throws a structured error.
// Controllers use a `fail(res, message)` helper for clean 400s.

const { PACKAGING_SIZES, FRUIT_STATUSES, PAYMENT_METHODS } = require('../utils/constants');

function isPositiveInt(v) {
  return Number.isInteger(Number(v)) && Number(v) > 0;
}
function isNonNegativeNumber(v) {
  return !Number.isNaN(Number(v)) && Number(v) >= 0;
}
function isPositiveNumber(v) {
  return !Number.isNaN(Number(v)) && Number(v) > 0;
}
function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}
function isValidPackagingSize(v) {
  return PACKAGING_SIZES.includes(v);
}
function isValidFruitStatus(v) {
  return FRUIT_STATUSES.includes(v);
}
function isValidPaymentMethod(v) {
  return PAYMENT_METHODS.includes(v);
}
function isValidDate(v) {
  if (!v) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

// Express-friendly helpers
function badRequest(res, message, details) {
  return res.status(400).json({ success: false, message, ...(details && { details }) });
}
function notFound(res, message) {
  return res.status(404).json({ success: false, message });
}
function conflict(res, message) {
  return res.status(409).json({ success: false, message });
}

module.exports = {
  isPositiveInt,
  isNonNegativeNumber,
  isPositiveNumber,
  isNonEmptyString,
  isValidPackagingSize,
  isValidFruitStatus,
  isValidPaymentMethod,
  isValidDate,
  badRequest,
  notFound,
  conflict
};