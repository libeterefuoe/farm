import { useEffect, useState } from 'react';
import api from '../api/axios';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import { PACKAGING_SIZES } from '../constants';

const blankItem = () => ({
  fruit_id: '',
  packaging_size: 'SMALL',
  quantity: 1,
  unit_cost: 0
});

export default function NewPurchase() {
  const [suppliers, setSuppliers] = useState([]);
  const [fruits, setFruits]       = useState([]);
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
        const [sup, fr] = await Promise.all([
          api.get('/suppliers'),
          api.get('/fruits')
        ]);
        setSuppliers(sup.data.data || []);
        setFruits(fr.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function addItem() { setItems((prev) => [...prev, blankItem()]); }
  function removeItem(i) { setItems((prev) => prev.filter((_, idx) => idx !== i)); }

  // Live estimate shown to admin; the SERVER still calculates the authoritative total.
  const estimatedTotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_cost) || 0),
    0
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      if (!supplierId) throw new Error('Please choose a supplier.');
      if (items.length === 0) throw new Error('Add at least one item.');

      const payload = {
        supplier_id: Number(supplierId),
        items: items.map((it) => ({
          fruit_id: Number(it.fruit_id),
          packaging_size: it.packaging_size,
          quantity: Number(it.quantity),
          unit_cost: Number(it.unit_cost)
        }))
      };

      const res = await api.post('/purchases', payload);
      setSuccess(`Purchase #${res.data.data.purchase_id} recorded. Total: M ${Number(res.data.data.total_amount).toFixed(2)}`);
      setSupplierId('');
      setItems([blankItem()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader text="Loading suppliers and fruits…" />;

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

        {items.map((it, i) => (
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
            <button type="button" className="btn btn-sm btn-danger"
                    onClick={() => removeItem(i)} disabled={items.length === 1}>
              Remove
            </button>
          </div>
        ))}

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