# Batloung Farm — Frontend

React + Vite frontend for the Batloung Farm Distribution Management System.

## 1. Setup

```bash
cd frontend
npm install
cp .env.example .env
# edit VITE_API_URL if your backend is not on http://localhost:5000/api
```

## 2. Run

```bash
npm run dev
```

Open `http://localhost:5173`.

The backend must be running first (see `backend/README.md`).

## 3. Pages

| Route                | Purpose |
|----------------------|---------|
| `/`                  | Dashboard — quick stats + shortcuts |
| `/suppliers`         | List / add / edit / delete suppliers |
| `/fruits`            | List / add / edit fruits |
| `/stock`             | Stock per fruit × packaging size; toggle low-stock only |
| `/vendors`           | Search, add, edit vendors; shows outstanding balance |
| `/purchases/new`     | Record a multi-item purchase |
| `/sales/new`         | Record a multi-item sale (rejects when stock is insufficient) |
| `/sales`             | List sales; open a sale to view items and record payments |
| `/reports`           | All 5 reports |

## 4. Highlight behaviours for the demo

- **Stock page** highlights low rows in red (available ≤ reorder level).
- **New Sale**:
  - Shows live availability and price per selected fruit + size.
  - If you request more than available, the server rejects the **entire** sale
    with a message such as `Insufficient stock for Apples (LARGE): requested 10, available 6`
    and nothing is written to the database.
- **Sales List → View / Pay** lets you record additional payments; the status
  changes from `PARTIALLY_PAID` to `PAID` automatically.
- **Reports** shows all five SQL-backed reports on one page, with a date range
  for the revenue report.

## 5. Project structure

```
frontend/
  public/vite.svg
  src/
    api/axios.js            Axios instance (VITE_API_URL)
    components/
      Navbar.jsx
      DataTable.jsx
      Alert.jsx
      Loader.jsx
    pages/
      Dashboard.jsx
      Suppliers.jsx
      Fruits.jsx
      Stock.jsx
      Vendors.jsx
      NewPurchase.jsx
      NewSale.jsx
      SalesList.jsx
      Reports.jsx
    App.jsx                 Routes + layout
    main.jsx                React entry
    constants.js            ENUMs shared with the backend
    styles.css              Single global stylesheet
  index.html
  vite.config.js
  package.json
  .env / .env.example
```

## 6. Environment variables

| Variable       | Purpose |
|----------------|---------|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api` |