import { useEffect, useState } from 'react';
import api from '../api/axios';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import { PACKAGING_SIZES } from '../constants';

const blankItem = () => ({
  fruit_id: '',
  packaging_size: 'SMALL',
  quantity: 1,
  unit_cost: 0,
  selling_price: ''
});

export default function NewPurchase() {
  const [suppliers, setSuppliers] = useState([]);
  const [fruits, setFruits]       = useState([]);
  const [stockRows, setStockRows] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const [supplierId, setSupplierId] = useState('');
  const [items, setItems]           = useState([blankItem()]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [sup, fr, stock] = await Promise.all([
          api.get('/suppliers'),
          api.get('/fruits'),
          api.get('/stock')
        ]);
        setSuppliers(sup.data.data || []);
        setFruits(fr.data.data || []);
        setStockRows(stock.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => {
      if (i !== index) return it;
      return {
        ...it,
        [field]: value,
        ...(['fruit_id', 'packaging_size'].includes(field) && { selling_price: '' })
      };
    }));
  }

  function addItem() { setItems((prev) => [...prev, blankItem()]); }
  function removeItem(i) { setItems((prev) => prev.filter((_, idx) => idx !== i)); }

  // Live estimate shown to admin; the SERVER still calculates the authoritative total.
  const estimatedTotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_cost) || 0),
    0
  );
  const stockKeys = new Set(stockRows.map((row) => `${row.fruit_id}:${row.packaging_size}`));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      if (!supplierId) throw new Error('Please choose a supplier.');
      if (items.length === 0) throw new Error('Add at least one item.');

      const payload = {
        supplier_id: Number(supplierId),
        items: items.map((it, index) => {
          const key = `${it.fruit_id}:${it.packaging_size}`;
          const alreadyStocked = stockKeys.has(key) || items.slice(0, index).some(
            (previous) => `${previous.fruit_id}:${previous.packaging_size}` === key
          );
          return {
            fruit_id: Number(it.fruit_id),
            packaging_size: it.packaging_size,
            quantity: Number(it.quantity),
            unit_cost: Number(it.unit_cost),
            ...(!alreadyStocked && { selling_price: Number(it.selling_price) })
          };
        })
      };

      const res = await api.post('/purchases', payload);
      setSuccess(`Purchase #${res.data.data.purchase_id} recorded. Total: M ${Number(res.data.data.total_amount).toFixed(2)}`);
      setStockRows((previous) => [
        ...previous,
        ...payload.items
          .filter((item) => item.selling_price !== undefined)
          .map(({ fruit_id, packaging_size, selling_price }) => ({
            fruit_id,
            packaging_size,
            selling_price
          }))
      ]);
      setSupplierId('');
      setItems([blankItem()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader text="Loading suppliers, fruits and stock…" />;

  return (
    <div>
      <h1 className="page-title">Record Purchase</h1>
      <Alert type="error"   message={error}   onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <form className="card" onSubmit={handleSubmit}>
        <label className="form-label-block">
          Supplier
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
            <option value="">— Choose supplier —</option>
            {suppliers.map((s) => (
              <option key={s.supplier_id} value={s.supplier_id}>
                {s.business_name} — {s.province}
              </option>
            ))}
          </select>
        </label>

        <h2 className="card-title">Items</h2>

        {items.map((it, i) => {
          const key = `${it.fruit_id}:${it.packaging_size}`;
          const needsSellingPrice = it.fruit_id && !stockKeys.has(key) && !items.slice(0, i).some(
            (previous) => `${previous.fruit_id}:${previous.packaging_size}` === key
          );
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
              <label>
                Unit cost
                <input type="number" min="0.01" step="0.01" value={it.unit_cost}
                       onChange={(e) => updateItem(i, 'unit_cost', e.target.value)} required />
              </label>
              {needsSellingPrice && (
                <label>
                  Initial selling price
                  <input type="number" min="0.01" step="0.01" value={it.selling_price}
                         onChange={(e) => updateItem(i, 'selling_price', e.target.value)} required />
                </label>
              )}
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
          <span className="hint">Server recalculates and confirms the final total.</span>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Purchase'}
          </button>
        </div>
      </form>
    </div>
  );
}