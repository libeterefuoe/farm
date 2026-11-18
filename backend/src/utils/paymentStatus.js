// Derives payment status automatically from amount_paid and total.
// Rules (from the assignment):
//   amount_paid === 0                    -> UNPAID
//   0 < amount_paid < total              -> PARTIALLY_PAID
//   amount_paid >= total                 -> PAID

function derivePaymentStatus(amountPaid, totalAmount) {
  const paid  = Number(amountPaid);
  const total = Number(totalAmount);

  if (paid <= 0) return 'UNPAID';
  if (paid >= total) return 'PAID';
  return 'PARTIALLY_PAID';
}

module.exports = { derivePaymentStatus };