import { useEffect, useState } from 'react';
import api from '../api/axios';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import DataTable from '../components/DataTable';

export default function Stock() {
  const [rows, setRows]       = useState([]);
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const url = lowOnly ? '/stock/low' : '/stock';
      const res = await api.get(url);
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [lowOnly]);

  const columns = [
    { key: 'fruit_name',         header: 'Fruit' },
    {
      key: 'packaging_size', header: 'Packaging',
      render: (r) => <span className={`badge badge-size-${r.packaging_size.toLowerCase()}`}>{r.packaging_size}</span>
    },
    { key: 'available_quantity', header: 'Available' },
    { key: 'reorder_level',      header: 'Reorder at' },
    {
      key: 'selling_price', header: 'Selling price',
      render: (r) => `M ${Number(r.selling_price).toFixed(2)}`
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const low = Number(r.available_quantity) <= Number(r.reorder_level);
        return <span className={`badge badge-${low ? 'danger' : 'success'}`}>{low ? 'LOW' : 'OK'}</span>;
      }
    }
  ];

  return (
    <div>
      <h1 className="page-title">Stock</h1>
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="toolbar">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
          />
          Show only low stock
        </label>
        <button className="btn btn-outline" onClick={load}>Refresh</button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          highlightRow={(r) => Number(r.available_quantity) <= Number(r.reorder_level)}
        />
      )}
    </div>
  );
}