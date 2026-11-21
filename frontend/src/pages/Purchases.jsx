import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Alert from '../components/Alert';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';

export default function Purchases() {
  const [rows, setRows] = useState([]);
  const [unstocked, setUnstocked] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingKey, setSavingKey] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [purchases, history] = await Promise.all([
        api.get('/purchases'),
        api.get('/purchases/unstocked-history')
      ]);
      setRows(purchases.data.data || []);
      setUnstocked(history.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function restoreStock(row) {
    const key = `${row.fruit_id}:${row.packaging_size}`;
    const sellingPrice = Number(prices[key]);
    if (!sellingPrice || sellingPrice < 0) {
      setError('Enter a selling price greater than zero to restore stock.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setSavingKey(key);
      const res = await api.post('/purchases/reconcile-stock', {
        fruit_id: row.fruit_id,
        packaging_size: row.packaging_size,
        selling_price: sellingPrice
      });
      setSuccess(
        `Restored ${res.data.data.available_quantity} ${row.packaging_size} units of ${row.fruit_name} from purchase history.`
      );
      setUnstocked((previous) => previous.filter(
        (item) => `${item.fruit_id}:${item.packaging_size}` !== key
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingKey('');
    }
  }

  const columns = [
    { key: 'purchase_id', header: 'Purchase #' },
    { key: 'business_name', header: 'Supplier' },
    { key: 'purchase_date', header: 'Date' },
    {
      key: 'total_amount',
      header: 'Total',
      render: (row) => `M ${Number(row.total_amount).toFixed(2)}`
    }
  ];

  const unstockedColumns = [
    { key: 'fruit_name', header: 'Fruit' },
    { key: 'packaging_size', header: 'Size' },
    { key: 'available_quantity', header: 'Available from history' },
    {
      key: 'selling_price',
      header: 'Selling price (M)',
      render: (row) => {
        const key = `${row.fruit_id}:${row.packaging_size}`;
        return (
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={prices[key] || ''}
            onChange={(event) => setPrices((previous) => ({ ...previous, [key]: event.target.value }))}
            aria-label={`Selling price for ${row.fruit_name} ${row.packaging_size}`}
          />
        );
      }
    },
    {
      key: 'action',
      header: '',
      render: (row) => {
        const key = `${row.fruit_id}:${row.packaging_size}`;
        return (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => restoreStock(row)}
            disabled={savingKey === key}
          >
            {savingKey === key ? 'Restoring…' : 'Restore stock'}
          </button>
        );
      }
    }
  ];

  return (
    <div>
      <h1 className="page-title">Purchases</h1>
      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="toolbar">
        <Link to="/purchases/new" className="btn btn-primary">Record Purchase</Link>
        <button className="btn btn-outline" onClick={load}>Refresh</button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <DataTable columns={columns} rows={rows} emptyText="No purchases recorded yet." />
      )}

      <h2 className="card-title">Purchase history missing stock</h2>
      <p className="hint">
        Restore stock from recorded purchases without entering a duplicate purchase. Enter the selling price for each fruit and size.
      </p>
      {loading ? (
        <Loader />
      ) : (
        <DataTable
          columns={unstockedColumns}
          rows={unstocked}
          emptyText="No unstocked purchase history needs reconciliation."
        />
      )}
    </div>
  );
}
