# Demo Script — Batloung Farm Distribution Management System

Recorded walkthrough for **DIWA2110 Take-Home Test**.
Target length: **5–7 minutes**. Keep every step short and end with a clear success / failure message on screen.

---

## Pre-flight checklist (before recording)

- [ ] Backend running: `cd backend && npm run dev` → “Listening on http://localhost:5000”
- [ ] Frontend running: `cd frontend && npm run dev` → “Local: http://localhost:5173”
- [ ] MySQL running and database seeded (`schema.sql` + `seed.sql` executed)
- [ ] Browser at `http://localhost:5173`
- [ ] DevTools Network tab open (optional but useful for the failure case)
- [ ] A text editor showing `backend/src/database/schema.sql` (for the stock-per-size explanation)

---

## Step 1 — Health check (15 s)

1. Open `http://localhost:5000/api/health` in a tab.
2. Show the response: `{ "success": true, "message": "API up, DB reachable" }`.

**Say:** “The API checks the MySQL connection on every health request.”

---

## Step 2 — Dashboard overview (20 s)

1. Go to `/` (Dashboard).
2. Point out the stats cards: **Suppliers, Fruits, Vendors, Sales, Low Stock, Outstanding**.

**Say:** “These numbers are read directly from the API — they change automatically as we add records.”

---

## Step 3 — Suppliers CRUD + 409 delete guard (60 s)

1. Go to **Suppliers**.
2. Add a new supplier (e.g. *“Test Supplier 2025”*, any province).
3. Show it appearing in the table.
4. Edit it (change phone), save, see the updated row.
5. Try to **delete** a **seeded** supplier that has purchases (e.g. *Gauteng Fresh Produce*).

**Expected:** a red alert: *“Cannot delete supplier — they have existing purchases.”* (HTTP 409)

**Say:** “The backend returns **409 Conflict** because of the FK RESTRICT rule — the business requires purchase history to stay intact.”

---

## Step 4 — Fruits + Stock page (60 s)

1. Go to **Fruits**. Show the 5 seeded fruits. Add one (e.g. *“Pineapples”*).
2. Go to **Stock**. Show **15 rows** — each fruit appears **3 times**, once per size (SMALL / MEDIUM / LARGE).
3. Point at the **Selling price** column — show that Apples SMALL ≠ MEDIUM ≠ LARGE.
4. Tick **“Show only low stock”**. Rows with `available ≤ reorder_level` remain; the rest disappear.

**Say:** “This proves the packaging-specific stock design — a fruit can be plentiful in MEDIUM but out of stock in LARGE.”

---

## Step 5 — Vendor search + outstanding balance (30 s)

1. Go to **Vendors**.
2. Search `Thabo` → filtered list.
3. Search `+266 5800` → multiple matches.
4. Point at the **Outstanding** column: some are M 0.00 (green), others show money due (red).

**Say:** “Outstanding = total billed − total paid, computed live from the sales table.”

---

## Step 6 — Record a purchase (60 s)

1. Go to **New Purchase**.
2. Pick **Gauteng Fresh Produce**.
3. Add **two items**:
   - Apples, MEDIUM, qty **5**, unit cost **30**
   - Bananas, SMALL, qty **4**, unit cost **12**
4. Note the **Estimated total** = M 198.00 (5×30 + 4×12).
5. Save.

**Expected:** green alert: *“Purchase #N recorded. Total: M 198.00”*

6. Go back to **Stock** and verify Apples-MEDIUM and Bananas-SMALL quantities **increased** by 5 and 4.

**Say:** “Server recomputes the total — we never trust the browser — and increments stock inside a single transaction.”

---

## Step 7 — Record a successful sale (60 s)

1. Go to **New Sale**.
2. Vendor: **Maseru Central Market**.
3. Payment: **CASH**, Amount paid: **90**.
4. Items:
   - Apples, MEDIUM, qty **2** (server price from DB, e.g. 45 → line M 90)
5. Save.

**Expected:** green alert: *“Sale #N recorded. Total: M 90.00 (PAID)”*

6. Go to **Stock** — Apples-MEDIUM decreased by 2.

**Say:** “Price came from `stock.selling_price`; payment status was derived automatically from amount_paid vs total.”

---

## Step 8 — ⭐ **FAILED sale — full rollback (the money shot)** (90 s)

This is the **explicit assignment requirement**. Make it very clear.

1. Go to **Stock**. Note how many **LARGE apples** are available (e.g. **6**).
2. Go to **New Sale**.
3. Vendor: any vendor.
4. Payment: CASH, Amount paid **0**.
5. Items:
   - **Apples, LARGE, qty 10** (asking for more than available)
   - **Bananas, SMALL, qty 1** (a second item to prove the whole sale aborts)
6. Click **Save Sale**.

**Expected:** red alert: *“Insufficient stock for Apples (LARGE): requested 10, available 6”*

7. **Do NOT move on yet.** Navigate back to:
   - **Sales** → confirm **no new sale** appears (same count as before).
   - **Stock** → confirm Apples-LARGE is **still 6** and Bananas-SMALL is **unchanged**.

**Say (slowly, on camera):**  
“The server began a transaction, locked the stock rows with SELECT FOR UPDATE, detected that 10 was more than 6, issued a ROLLBACK, and returned **400**. No sale row, no sale detail rows, no stock decrement — the entire operation was atomic.”

Optional: switch to the terminal and show the server logs — the transaction begin/rollback lines.

---

## Step 9 — Payments — partially paid → paid (60 s)

1. Go to **Sales**. Find the seeded sale that is **PARTIALLY_PAID** (e.g. *Maseru Central Market*, total M 290, paid M 150).
2. Click **View / Pay**.
3. Note the **Amount paid** vs **Total**.
4. Enter amount **140**, method **MOBILE_MONEY**, submit.

**Expected:** green alert: *“Payment recorded.”* The row now shows **PAID** and outstanding balance for that vendor drops to M 0.00.

Then try to overpay:
5. Open a **PAID** sale, enter M 1000 — expect **400** with a clear message.

**Say:** “Payment status is recomputed on every payment; overpayment is rejected.”

---

## Step 10 — Reports (60 s)

Go to **Reports**. Scroll through all **five**:

1. **Top 5 fruits** — ordered by boxes sold.
2. **Revenue for date range** — change `from` / `to`, click **Apply**, watch the number change.
3. **Top vendor** — the one with most boxes bought.
4. **Stock levels** — 15 rows, low ones highlighted in red.
5. **Outstanding balances** — per-vendor billed / paid / outstanding, red where balance > 0.

**Say:** “Each report runs a dedicated SQL query in `reportModel.js`; those queries are pasted verbatim in the backend README.”

---

## Step 11 — Quick closing (15 s)

Final slide on screen:

- Backend: `http://localhost:5000` — Node.js + Express + MySQL
- Frontend: `http://localhost:5173` — React + Vite
- Repo + live link + this video attached per the submission form.

**Say:** “That completes the demonstration. Thank you.”

---

## Optional — show `transactions_demo.sql` (only if you have extra time)

In a terminal:
```bash
mysql -u root -p batloung_farm < backend/src/database/transactions_demo.sql
```
Show that Scenario 1 commits (a row exists in `sales`) and Scenario 2 rolls back (no row).

---

## Post-recording

- [ ] Video uploaded (unlisted Drive/YouTube/OneDrive)
- [ ] Link pasted into `demo-video-link.txt` at project root
- [ ] Link included in submission form along with repo + live link