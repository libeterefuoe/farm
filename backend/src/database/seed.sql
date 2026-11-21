-- =====================================================
-- BATLOUNG FARM DISTRIBUTION MANAGEMENT SYSTEM
-- Seed Data
-- =====================================================
USE batloung_farm;

-- =====================================================
-- ADMIN ROLE
-- =====================================================
INSERT IGNORE INTO roles (role_name, description)
VALUES ('Administrator', 'Full access to the Batloung Farm management system');

-- =====================================================
-- SUPPLIERS — one per South African province (8)
-- =====================================================
INSERT INTO suppliers (business_name, contact_person, phone, province, address) VALUES
('Gauteng Fresh Produce',    'Thabo Mokoena',   '+27 11 555 1001', 'Gauteng',        '12 Market Road, Johannesburg'),
('Free State Fruit Co.',     'Janet van Wyk',   '+27 51 555 1002', 'Free State',     '45 Bloem Street, Bloemfontein'),
('KZN Tropical Fruits',      'Sipho Zulu',      '+27 31 555 1003', 'KwaZulu-Natal',  '88 Beach Road, Durban'),
('Cape Orchard Supplies',    'Anele Ndlovu',    '+27 21 555 1004', 'Western Cape',   '23 Vine Street, Cape Town'),
('Eastern Cape Growers',     'Lwazi Mthembu',   '+27 41 555 1005', 'Eastern Cape',   '67 Main Street, Port Elizabeth'),
('Limpopo Valley Farms',     'Refilwe Sithole', '+27 15 555 1006', 'Limpopo',        '90 Valley Road, Polokwane'),
('Mpumalanga Harvest',       'Pieter Botha',    '+27 13 555 1007', 'Mpumalanga',     '14 Riverside, Nelspruit'),
('North West Agri Produce',  'Nomsa Khoza',     '+27 18 555 1008', 'North West',     '33 Sun Street, Rustenburg');

-- =====================================================
-- FRUITS — the 5 required fruits
-- =====================================================
INSERT INTO fruits (fruit_name, description, status) VALUES
('Apples',  'Crisp fresh apples',   'ACTIVE'),
('Bananas', 'Ripe yellow bananas',  'ACTIVE'),
('Oranges', 'Sweet juicy oranges',  'ACTIVE'),
('Mangoes', 'Tropical ripe mangoes','ACTIVE'),
('Grapes',  'Seedless green grapes','ACTIVE');

-- =====================================================
-- VENDORS — 10 street vendors in Maseru area
-- =====================================================
INSERT INTO vendors (vendor_name, phone_number, location, registration_date) VALUES
('Maseru Central Market',   '+266 5800 0001', 'Maseru Central',   '2025-01-10'),
('Thabo Street Vendor',     '+266 5800 0002', 'Maseru CBD',       '2025-01-15'),
('Mabote Fruit Stall',      '+266 5800 0003', 'Mabote',           '2025-02-01'),
('Ha Thetsane Vendor',      '+266 5800 0004', 'Ha Thetsane',      '2025-02-12'),
('Lithabaneng Store',       '+266 5800 0005', 'Lithabaneng',      '2025-03-05'),
('Borokhoaneng Stall',      '+266 5800 0006', 'Borokhoaneng',     '2025-03-20'),
('Khubetsoana Vendor',      '+266 5800 0007', 'Khubetsoana',      '2025-04-02'),
('Motimposo Retail',        '+266 5800 0008', 'Motimposo',        '2025-04-18'),
('Roma Road Vendor',        '+266 5800 0009', 'Roma Road',        '2025-05-01'),
('Qoaling Fruit Shop',      '+266 5800 0010', 'Qoaling',          '2025-05-20');

-- =====================================================
-- STOCK — one row per (fruit x packaging_size) = 15 rows
-- Different selling price per packaging size (SMALL < MEDIUM < LARGE)
-- Starting quantities will be updated by purchases below.
-- =====================================================
INSERT INTO stock (fruit_id, packaging_size, available_quantity, selling_price, reorder_level) VALUES
(1, 'SMALL',  0, 25.00, 10), (1, 'MEDIUM', 0, 45.00, 10), (1, 'LARGE',  0, 70.00, 10),
(2, 'SMALL',  0, 20.00, 10), (2, 'MEDIUM', 0, 38.00, 10), (2, 'LARGE',  0, 60.00, 10),
(3, 'SMALL',  0, 22.00, 10), (3, 'MEDIUM', 0, 40.00, 10), (3, 'LARGE',  0, 65.00, 10),
(4, 'SMALL',  0, 30.00, 10), (4, 'MEDIUM', 0, 55.00, 10), (4, 'LARGE',  0, 85.00, 10),
(5, 'SMALL',  0, 28.00, 10), (5, 'MEDIUM', 0, 50.00, 10), (5, 'LARGE',  0, 80.00, 10);

-- =====================================================
-- PURCHASES — 3 purchases with multiple items
-- =====================================================
-- Purchase 1: from supplier 1 (Gauteng) on 2025-06-01
INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES
(1, '2025-06-01', (10*15 + 15*30 + 20*50));   -- = 150 + 450 + 1000 = 1600.00

INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size) VALUES
(1, 1, 10, 15.00, 'SMALL'),
(1, 2, 15, 30.00, 'MEDIUM'),
(1, 3, 20, 50.00, 'LARGE');

-- Purchase 2: from supplier 3 (KZN) on 2025-06-05
INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES
(3, '2025-06-05', (20*20 + 10*40 + 15*70));   -- = 400 + 400 + 1050 = 1850.00

INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size) VALUES
(2, 4, 20, 20.00, 'SMALL'),
(2, 5, 10, 40.00, 'MEDIUM'),
(2, 1, 15, 70.00, 'LARGE');

-- Purchase 3: from supplier 4 (Western Cape) on 2025-06-10
INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES
(4, '2025-06-10', (25*18 + 12*35 + 8*65));    -- = 450 + 420 + 520 = 1390.00

INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size) VALUES
(3, 2, 25, 18.00, 'SMALL'),
(3, 3, 12, 35.00, 'MEDIUM'),
(3, 5, 8,  65.00, 'LARGE');

-- =====================================================
-- Apply purchase quantities to stock
-- (This is what the API does at runtime via ON DUPLICATE KEY UPDATE;
--  in seed data we just set stock to match.)
-- =====================================================
UPDATE stock SET available_quantity = 10 WHERE fruit_id=1 AND packaging_size='SMALL';   -- purchase 1
UPDATE stock SET available_quantity = 15 WHERE fruit_id=2 AND packaging_size='MEDIUM';  -- purchase 1
UPDATE stock SET available_quantity = 20 WHERE fruit_id=3 AND packaging_size='LARGE';   -- purchase 1

UPDATE stock SET available_quantity = available_quantity + 20 WHERE fruit_id=4 AND packaging_size='SMALL';   -- purchase 2
UPDATE stock SET available_quantity = available_quantity + 10 WHERE fruit_id=5 AND packaging_size='MEDIUM';  -- purchase 2
UPDATE stock SET available_quantity = available_quantity + 15 WHERE fruit_id=1 AND packaging_size='LARGE';   -- purchase 2

UPDATE stock SET available_quantity = available_quantity + 25 WHERE fruit_id=2 AND packaging_size='SMALL';   -- purchase 3
UPDATE stock SET available_quantity = available_quantity + 12 WHERE fruit_id=3 AND packaging_size='MEDIUM';  -- purchase 3
UPDATE stock SET available_quantity = available_quantity + 8  WHERE fruit_id=5 AND packaging_size='LARGE';   -- purchase 3

-- =====================================================
-- SALES — 5 sales with mixed payment statuses
-- We carefully pick quantities LESS THAN OR EQUAL to available stock
-- =====================================================
-- Sale 1: vendor 1, PAID, cash
-- Items: 2 apples MEDIUM @45, 3 bananas SMALL @20  => total = 90 + 60 = 150
INSERT INTO sales (vendor_id, sale_date, payment_status, total_amount, amount_paid, payment_method)
VALUES (1, '2025-06-12', 'PAID', 150.00, 150.00, 'CASH');

INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES
(1, 1, 'MEDIUM', 2, 45.00),
(1, 2, 'SMALL',  3, 20.00);

UPDATE stock SET available_quantity = available_quantity - 2 WHERE fruit_id=1 AND packaging_size='MEDIUM';
UPDATE stock SET available_quantity = available_quantity - 3 WHERE fruit_id=2 AND packaging_size='SMALL';

-- Sale 2: vendor 2, PARTIALLY_PAID, mobile money
-- Items: 4 oranges LARGE @65, 1 mango SMALL @30 => total = 260 + 30 = 290, paid 150
INSERT INTO sales (vendor_id, sale_date, payment_status, total_amount, amount_paid, payment_method)
VALUES (2, '2025-06-13', 'PARTIALLY_PAID', 290.00, 150.00, 'MOBILE_MONEY');

INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES
(2, 3, 'LARGE', 4, 65.00),
(2, 4, 'SMALL', 1, 30.00);

UPDATE stock SET available_quantity = available_quantity - 4 WHERE fruit_id=3 AND packaging_size='LARGE';
UPDATE stock SET available_quantity = available_quantity - 1 WHERE fruit_id=4 AND packaging_size='SMALL';

-- Sale 3: vendor 3, UNPAID, credit
-- Items: 2 grapes MEDIUM @50, 2 apples SMALL @25 => total = 100 + 50 = 150, paid 0
INSERT INTO sales (vendor_id, sale_date, payment_status, total_amount, amount_paid, payment_method)
VALUES (3, '2025-06-14', 'UNPAID', 150.00, 0.00, 'CREDIT');

INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES
(3, 5, 'MEDIUM', 2, 50.00),
(3, 1, 'SMALL',  2, 25.00);

UPDATE stock SET available_quantity = available_quantity - 2 WHERE fruit_id=5 AND packaging_size='MEDIUM';
UPDATE stock SET available_quantity = available_quantity - 2 WHERE fruit_id=1 AND packaging_size='SMALL';

-- Sale 4: vendor 4, PAID, cash
-- Items: 3 mangoes LARGE @85 => total = 255, paid 255
INSERT INTO sales (vendor_id, sale_date, payment_status, total_amount, amount_paid, payment_method)
VALUES (4, '2025-06-15', 'PAID', 255.00, 255.00, 'CASH');

INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES
(4, 4, 'LARGE', 3, 85.00);

UPDATE stock SET available_quantity = available_quantity - 3 WHERE fruit_id=4 AND packaging_size='LARGE';

-- Sale 5: vendor 5, PARTIALLY_PAID, cash
-- Items: 5 bananas MEDIUM @38, 2 grapes SMALL @28 => total = 190 + 56 = 246, paid 100
INSERT INTO sales (vendor_id, sale_date, payment_status, total_amount, amount_paid, payment_method)
VALUES (5, '2025-06-16', 'PARTIALLY_PAID', 246.00, 100.00, 'CASH');

INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES
(5, 2, 'MEDIUM', 5, 38.00),
(5, 5, 'SMALL',  2, 28.00);

UPDATE stock SET available_quantity = available_quantity - 5 WHERE fruit_id=2 AND packaging_size='MEDIUM';
UPDATE stock SET available_quantity = available_quantity - 2 WHERE fruit_id=5 AND packaging_size='SMALL';

-- Done. Total stock per (fruit, size) should now be consistent.