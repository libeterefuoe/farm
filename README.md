# Batloung Farm Distribution Management System

Full-stack web application for **Batloung Farm**, a fruit distribution business in Maseru, Lesotho.

- **Backend:** Node.js + Express + MySQL (`mysql2/promise`)
- **Frontend:** React + Vite + Axios
- **Database:** MySQL (`batloung_farm` — 8 tables)

Built for the **DIWA2110 Web Application Development** take-home test.

---

## 📁 Repository Structure

```
batloung-farm-system/
├── backend/                 Node.js + Express API
│   ├── src/
│   │   ├── config/          MySQL pool
│   │   ├── models/          All SQL queries
│   │   ├── controllers/     Request handlers + business logic
│   │   ├── routes/          Express routers
│   │   ├── middleware/      Validation, errors, 404
│   │   ├── utils/           Calculations, transactions, constants
│   │   └── database/        schema.sql, seed.sql, transactions_demo.sql
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── frontend/                React + Vite app
│   ├── src/
│   │   ├── api/             Axios instance
│   │   ├── components/      Navbar, DataTable, Alert, Loader
│   │   ├── pages/           9 pages (Dashboard, Suppliers, …)
│   │   ├── App.jsx          Routes + layout
│   │   ├── main.jsx         React entry
│   │   └── styles.css       Single global stylesheet
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── README.md
│
├── docs/
│   ├── api-endpoints.md
│   ├── database-erd.md
│   ├── business-rules.md
│   ├── DEMO_SCRIPT.md
│   └── requests.http
│
├── postman/
│   └── BatloungFarm.postman_collection.json
│
├── package.json             Convenience scripts (root)
├── .gitignore               Root ignore rules
├── README.md                ← you are here
└── demo-video-link.txt      Paste your recorded video URL here
```

---

## 🚀 Quick Start (Local)

### 1. Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **MySQL** ≥ 8

### 2. Clone & install

```bash
git clone <your-repo-url>
cd batloung-farm-system

# Option A — install both in one shot
npm run install:all

# Option B — install manually
npm --prefix backend  install
npm --prefix frontend install
```

### 3. Set up the database

```bash
# From the backend folder
cd backend

# 1. Create the schema (creates database `batloung_farm` + 8 tables)
mysql -u root -p < src/database/schema.sql

# 2. Load the seed data
mysql -u root -p batloung_farm < src/database/seed.sql
```

### 4. Configure environment variables

```bash
cp backend/.env.example backend/.env
# edit backend/.env → DB_USER, DB_PASSWORD, etc.

cp frontend/.env.example frontend/.env
# edit frontend/.env → VITE_API_URL (default: http://localhost:5000/api)
```

### 5. Run

```bash
# Terminal 1 — backend
npm run dev:backend         # or: npm --prefix backend run dev

# Terminal 2 — frontend
npm run dev:frontend        # or: npm --prefix frontend run dev
```

| Service  | URL |
|----------|-----|
| Backend  | http://localhost:5000 |
| Health   | http://localhost:5000/api/health |
| Frontend | http://localhost:5173 |

---

## 🧩 Features

### Suppliers
Full CRUD. Deleting a supplier who has purchases is **blocked** with a `409`.

### Fruits & Stock
Fruit CRUD. Stock tracked **separately per packaging size** — `UNIQUE(fruit_id, packaging_size)`. Selling prices differ per size. Low-stock rows highlighted.

### Vendors
CRUD + search by name or phone. Each vendor shows an **outstanding balance** derived from their sales.

### Purchases
`POST /api/purchases` accepts multiple items. Total is **calculated on the server**. Stock is **increased** per `(fruit, packaging_size)` inside a single transaction.

### Sales
`POST /api/sales` accepts multiple items. Unit price is **always** taken from `stock.selling_price` — never from the request. All stock rows are locked with `SELECT … FOR UPDATE`, validated, then decremented — all in one transaction. If **any** item has insufficient stock, the entire sale **rolls back** with a `400` and a clear message.

### Payments
Payment status (`PAID` / `PARTIALLY_PAID` / `UNPAID`) is derived automatically from `amount_paid` vs `total_amount`. `POST /api/sales/:id/payments` records additional payments and updates status.

### Reports (5)
1. Top 5 most frequently sold fruits (by boxes)
2. Total revenue in a date range
3. Vendor with the highest boxes purchased
4. Current stock per fruit × size
5. Outstanding balances per vendor

---

## 🔐 Security / Best Practices

- DB credentials live **only** in `.env` — never committed.
- `.gitignore` blocks `.env` at every level.
- Every controller uses `async/await` with `try/catch`.
- A **central error handler** converts MySQL errors into meaningful JSON with correct HTTP codes (`400`, `404`, `409`, `500`, `503`).
- The server **does not crash** when the DB is down — logs a clear message and returns `503 Database unavailable`.

---

## 📚 Documentation

Detailed docs live in `docs/`:

- `api-endpoints.md` — every route with request/response examples
- `database-erd.md` — 8-table ERD and relationships
- `business-rules.md` — validation and transaction rules
- `DEMO_SCRIPT.md` — 10-step demo runbook (includes the 10-vs-6 rollback)
- `requests.http` — REST Client file for manual testing

A Postman collection is in `postman/BatloungFarm.postman_collection.json`.

---

## 🚢 Deployment

| Layer    | Suggested host |
|----------|----------------|
| MySQL    | Railway / Aiven / PlanetScale |
| Backend  | Render / Railway |
| Frontend | Vercel / Netlify |

**Checklist**
1. Provision MySQL, run `schema.sql` + `seed.sql`.
2. Deploy backend with env vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, `FRONTEND_URL`.
3. Deploy frontend with `VITE_API_URL` set to your deployed backend's `/api` base.
4. Set `FRONTEND_URL` on the backend to your frontend's production origin (for CORS).

---

## ✅ Verification Checklist

1. `GET /api/health` → `{ success: true }`
2. Dashboard loads with supplier/fruit/vendor counts
3. Create → edit → delete a supplier (delete blocked if purchases exist)
4. Create a fruit
5. Low-stock toggle shows only `available ≤ reorder_level` rows
6. Vendor search by name and phone
7. Record a purchase → stock increases
8. Record a sale → stock decreases, status derived correctly
9. **Reject a sale** for insufficient stock → verify `400`, no new sale, stock unchanged
10. All 5 reports render; revenue respects date range

---

## 📝 License

MIT — for educational use (DIWA2110).