import { useEffect, useState } from 'react';
import api from '../api/axios';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import DataTable from '../components/DataTable';

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [topFruits, setTopFruits]       = useState([]);
  const [revenue, setRevenue]           = useState(null);
  const [topVendor, setTopVendor]       = useState(null);
  const [stockLevels, setStockLevels]   = useState([]);
  const [balances, setBalances]         = useState([]);

  const [from, setFrom] = useState(monthAgo);
  const [to, setTo]     = useState(today);

  async function loadAll(fromDate, toDate) {
    try {
      setLoading(true);
      setError('');
      const [tf, rev, tv, sl, bal] = await Promise.all([
        api.get('/reports/top-fruits'),
        api.get('/reports/revenue', { params: { from: fromDate, to: toDate } }),
        api.get('/reports/top-vendor'),
        api.get('/reports/stock-levels'),
        api.get('/reports/outstanding-balances')
      ]);
      setTopFruits(tf.data.data || []);
      setRevenue(rev.data.data || null);
      setTopVendor(tv.data.data || null);
      setStockLevels(sl.data.data || []);
      setBalances(bal.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(from, to); /* eslint-disable-next-line */ }, []);

  function applyDateRange(e) {
    e.preventDefault();
    loadAll(from, to);
  }

  return (
    <div>
      <h1 className="page-title">Reports</h1>
      <Alert type="error" message={error} onClose={() => setError('')} />

      <form className="toolbar" onSubmit={applyDateRange}>
        <label>From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button className="btn btn-primary" type="submit">Apply</button>
      </form>

      {loading ? <Loader /> : (
        <>
          <section className="card">
            <h2 className="card-title">1. Top 5 Fruits (by boxes sold)</h2>
            <DataTable
              rows={topFruits}
              columns={[
                { key: 'fruit_name', header: 'Fruit' },
                { key: 'total_boxes_sold', header: 'Boxes sold' }
              ]}
            />
          </section>

          <section className="card">
            <h2 className="card-title">2. Revenue ({from} → {to})</h2>
            {revenue && (
              <div className="report-summary">
                <div><span>Total revenue</span><strong>M {Number(revenue.total_revenue).toFixed(2)}</strong></div>
                <div><span>Number of sales</span><strong>{revenue.sale_count}</strong></div>
              </div>
            )}
          </section>

          <section className="card">
            <h2 className="card-title">3. Top Vendor (by boxes purchased)</h2>
            {topVendor ? (
              <div className="report-summary">
                <div><span>Vendor</span><strong>{topVendor.vendor_name}</strong></div>
                <div><span>Total boxes</span><strong>{topVendor.total_boxes}</strong></div>
              </div>
            ) : (
              <p>No sales yet.</p>
            )}
          </section>

          <section className="card">
            <h2 className="card-title">4. Current Stock Levels (fruit × size)</h2>
            <DataTable
              rows={stockLevels}
              columns={[
                { key: 'fruit_name', header: 'Fruit' },
                { key: 'packaging_size', header: 'Size' },
                { key: 'available_quantity', header: 'Available' },
                { key: 'reorder_level', header: 'Reorder at' }
              ]}
              highlightRow={(r) => Number(r.available_quantity) <= Number(r.reorder_level)}
            />
          </section>

          <section className="card">
            <h2 className="card-title">5. Outstanding Balances per Vendor</h2>
            <DataTable
              rows={balances}
              columns={[
                { key: 'vendor_name', header: 'Vendor' },
                { key: 'total_billed', header: 'Billed', render: (r) => `M ${Number(r.total_billed).toFixed(2)}` },
                { key: 'total_paid', header: 'Paid',    render: (r) => `M ${Number(r.total_paid).toFixed(2)}` },
                {
                  key: 'outstanding_balance',
                  header: 'Outstanding',
                  render: (r) => `M ${Number(r.outstanding_balance).toFixed(2)}`
                }
              ]}
              highlightRow={(r) => Number(r.outstanding_balance) > 0}
            />
          </section>
        </>
      )}
    </div>
  );
}