# Database ERD — Batloung Farm Distribution Management System

Database name: **`batloung_farm`** (utf8mb4, InnoDB)

---

## Entity-Relationship Diagram (text form)

```
┌──────────────┐         ┌───────────────┐         ┌──────────────┐
│  suppliers   │ 1     N │   purchases   │ 1     N │purchase_     │ N     1 ┌──────────┐
│──────────────│◄────────│───────────────│◄────────│details       │────────►│  fruits  │
│ supplier_id  │         │ purchase_id   │         │──────────────│         │──────────│
│ business_name│         │ supplier_id FK│         │purchase_     │         │ fruit_id │
│ contact_...  │         │ purchase_date │         │ detail_id    │         │ fruit_   │
│ phone        │         │ total_amount  │         │purchase_id FK│         │ name     │
│ province     │         └───────────────┘         │fruit_id   FK │         │ descr.   │
│ address      │                                   │quantity      │         │ status   │
└──────────────┘                                   │unit_cost     │         └────┬─────┘
                                                   │packaging_size│              │
                                                   └───────────────┘              │
                                                                                  │
┌──────────────┐         ┌───────────────┐         ┌──────────────┐              │
│   vendors    │ 1     N │     sales     │ 1     N │sales_details │ N     1      │
│──────────────│◄────────│───────────────│◄────────│──────────────│──────────────┤
│ vendor_id    │         │ sale_id       │         │sales_detail_ │              │
│ vendor_name  │         │ vendor_id  FK │         │ id           │              │
│ phone_number │         │ sale_date     │         │sale_id    FK │              │
│ location     │         │ payment_status│         │fruit_id   FK │              │
│ registration │         │ total_amount  │         │packaging_size│              │
│ _date        │         │ amount_paid   │         │quantity      │              │
└──────────────┘         │ payment_method│         │unit_price    │              │
                         └───────────────┘         └──────────────┘              │
                                                                                  │
                         ┌───────────────────────────────────────────┐            │
                         │                 stock                     │ 1        1 │
                         │───────────────────────────────────────────│◄───────────┤
                         │ stock_id (PK)                             │            │
                         │ fruit_id (FK)                             │            │
                         │ packaging_size ENUM(SMALL,MEDIUM,LARGE)   │            │
                         │ available_quantity                        │            │
                         │ selling_price                             │            │
                         │ reorder_level                             │            │
                         │ UNIQUE(fruit_id, packaging_size)          │            │
                         └───────────────────────────────────────────┘            │
                                                                                  │
                                                                         (fruits) ┘
```

---

## 8 Tables — one-line summary

| # | Table | Purpose |
|---|-------|---------|
| 1 | `suppliers` | Who Batloung Farm buys from (one per SA province in seed) |
| 2 | `fruits` | The 5 fruit types (Apples, Bananas, Oranges, Mangoes, Grapes) |
| 3 | `vendors` | Street vendors / small retailers in Lesotho |
| 4 | `purchases` | Purchase header (one per buying event) |
| 5 | `purchase_details` | Line items of a purchase (fruit, size, qty, unit cost) |
| 6 | `sales` | Sale header (vendor, status, total, amount paid, method) |
| 7 | `sales_details` | Line items of a sale (fruit, size, qty, unit price) |
| 8 | `stock` | **Per-fruit, per-size** available quantity + selling price + reorder level |

---

## Key design decisions

### Stock is per (fruit, packaging_size) — NOT aggregated

This is the **critical design requirement** of the assignment. `stock` has:

```sql
UNIQUE KEY uq_stock_fruit_size (fruit_id, packaging_size)
```

So apples have **three** stock rows:
- Apples × SMALL
- Apples × MEDIUM
- Apples × LARGE

5 fruits × 3 sizes = **15 rows** in the seed. Trying to sell 10 large apples when only 6 are in the LARGE row **must fail** — even if 100 medium apples exist.

### Different selling price per packaging size

`stock.selling_price` is set per row, so:
- Apples SMALL = M 25.00
- Apples MEDIUM = M 45.00
- Apples LARGE = M 70.00

The server always reads price from `stock.selling_price` — never from the request body.

### Foreign key behaviour

| Child → Parent | ON DELETE | Rationale |
|----------------|-----------|-----------|
| `purchases.supplier_id → suppliers` | RESTRICT | You cannot delete a supplier who has purchases |
| `sales.vendor_id → vendors` | RESTRICT | You cannot delete a vendor who has sales |
| `purchase_details.purchase_id → purchases` | CASCADE | Deleting a purchase removes its lines |
| `purchase_details.fruit_id → fruits` | RESTRICT | A fruit in use cannot be deleted |
| `sales_details.sale_id → sales` | CASCADE | Deleting a sale removes its lines |
| `sales_details.fruit_id → fruits` | RESTRICT | A fruit in use cannot be deleted |
| `stock.fruit_id → fruits` | CASCADE | Deleting a fruit removes its stock rows |

### Constraints enforced at DB level

- `stock.available_quantity >= 0` — never negative
- `purchase_details.quantity > 0`
- `purchase_details.unit_cost > 0`
- `sales_details.quantity > 0`
- `sales_details.unit_price > 0`
- `stock.selling_price > 0`
- `fruits.fruit_name` — UNIQUE
- `vendors.phone_number` — UNIQUE
- `stock (fruit_id, packaging_size)` — UNIQUE

---

## Indexes

| Index | Table | Columns |
|-------|-------|---------|
| idx_purchases_supplier | purchases | supplier_id |
| idx_purchases_date | purchases | purchase_date |
| idx_sales_vendor | sales | vendor_id |
| idx_sales_date | sales | sale_date |
| idx_sales_payment_status | sales | payment_status |
| idx_sd_fruit | sales_details | fruit_id |
| idx_pd_fruit | purchase_details | fruit_id |
| uq_stock_fruit_size | stock | (fruit_id, packaging_size) — UNIQUE |

---

## Money & units

- All money columns are `DECIMAL(10,2)` — exact fixed point, no float rounding issues.
- All box quantities are `INT`.
- `mysql2` is configured with `decimalNumbers: true` so `DECIMAL` values come to JavaScript as `Number`, not `String`.