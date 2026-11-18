import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Alert from '../components/Alert';
import Loader from '../components/Loader';

// Dashboard: pulls a few quick numbers so the admin gets an overview.
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [stats, setStats]     = useState({
    suppliers: 0,
    fruits: 0,
    vendors: 0,
    sales: 0,
    lowStock: 0,
    outstanding: 0
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');

        const [sup, fr, ven, sl, low, bal] = await Promise.all([
          api.get('/suppliers'),
          api.get('/fruits'),
          api.get('/vendors'),
          api.get('/sales'),
          api.get('/stock/low'),
          api.get('/reports/outstanding-balances')
        ]);

        const totalOutstanding = (bal.data.data || []).reduce(
          (s, v) => s + Number(v.outstanding_balance || 0),
          0
        );

        setStats({
          suppliers:   (sup.data.data || []).length,
          fruits:      (fr.data.data  || []).length,
          vendors:     (ven.data.data || []).length,
          sales:       (sl.data.data  || []).length,
          lowStock:    (low.data.data || []).length,
          outstanding: totalOutstanding
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader text="Loading dashboard…" />;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="stats-grid">
        <StatCard title="Suppliers"    value={stats.suppliers} />
        <StatCard title="Fruits"       value={stats.fruits} />
        <StatCard title="Vendors"      value={stats.vendors} />
        <StatCard title="Sales"        value={stats.sales} />
        <StatCard title="Low Stock"    value={stats.lowStock}    highlight />
        <StatCard title="Outstanding"  value={`M ${stats.outstanding.toFixed(2)}`} highlight />
      </div>

      <div className="quick-actions">
        <h2>Quick actions</h2>
        <div className="quick-actions-row">
          <Link to="/suppliers"     className="btn btn-outline">Manage Suppliers</Link>
          <Link to="/purchases/new" className="btn btn-primary">Record Purchase</Link>
          <Link to="/sales/new"     className="btn btn-primary">Record Sale</Link>
          <Link to="/reports"       className="btn btn-outline">View Reports</Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight }) {
  return (
    <div className={`stat-card${highlight ? ' stat-card-highlight' : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
    </div>
  );
}