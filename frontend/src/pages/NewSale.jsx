import { useEffect, useState } from 'react';
import api from '../api/axios';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import { PACKAGING_SIZES, PAYMENT_METHODS } from '../constants';

const blankItem = () => ({
  fruit_id: '',
  packaging_size: 'SMALL',
  quantity: 1
});

export default function NewSale() {
  const [vendors, setVendors]   = useState([]);
  const [fruits, setFruits]     = useState([]);
  const [stock, setStock]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const [vendorId, setVendorId]         = useState('');
  const [paymentMethod, setMethod]      = useState('CASH');
  const [amountPaid, setAmountPaid]     = useState(0);
  const [items, setItems]               = useState([blankItem()]);

  async function loadData() {
    try {
      setLoading(true);
      const [ven, fr, st] = await Promise.all([
        api.get('/vendors'),
        api.get('/fruits'),
        api.get('/stock')
      ]);
      setVendors(ven.data.data || []);
      setFruits(fr.data.data || []);
      setStock(st.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // Lookup selling price + available quantity from the live stock list
  function stockInfo(fruitId, size) {
    return stock.find(
      (s) => Number(s.fruit_id) === Number(fruitId) && s.packaging_size === size
    ) || null;
  }

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }
  function addItem() { setItems((prev) => [...prev, blankItem()]); }
  function removeItem(i) { setItems((prev) => prev.filter((_, idx) => idx !== i)); }

  // Estimate shown to admin; server calculates the authoritative total from stock.selling_price
  const estimatedTotal = items.reduce((sum, it) => {
    const info = stockInfo(it.fruit_id, it.packaging_size);
    const price = info ? Number(info.selling_price) : 0;
    return sum + (Number(it.quantity) || 0) * price;
  }, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      if (!vendorId) throw new Error('Please choose a vendor.');
      if (items.length === 0) throw new Error('Add at least one item.');

      const payload = {
        vendor_id: Number(vendorId),
        payment_method: paymentMethod,
        amount_paid: Number(amountPaid),
        items: items.map((it) => ({
          fruit_id: Number(it.fruit_id),
          packaging_size: it.packaging_size,
          quantity: Number(it.quantity)
        }))
      };

      const res = await api.post('/sales', payload);
      setSuccess(
        `Sale #${res.data.data.sale_id} recorded. Total: M ${Number(res.data.data.total_amount).toFixed(2)} ` +
        `(${res.data.data.payment_status})`
      );
      setVendorId('');
      setMethod('CASH');
      setAmountPaid(0);
      setItems([blankItem()]);
      loadData();
    } catch (err) {
      // The server returns 400 with e.g. "Insufficient stock for Apples (LARGE): requested 10, available 6"
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader text="Loading vendors, fruits and stock…" />;

  return (
    <div>
      <h1 className="page-title">Record Sale</h1>
      <Alert type="error"   message={error}   onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Vendor
            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
              <option value="">— Choose vendor —</option>
              {vendors.map((v) => (
                <option key={v.vendor_id} value={v.vendor_id}>
                  {v.vendor_name} — {v.phone_number}
                </option>
              ))}
            </select>
          </label>
          <label>Payment method
            <select value={paymentMethod} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
          <label>Amount paid (M)
            <input type="number" min="0" step="0.01" value={amountPaid}
                   onChange={(e) => setAmountPaid(e.target.value)} />
          </label>
        </div>

        <h2 className="card-title">Items</h2>

        {items.map((it, i) => {
          const info = stockInfo(it.fruit_id, it.packaging_size);
          const avail = info ? Number(info.available_quantity) : null;
          const price = info ? Number(info.selling_price) : null;
          const lineEstimate = price != null ? (Number(it.quantity) || 0) * price : 0;
          const notEnough = avail != null && Number(it.quantity) > avail;

          return (
            <div key={i} className="item-row">
              <label>
                Fruit
                <select value={it.fruit_id} onChange={(e) => updateItem(i, 'fruit_id', e.target.value)} required>
                  <option value="">— Choose fruit —</option>
                  {fruits.map((f) => (
                    <option key={f.fruit_id} value={f.fruit_id}>{f.fruit_name}</option>
                  ))}
                </select>
              </label>
              <label>
                Size
                <select value={it.packaging_size} onChange={(e) => updateItem(i, 'packaging_size', e.target.value)}>
                  {PACKAGING_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>
                Quantity
                <input type="number" min="1" value={it.quantity}
                       onChange={(e) => updateItem(i, 'quantity', e.target.value)} required />
              </label>
              <div className="stock-hint">
                {avail != null ? (
                  <span className={notEnough ? 'text-danger' : 'text-muted'}>
                    Available: {avail} — price M {price.toFixed(2)} — line ≈ M {lineEstimate.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-muted">Choose fruit & size to see availability</span>
                )}
              </div>
              <button type="button" className="btn btn-sm btn-danger"
                      onClick={() => removeItem(i)} disabled={items.length === 1}>
                Remove
              </button>
            </div>
          );
        })}

        <button type="button" className="btn btn-outline" onClick={addItem}>+ Add item</button>

        <div className="total-box">
          <strong>Estimated total: M {estimatedTotal.toFixed(2)}</strong>
          <span className="hint">Server recalculates and validates stock before saving.</span>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Sale'}
          </button>
        </div>
      </form>
    </div>
  );
}