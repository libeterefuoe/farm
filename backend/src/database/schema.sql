-- =====================================================
-- BATLOUNG FARM DISTRIBUTION MANAGEMENT SYSTEM
-- Database Schema
-- =====================================================
-- Core distribution tables and database-backed admin authentication.
-- Packaging sizes: SMALL, MEDIUM, LARGE
-- Stock is tracked separately per (fruit, packaging_size).
-- =====================================================



CREATE DATABASE IF NOT EXISTS batloung_farm;
USE batloung_farm;

-- =====================================================
-- ADMIN AUTHENTICATION
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  role_id      INT AUTO_INCREMENT PRIMARY KEY,
  role_name    VARCHAR(50) NOT NULL UNIQUE,
  description  VARCHAR(255) NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  user_id        INT AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(100) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role_id        INT NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_role
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- 1. SUPPLIERS
-- =====================================================
CREATE TABLE suppliers (
  supplier_id      INT AUTO_INCREMENT PRIMARY KEY,
  business_name    VARCHAR(150) NOT NULL,
  contact_person   VARCHAR(100) NOT NULL,
  phone            VARCHAR(20)  NOT NULL,
  province         ENUM(
                    'Gauteng',
                    'Free State',
                    'KwaZulu-Natal',
                    'Western Cape',
                    'Eastern Cape',
                    'Limpopo',
                    'Mpumalanga',
                    'North West'
                  ) NOT NULL,
  address          VARCHAR(255) NOT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- 2. FRUITS
-- =====================================================
CREATE TABLE fruits (
  fruit_id      INT AUTO_INCREMENT PRIMARY KEY,
  fruit_name    VARCHAR(50) NOT NULL UNIQUE,
  description   VARCHAR(255) NULL,
  status        ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- 3. VENDORS
-- =====================================================
CREATE TABLE vendors (
  vendor_id          INT AUTO_INCREMENT PRIMARY KEY,
  vendor_name        VARCHAR(150) NOT NULL,
  phone_number       VARCHAR(20)  NOT NULL UNIQUE,
  location           VARCHAR(150) NOT NULL,
  registration_date  DATE NOT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- 4. PURCHASES
-- =====================================================
CREATE TABLE purchases (
  purchase_id     INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id     INT NOT NULL,
  purchase_date   DATE NOT NULL,
  total_amount    DECIMAL(10,2) NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchase_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_purchase_total CHECK (total_amount >= 0)
) ENGINE=InnoDB;

-- =====================================================
-- 5. PURCHASE_DETAILS
-- =====================================================
CREATE TABLE purchase_details (
  purchase_detail_id  INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id         INT NOT NULL,
  fruit_id            INT NOT NULL,
  quantity            INT NOT NULL,
  unit_cost           DECIMAL(10,2) NOT NULL,
  packaging_size      ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  CONSTRAINT fk_pd_purchase
    FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pd_fruit
    FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_pd_quantity  CHECK (quantity > 0),
  CONSTRAINT chk_pd_unit_cost CHECK (unit_cost > 0)
) ENGINE=InnoDB;

-- =====================================================
-- 6. SALES
-- =====================================================
CREATE TABLE sales (
  sale_id         INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id       INT NOT NULL,
  sale_date       DATE NOT NULL,
  payment_status  ENUM('PAID','PARTIALLY_PAID','UNPAID') NOT NULL DEFAULT 'UNPAID',
  total_amount    DECIMAL(10,2) NOT NULL,
  amount_paid     DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method  ENUM('CASH','MOBILE_MONEY','CREDIT') NOT NULL DEFAULT 'CASH',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sale_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_sale_total CHECK (total_amount >= 0),
  CONSTRAINT chk_sale_paid  CHECK (amount_paid >= 0)
) ENGINE=InnoDB;

-- =====================================================
-- 7. SALES_DETAILS
-- =====================================================
CREATE TABLE sales_details (
  sales_detail_id  INT AUTO_INCREMENT PRIMARY KEY,
  sale_id          INT NOT NULL,
  fruit_id         INT NOT NULL,
  packaging_size   ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  quantity         INT NOT NULL,
  unit_price       DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_sd_sale
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_sd_fruit
    FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_sd_quantity   CHECK (quantity > 0),
  CONSTRAINT chk_sd_unit_price CHECK (unit_price > 0)
) ENGINE=InnoDB;

-- =====================================================
-- 8. STOCK
-- =====================================================
-- One row per (fruit, packaging_size) so small/medium/large
-- stock levels are tracked SEPARATELY, as required.
-- =====================================================
CREATE TABLE stock (
  stock_id            INT AUTO_INCREMENT PRIMARY KEY,
  fruit_id            INT NOT NULL,
  packaging_size      ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  available_quantity  INT NOT NULL DEFAULT 0,
  selling_price       DECIMAL(10,2) NOT NULL,
  reorder_level       INT NOT NULL DEFAULT 10,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_fruit
    FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_stock_fruit_size UNIQUE (fruit_id, packaging_size),
  CONSTRAINT chk_stock_quantity     CHECK (available_quantity >= 0),
  CONSTRAINT chk_stock_selling      CHECK (selling_price > 0),
  CONSTRAINT chk_stock_reorder      CHECK (reorder_level >= 0)
) ENGINE=InnoDB;

-- =====================================================
-- INDEXES for performance on common queries
-- =====================================================
CREATE INDEX idx_purchases_supplier     ON purchases(supplier_id);
CREATE INDEX idx_purchases_date         ON purchases(purchase_date);
CREATE INDEX idx_sales_vendor           ON sales(vendor_id);
CREATE INDEX idx_sales_date             ON sales(sale_date);
CREATE INDEX idx_sales_payment_status   ON sales(payment_status);
CREATE INDEX idx_sd_fruit               ON sales_details(fruit_id);
CREATE INDEX idx_pd_fruit               ON purchase_details(fruit_id);