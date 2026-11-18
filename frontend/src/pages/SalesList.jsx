import { useEffect, useState } from 'react';
import api from '../api/axios';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import DataTable from '../components/DataTable';
import { PAYMENT_METHODS } from '../constants';

export default function SalesList() {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [selected, setSelected]   = useState(null);
  const [detail, setDetail]       = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('CASH');
  const [saving, setSaving]       = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/sales');
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function openDetail(saleId) {
    try {
      setError(''); setSuccess('');
      const res = await api.get(`/sales/${saleId}`);
      setDetail(res.data.data);
      setSelected(saleId);
      setPayAmount(0);
      setPayMethod('CASH');
    } catch (err) {
      setError(err.message);
    }
  }

  function closeDetail() {
    setSelected(null);
    setDetail(null);
  }

  async function submitPayment(e) {
    e.preventDefault();
    if (!detail) return;
    setError(''); setSuccess(''); setSaving(true);
    try {
      await api.post(`/sales/${detail.sale_id}/payments`, {
        payment_method: payMethod,
        amount: Number(payAmount)
      });
      setSuccess('Payment recorded.');
      closeDetail();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'sale_id',  header: 'Sale #' },
    { key: 'vendor_name', header: 'Vendor' },
    { key: 'sale_date',   header: 'Date' },
    {
      key: 'total_amount', header: 'Total',
      render: (r) => `M ${Number(r.total_amount).toFixed(2)}`
    },
    {
      key: 'amount_paid', header: 'Paid',
      render: (r) => `M ${Number(r.amount_paid).toFixed(2)}`
    },
    {
      key: 'payment_status', header: 'Status',
      render: (r) => {
        const map = { PAID: 'success', PARTIALLY_PAID: 'warning', UNPAID: 'danger' };
        return <span className={`badge badge-${map[r.payment_status] || 'muted'}`}>{r.payment_status}</span>;
      }
    },
    { key: 'payment_method', header: 'Method' },
    {
      key: 'actions', header: '',
      render: (r) => (
        <button className="btn btn-sm btn-outline" onClick={() => openDetail(r.sale_id)}>
          View / Pay
        </button>
      )
    }
  ];

  return (
    <div>
      <h1 className="page-title">Sales</h1>
      <Alert type="error"   message={error}   onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {loading ? <Loader /> : <DataTable columns={columns} rows={rows} />}

      {selected && detail && (
        <div className="modal-backdrop" onClick={closeDetail}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sale #{detail.sale_id} — {detail.vendor_name}</h2>
              <button className="btn btn-sm btn-outline" onClick={closeDetail}>Close</button>
            </div>

            <div className="modal-body">
              <p><strong>Date:</strong> {detail.sale_date}</p>
              <p><strong>Total:</strong> M {Number(detail.total_amount).toFixed(2)}</p>
              <p><strong>Paid:</strong> M {Number(detail.amount_paid).toFixed(2)}</p>
              <p><strong>Status:</strong> {detail.payment_status}</p>

              <h3>Items</h3>
              <table className="data-table">
                <thead>
                  <tr><th>Fruit</th><th>Size</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((it) => (
                    <tr key={it.sales_detail_id}>
                      <td>{it.fruit_name}</td>
                      <td>{it.packaging_size}</td>
                      <td>{it.quantity}</td>
                      <td>M {Number(it.unit_price).toFixed(2)}</td>
                      <td>M {(Number(it.quantity) * Number(it.unit_price)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {detail.payment_status !== 'PAID' && (
                <form className="payment-form" onSubmit={submitPayment}>
                  <h3>Record additional payment</h3>
                  <div className="form-row">
                    <label>Amount (M)
                      <input type="number" min="0.01" step="0.01" value={payAmount}
                             onChange={(e) => setPayAmount(e.target.value)} required />
                    </label>
                    <label>Method
                      <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                        {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </label>
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Submit Payment'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}