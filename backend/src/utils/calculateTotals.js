// Pure calculation helpers — easy to explain in a demo video.
// These NEVER touch the database; they only do arithmetic.

const MAX_DECIMAL_10_2 = 99999999.99;

function fitsDecimal10_2(value) {
  return Number.isFinite(value) && value >= 0 && value <= MAX_DECIMAL_10_2;
}

/**
 * Line total for a purchase line: quantity * unit_cost.
 */
function lineTotal(quantity, unitCost) {
  return Number((Number(quantity) * Number(unitCost)).toFixed(2));
}

/**
 * Line total for a sale line: quantity * unit_price.
 */
function salesLineTotal(quantity, unitPrice) {
  return Number((Number(quantity) * Number(unitPrice)).toFixed(2));
}

/**
 * Grand total = sum of each item's quantity * unit price.
 * items: [{ quantity, unit_price }, ...]
 */
function orderTotal(items) {
  return Number(
    items
      .reduce((sum, it) => sum + Number(it.quantity) * Number(it.unit_price), 0)
      .toFixed(2)
  );
}

module.exports = { MAX_DECIMAL_10_2, fitsDecimal10_2, lineTotal, salesLineTotal, orderTotal };