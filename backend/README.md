# Batloung Farm — Backend

Node.js + Express + MySQL API for the Batloung Farm Distribution Management System.

## 1. Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your MySQL password
```

## 2. Database

```bash
# from the backend folder
mysql -u root -p < src/database/schema.sql
mysql -u root -p batloung_farm < src/database/seed.sql
```

For an existing database, add the authentication tables without recreating
the distribution tables:

```bash
mysql -u root -p batloung_farm < src/database/auth_tables.sql
```

The `roles` table includes an `Administrator` role. To create the initial admin
account, set `ADMIN_USERNAME` and a real bcrypt `ADMIN_PASSWORD_HASH` in `.env`,
then run:

```bash
npm run provision-admin
```

Generate a password hash with `npm run hash -- <your-password>`. The
bootstrap environment variables are only used by this one-time command; login
checks the account stored in `users`.

## 3. Run

```bash
npm run dev     # nodemon
# or
npm start
```

API runs on `http://localhost:5000`.

## 4. Health

```
GET /api/health   → { success: true, message: "API up, DB reachable" }
```

## 5. Endpoints

### Suppliers
| Method | Path                 | Body |
|--------|----------------------|------|
| GET    | /api/suppliers       | — |
| GET    | /api/suppliers/:id   | — |
| POST   | /api/suppliers       | `{ business_name, contact_person, phone, province, address }` |
| PUT    | /api/suppliers/:id   | same as POST |
| DELETE | /api/suppliers/:id   | — (409 if supplier has purchases) |

### Fruits & Stock
| Method | Path             | Body |
|--------|------------------|------|
| GET    | /api/fruits      | — |
| POST   | /api/fruits      | `{ fruit_name, description, status }` |
| PUT    | /api/fruits/:id  | same as POST |
| GET    | /api/stock       | — |
| GET    | /api/stock/low   | — |

### Vendors
| Method | Path                       | Body |
|--------|----------------------------|------|
| GET    | /api/vendors               | — |
| GET    | /api/vendors?search=thabo  | — |
| POST   | /api/vendors               | `{ vendor_name, phone_number, location, registration_date }` |
| PUT    | /api/vendors/:id           | same as POST |

### Purchases
| Method | Path             | Body |
|--------|------------------|------|
| GET    | /api/purchases   | — |
| GET    | /api/purchases/:id | — |
| POST   | /api/purchases   | see example below |

```json
{
  "supplier_id": 1,
  "items": [
    { "fruit_id": 1, "packaging_size": "SMALL", "quantity": 10, "unit_cost": 15.00 },
    { "fruit_id": 2, "packaging_size": "MEDIUM", "quantity": 15, "unit_cost": 30.00 }
  ]
}
```

### Sales
| Method | Path                     | Body |
|--------|--------------------------|------|
| GET    | /api/sales               | — |
| GET    | /api/sales/:id           | — |
| POST   | /api/sales               | see example below |
| POST   | /api/sales/:id/payments  | `{ payment_method, amount }` |

```json
{
  "vendor_id": 1,
  "payment_method": "CASH",
  "amount_paid": 150,
  "items": [
    { "fruit_id": 1, "packaging_size": "MEDIUM", "quantity": 2 },
    { "fruit_id": 2, "packaging_size": "SMALL",  "quantity": 3 }
  ]
}
```

**Rejected sale example** (insufficient stock):

```
POST /api/sales
{
  "vendor_id": 1, "payment_method": "CASH", "amount_paid": 0,
  "items": [{ "fruit_id": 1, "packaging_size": "LARGE", "quantity": 10 }]
}
→ 400 { "success": false, "message": "Insufficient stock for Apples (LARGE): requested 10, available 6" }
```

### Reports
| Method | Path |
|--------|------|
| GET    | /api/reports/top-fruits |
| GET    | /api/reports/revenue?from=2025-06-01&to=2025-06-30 |
| GET    | /api/reports/top-vendor |
| GET    | /api/reports/stock-levels |
| GET    | /api/reports/outstanding-balances |

## 6. Raw SQL for Reports

**Top 5 most frequently sold fruits (by boxes):**
```sql
SELECT f.fruit_id, f.fruit_name, SUM(sd.quantity) AS total_boxes_sold
FROM sales_details sd
JOIN fruits f ON f.fruit_id = sd.fruit_id
GROUP BY f.fruit_id, f.fruit_name
ORDER BY total_boxes_sold DESC
LIMIT 5;
```

**Total sales revenue in a date range:**
```sql
SELECT COALESCE(SUM(total_amount), 0) AS total_revenue, COUNT(*) AS sale_count
FROM sales
WHERE sale_date BETWEEN ? AND ?;
```

**Vendor who purchased the highest number of boxes:**
```sql
SELECT v.vendor_id, v.vendor_name, SUM(sd.quantity) AS total_boxes
FROM sales_details sd
JOIN sales s ON s.sale_id = sd.sale_id
JOIN vendors v ON v.vendor_id = s.vendor_id
GROUP BY v.vendor_id, v.vendor_name
ORDER BY total_boxes DESC
LIMIT 1;
```

**Current stock levels per fruit & packaging size:**
```sql
SELECT f.fruit_name, s.packaging_size, s.available_quantity, s.reorder_level
FROM stock s
JOIN fruits f ON f.fruit_id = s.fruit_id
ORDER BY f.fruit_name, FIELD(s.packaging_size,'SMALL','MEDIUM','LARGE');
```

**Outstanding balances per vendor:**
```sql
SELECT v.vendor_id, v.vendor_name,
       COALESCE(SUM(s.total_amount), 0) AS total_billed,
       COALESCE(SUM(s.amount_paid),   0) AS total_paid,
       COALESCE(SUM(s.total_amount - s.amount_paid), 0) AS outstanding_balance
FROM vendors v
LEFT JOIN sales s ON s.vendor_id = v.vendor_id
GROUP BY v.vendor_id, v.vendor_name
ORDER BY outstanding_balance DESC;
```

## 7. Testing the Rollback Scenario

1. Find a fruit/size with a low `available_quantity` (e.g. apples LARGE = 6).
2. POST a sale requesting `quantity: 10`.
3. Observe `400` with message `Insufficient stock for Apples (LARGE): requested 10, available 6`.
4. Check `GET /api/sales` — no new sale appears.
5. Check `GET /api/stock` — quantity unchanged (still 6).

## 8. Environment Variables

| Name          | Purpose |
|---------------|---------|
| `DB_HOST`     | MySQL host |
| `DB_PORT`     | MySQL port (default 3306) |
| `DB_USER`     | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME`     | `batloung_farm` |
| `PORT`        | API port (default 5000) |
| `FRONTEND_URL`| Origin allowed by CORS |
| `ADMIN_USERNAME` | Username for the one-time admin provisioning command |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash for the one-time admin provisioning command |