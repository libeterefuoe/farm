-- Widen aggregate money columns to support totals up to M 100 billion.
ALTER TABLE purchases
  MODIFY COLUMN total_amount DECIMAL(14,2) NOT NULL;

ALTER TABLE sales
  MODIFY COLUMN total_amount DECIMAL(14,2) NOT NULL,
  MODIFY COLUMN amount_paid DECIMAL(14,2) NOT NULL DEFAULT 0;
