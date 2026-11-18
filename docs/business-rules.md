# Business Rules — Batloung Farm Distribution Management System

These are the rules enforced **by the application** (controllers/services) and, where possible, **by the database** (constraints).

---

## 1. Fruits

- Exactly 5 fruits exist in seed data: **Apples, Bananas, Oranges, Mangoes, Grapes**.
- `fruit_name` is **unique** — duplicates return `409`.
- `status` is `ACTIVE` or `INACTIVE`.
- An `INACTIVE` fruit is not removed — it just shouldn't be sold. (Note: existing seed prices still allow selling; the constraint can be tightened in future.)

---

## 2. Packaging sizes & prices

- Three sizes: `SMALL`, `MEDIUM`, `LARGE`.
- **Each size has its own selling price** stored in `stock.selling_price`.
- Each size has its own available quantity stored in `stock.available_quantity`.

---

## 3. Stock

- The **only** place stock is mutated is inside the purchase and sale controllers — always inside a transaction.
- Stock is keyed by `(fruit_id, packaging_size)` — `UNIQUE` constraint guarantees this.
- **Available quantity can never go negative** — enforced by `CHECK (available_quantity >= 0)` AND by the sale controller validating *before* the update.
- Low stock = `available_quantity <= reorder_level` (default `10`).

---

## 4. Purchase rules

When recording a purchase (`POST /api/purchases`):

1. `supplier_id` must reference an existing supplier — else `404`.
2. `items` must be a non-empty array.
3. For each item:
   - `fruit_id` must reference an existing fruit — else `404`.
   - `packaging_size ∈ {SMALL, MEDIUM, LARGE}`.
   - `quantity` is a positive integer.
   - `unit_cost` is a positive number.
4. Server computes `total_amount = Σ(quantity × unit_cost)` — client-provided total is ignored.
5. All inserts and stock increments happen in **one transaction**.
   - Insert `purchases` row → get `purchase_id`.
   - For each item: insert `purchase_details` + `stock.available_quantity += quantity`.
6. If anything fails, everything rolls back and no stock changes.

---

## 5. Sale rules

When recording a sale (`POST /api/sales`):

1. `vendor_id` must reference an existing vendor — else `404`.
2. `payment_method ∈ {CASH, MOBILE_MONEY, CREDIT}`.
3. `amount_paid` is a non-negative number.
4. `items` is a non-empty array.
5. For each item:
   - `fruit_id` must reference an existing fruit — else `404`.
   - `packaging_size ∈ {SMALL, MEDIUM, LARGE}`.
   - `quantity` is a positive integer.
6. **Unit price is taken from `stock.selling_price`** — the client cannot supply or override it.

**Transaction flow** (all inside one `START TRANSACTION`):

```
1. SELECT stock_id, available_quantity, selling_price
   FROM stock
   WHERE fruit_id = ? AND packaging_size = ?
   FOR UPDATE;                 ← row-level lock

2. If available < quantity for ANY line:
       ROLLBACK;
       RETURN 400 "Insufficient stock for <fruit> (<size>):
                    requested X, available Y"

3. Compute total = Σ(quantity × selling_price_from_db)

4. If amount_paid > total → ROLLBACK; 400.

5. INSERT INTO sales (...) VALUES (...);

6. For each line:
       INSERT INTO sales_details (...);
       UPDATE stock SET available_quantity = available_quantity - ?
       WHERE fruit_id = ? AND packaging_size = ?
         AND available_quantity >= ?;

7. COMMIT;
```

Consequences:
- A **failed** sale writes **nothing** — no partial `sales` row, no partial `sales_details`, no stock decrement.
- A **successful** sale writes everything atomically.

---

## 6. Payment status derivation

Payment status is **always derived** — never taken from the client:

| Condition | Status |
|-----------|--------|
| `amount_paid = 0` | `UNPAID` |
| `0 < amount_paid < total_amount` | `PARTIALLY_PAID` |
| `amount_paid >= total_amount` | `PAID` |

Overpayment (`amount_paid > total_amount`) is rejected with `400`.

Additional payments (`POST /api/sales/:id/payments`) also respect this rule — they:
1. Reject if `new_amount_paid > total_amount`.
2. Recompute status.

---

## 7. Vendor outstanding balance

```
outstanding_balance(vendor) = Σ(sales.total_amount) − Σ(sales.amount_paid)
```

Shown on:
- `GET /api/vendors`
- `GET /api/vendors?search=...`
- `GET /api/reports/outstanding-balances`

---

## 8. Deletion rules

| Entity | Rule |
|--------|------|
| Supplier | Blocked if supplier has purchases → `409` |
| Vendor | Blocked if vendor has sales (FK RESTRICT) → `409` |
| Fruit | Blocked if referenced by stock / purchase_details / sales_details (FK RESTRICT / CASCADE combo) |
| Purchase | Cascades to `purchase_details` — stock is **not** reversed automatically |
| Sale | Cascades to `sales_details` — stock is **not** reversed automatically |

---

## 9. Validation rules (summary)

| Field | Rule |
|-------|------|
| `fruit_name` | Non-empty string, unique |
| `packaging_size` | ∈ {SMALL, MEDIUM, LARGE} |
| `province` | ∈ 8 SA provinces |
| `payment_method` | ∈ {CASH, MOBILE_MONEY, CREDIT} |
| `status` | ∈ {ACTIVE, INACTIVE} |
| Quantities | Positive integers |
| Money | Positive numbers (costs/prices) or non-negative (amount_paid) |
| Dates | Parsable date; sale/purchase date auto-set to today if absent |

---

## 10. HTTP status codes

| Code | When |
|------|------|
| 200 | Successful GET / PUT / additional payment |
| 201 | Successful POST (supplier, fruit, vendor, purchase, sale) |
| 400 | Invalid input, insufficient stock, overpayment |
| 404 | Supplier / fruit / vendor / purchase / sale not found |
| 409 | Duplicate unique key, delete blocked by FK |
| 500 | Unexpected error |
| 503 | Database unavailable |