import { useEffect, useState } from 'react';
import api from '../api/axios';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import DataTable from '../components/DataTable';

const emptyForm = {
  vendor_name: '',
  phone_number: '',
  location: '',
  registration_date: new Date().toISOString().slice(0, 10)
};

export default function Vendors() {
  const [rows, setRows]       = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm]       = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function load(term = '') {
    try {
      setLoading(true);
      setError('');
      const url = term ? `/vendors?search=${encodeURIComponent(term)}` : '/vendors';
      const res = await api.get(url);
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load(search);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function startEdit(row) {
    setEditingId(row.vendor_id);
    setForm({
      vendor_name:       row.vendor_name,
      phone_number:      row.phone_number,
      location:          row.location,
      registration_date: row.registration_date
    });
    setError(''); setSuccess('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      if (editingId) {
        await api.put(`/vendors/${editingId}`, form);
        setSuccess('Vendor updated.');
      } else {
        await api.post('/vendors', form);
        setSuccess('Vendor created.');
      }
      resetForm();
      load(search);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'vendor_id',    header: 'ID' },
    { key: 'vendor_name',  header: 'Name' },
    { key: 'phone_number', header: 'Phone' },
    { key: 'location',     header: 'Location' },
    { key: 'registration_date', header: 'Registered' },
    {
      key: 'outstanding_balance', header: 'Outstanding',
      render: (r) => {
        const v = Number(r.outstanding_balance || 0);
        return (
          <span className={`money ${v > 0 ? 'money-due' : 'money-ok'}`}>
            M {v.toFixed(2)}
          </span>
        );
      }
    },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <div className="row-actions">
          <button className="btn btn-sm btn-outline" onClick={() => startEdit(r)}>Edit</button>
        </div>
      )
    }
  ];

  return (
    <div>
      <h1 className="page-title">Vendors</h1>
      <Alert type="error"   message={error}   onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <form className="toolbar" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">Search</button>
        <button
          className="btn btn-outline"
          type="button"
          onClick={() => { setSearch(''); load(''); }}
        >
          Clear
        </button>
      </form>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2 className="card-title">{editingId ? 'Edit Vendor' : 'Add Vendor'}</h2>
        <div className="form-row">
          <label>Vendor name
            <input name="vendor_name" value={form.vendor_name} onChange={handleChange} required />
          </label>
          <label>Phone number
            <input name="phone_number" value={form.phone_number} onChange={handleChange} required />
          </label>
        </div>
        <div className="form-row">
          <label>Location
            <input name="location" value={form.location} onChange={handleChange} required />
          </label>
          <label>Registration date
            <input type="date" name="registration_date" value={form.registration_date} onChange={handleChange} required />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update Vendor' : 'Add Vendor'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
          )}
        </div>
      </form>

      {loading ? <Loader /> : <DataTable columns={columns} rows={rows} />}
    </div>
  );
}