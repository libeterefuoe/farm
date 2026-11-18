-- =====================================================
-- TRANSACTIONS DEMO — BEGIN / COMMIT / ROLLBACK
-- =====================================================
-- This file shows the transaction pattern used by
-- saleController. Run it manually to demonstrate:
--   - A successful multi-item sale that COMMITS
--   - A multi-item sale where one item fails => ROLLBACK
-- =====================================================
USE batloung_farm;

-- =====================================================
-- SCENARIO 1: SUCCESSFUL SALE (all stock available)
-- =====================================================
START TRANSACTION;

-- Lock the two stock rows we will touch
SELECT stock_id, available_quantity
FROM stock
WHERE fruit_id = 1 AND packaging_size = 'SMALL'
FOR UPDATE;

SELECT stock_id, available_quantity
FROM stock
WHERE fruit_id = 2 AND packaging_size = 'SMALL'
FOR UPDATE;

-- (Assume app validated stock is sufficient)
-- Insert sale header
INSERT INTO sales (vendor_id, sale_date, payment_status, total_amount, amount_paid, payment_method)
VALUES (1, CURDATE(), 'PAID', 200.00, 200.00, 'CASH');

SET @new_sale_id = LAST_INSERT_ID();

-- Insert sale line items
INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price)
VALUES (@new_sale_id, 1, 'SMALL', 4, 25.00),
       (@new_sale_id, 2, 'SMALL', 5, 20.00);

-- Decrease stock
UPDATE stock SET available_quantity = available_quantity - 4
WHERE fruit_id = 1 AND packaging_size = 'SMALL';

UPDATE stock SET available_quantity = available_quantity - 5
WHERE fruit_id = 2 AND packaging_size = 'SMALL';

COMMIT;  -- All good: sale is persisted

-- =====================================================
-- SCENARIO 2: FAILED SALE (insufficient stock on 2nd item)
-- Requested: 3 apples SMALL + 999 bananas LARGE
-- But bananas LARGE only has a few boxes => rejection
-- =====================================================
START TRANSACTION;

-- Lock first row: apples SMALL (plenty in stock)
SELECT stock_id, available_quantity
FROM stock
WHERE fruit_id = 1 AND packaging_size = 'SMALL'
FOR UPDATE;

-- Lock second row: bananas LARGE (insufficient)
SELECT stock_id, available_quantity
FROM stock
WHERE fruit_id = 2 AND packaging_size = 'LARGE'
FOR UPDATE;

-- App logic detects available < 999 => ROLLBACK
-- (We simulate the rollback right here; no inserts/decrements above)
ROLLBACK;

-- After ROLLBACK:
--   - No new row in sales
--   - No new rows in sales_details
--   - No stock change
-- The application returns 400 with:
--   "Insufficient stock for Bananas (LARGE): requested 999, available <n>"