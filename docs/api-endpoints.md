# API Endpoints — Batloung Farm Distribution Management System

Base URL (local): `http://localhost:5000/api`

All responses use JSON. Successful responses wrap the payload in `{ success: true, data: … }`.
Error responses use `{ success: false, message: "…" }` with an appropriate HTTP status code.

---

## Health

### `GET /api/health`

Checks that the API is running and the DB is reachable.

**Response 200**
```json
{ "success": true, "message": "API up, DB reachable", "timestamp": "2025-06-01T10:00:00.000Z" }
```

**Response 503** (DB down)
```json
{ "success": false, "message": "Database unavailable" }
```

---

## Suppliers

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/suppliers` | List all suppliers |
| GET    | `/api/suppliers/:id` | Get one supplier |
| POST   | `/api/suppliers` | Create a supplier |
| PUT    | `/api/suppliers/:id` | Update a supplier |
| DELETE | `/api/suppliers/:id` | Delete (409 if supplier has purchases) |

**POST / PUT body**
```json
{
  "business_name": "Gauteng Fresh Produce",
  "contact_person": "Thabo Mokoena",
  "phone": "+27 11 555 1001",
  "province": "Gauteng",
  "address": "12 Market Road, Johannesburg"
}
```

Allowed provinces: `Gauteng`, `Free State`, `KwaZulu-Natal`, `Western Cape`, `Eastern Cape`, `Limpopo`, `Mpumalanga`, `North West`.

**Response 201 (created)**
```json
{
  "success": true,
  "data": {
    "supplier_id": 9,
    "business_name": "Gauteng Fresh Produce",
    "contact_person": "Thabo Mokoena",
    "phone": "+27 11 555 1001",
    "province": "Gauteng",
    "address": "12 Market Road, Johannesburg"
  }
}
```

**Response 409 (delete blocked)**
```json
{ "success": false, "message": "Cannot delete supplier — they have existing purchases." }
```

---

## Fruits

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/fruits` | List all fruits |
| POST   | `/api/fruits` | Create a fruit |
| PUT    | `/api/fruits/:id` | Update a fruit |

**POST / PUT body**
```json
{ "fruit_name": "Apples", "description": "Crisp fresh apples", "status": "ACTIVE" }
```

`status` ∈ `ACTIVE | INACTIVE`. `fruit_name` is unique → `409` on duplicate.

---

## Stock

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/stock` | All stock rows (fruit × size) |
| GET    | `/api/stock/low` | Rows where `available_quantity <= reorder_level` |

**Response 200**
```json
{
  "success": true,
  "data": [
    { "stock_id": 1, "fruit_id": 1, "fruit_name": "Apples", "packaging_size": "SMALL",  "available_quantity": 8,  "selling_price": 25.00, "reorder_level": 10 },
    { "stock_id": 2, "fruit_id": 1, "fruit_name": "Apples", "packaging_size": "MEDIUM", "available_quantity": 13, "selling_price": 45.00, "reorder_level": 10 }
  ]
}
```

---

## Vendors

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vendors` | List all vendors (with outstanding balance) |
| GET    | `/api/vendors?search=term` | Search by name or phone |
| POST   | `/api/vendors` | Create a vendor |
| PUT    | `/api/vendors/:id` | Update a vendor |

**POST / PUT body**
```json
{
  "vendor_name": "Maseru Central Market",
  "phone_number": "+266 5800 0001",
  "location": "Maseru Central",
  "registration_date": "2025-01-10"
}
```

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "vendor_id": 1,
      "vendor_name": "Maseru Central Market",
      "phone_number": "+266 5800 0001",
      "location": "Maseru Central",
      "registration_date": "2025-01-10T00:00:00.000Z",
      "outstanding_balance": 0
    }
  ]
}
```

---

## Purchases

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/purchases` | List all purchases |
| GET    | `/api/purchases/:id` | One purchase with line items |
| POST   | `/api/purchases` | Create a purchase (multi-item) |

**POST body**
```json
{
  "supplier_id": 1,
  "items": [
    { "fruit_id": 1, "packaging_size": "SMALL",  "quantity": 10, "unit_cost": 15.00 },
    { "fruit_id": 2, "packaging_size": "MEDIUM", "quantity": 15, "unit_cost": 30.00 },
    { "fruit_id": 3, "packaging_size": "LARGE",  "quantity": 20, "unit_cost": 50.00 }
  ]
}
```

The server:
1. Validates supplier + fruits.
2. Computes `total = Σ(quantity × unit_cost)`.
3. Inserts `purchases` + `purchase_details` and **increases** `stock.available_quantity` per `(fruit, size)` — all inside a single transaction.

**Response 201**
```json
{
  "success": true,
  "data": {
    "purchase_id": 4,
    "supplier_id": 1,
    "business_name": "Gauteng Fresh Produce",
    "purchase_date": "2025-06-20T00:00:00.000Z",
    "total_amount": 1600.00,
    "items": [
      { "purchase_detail_id": 7, "fruit_id": 1, "fruit_name": "Apples", "quantity": 10, "unit_cost": 15.00, "packaging_size": "SMALL" }
    ]
  }
}
```

---

## Sales

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/sales` | List all sales |
| GET    | `/api/sales/:id` | One sale with line items |
| POST   | `/api/sales` | Create a sale (multi-item, transactional) |
| POST   | `/api/sales/:id/payments` | Record an additional payment |

**POST /api/sales body**
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

Rules:
- Unit price is taken from `stock.selling_price` — **not** from the request.
- Total computed on the server.
- The whole operation runs in a transaction with `SELECT … FOR UPDATE`.
- If **any** item has insufficient stock → `400`, entire sale rolls back, stock unchanged.

**Response 201**
```json
{
  "success": true,
  "data": {
    "sale_id": 6,
    "vendor_id": 1,
    "vendor_name": "Maseru Central Market",
    "sale_date": "2025-06-20T00:00:00.000Z",
    "payment_status": "PAID",
    "total_amount": 150.00,
    "amount_paid": 150,
    "payment_method": "CASH",
    "items": [
      { "sales_detail_id": 11, "fruit_id": 1, "fruit_name": "Apples",  "packaging_size": "MEDIUM", "quantity": 2, "unit_price": 45.00 },
      { "sales_detail_id": 12, "fruit_id": 2, "fruit_name": "Bananas", "packaging_size": "SMALL",  "quantity": 3, "unit_price": 20.00 }
    ]
  }
}
```

**Response 400 — insufficient stock (the demo case)**
```json
{
  "success": false,
  "message": "Insufficient stock for Apples (LARGE): requested 10, available 6"
}
```

**POST /api/sales/:id/payments body**
```json
{ "payment_method": "MOBILE_MONEY", "amount": 100 }
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "sale_id": 5,
    "payment_status": "PAID",
    "total_amount": 246.00,
    "amount_paid": 200.00,
    "payment_method": "CASH"
  }
}
```

**Response 400 — overpayment**
```json
{ "success": false, "message": "Payment exceeds outstanding. Total: 246, already paid: 100." }
```

---

## Reports

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/reports/top-fruits` | Top 5 fruits by boxes sold |
| GET    | `/api/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD` | Total revenue in range |
| GET    | `/api/reports/top-vendor` | Vendor with highest boxes purchased |
| GET    | `/api/reports/stock-levels` | Stock per fruit × size |
| GET    | `/api/reports/outstanding-balances` | Outstanding per vendor |

**Example — revenue**
```json
{
  "success": true,
  "data": { "from": "2025-06-01", "to": "2025-06-30", "total_revenue": 1091.00, "sale_count": 5 }
}
```

**Example — outstanding balances**
```json
{
  "success": true,
  "data": [
    { "vendor_id": 3, "vendor_name": "Mabote Fruit Stall", "total_billed": 150.00, "total_paid": 0.00,  "outstanding_balance": 150.00 },
    { "vendor_id": 2, "vendor_name": "Thabo Street Vendor","total_billed": 290.00, "total_paid": 150.00, "outstanding_balance": 140.00 }
  ]
}
```

---

## HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200  | OK — successful GET / PUT |
| 201  | Created — successful POST |
| 400  | Bad Request — validation failed, insufficient stock, overpayment |
| 404  | Not Found — record doesn't exist |
| 409  | Conflict — duplicate key, delete blocked by FK |
| 500  | Internal Server Error |
| 503  | Service Unavailable — DB down |