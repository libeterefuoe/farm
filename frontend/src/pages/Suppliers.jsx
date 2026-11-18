import { useEffect, useState } from 'react';
import api from '../api/axios';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import DataTable from '../components/DataTable';
import { PROVINCES } from '../constants';

const emptyForm = {
  business_name: '',
  contact_person: '',
  phone: '',
  province: PROVINCES[0],
  address: ''
};

export default function Suppliers() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm]       = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function startEdit(row) {
    setEditingId(row.supplier_id);
    setForm({
      business_name:  row.business_name,
      contact_person: row.contact_person,
      phone:          row.phone,
      province:       row.province,
      address:        row.address
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
        await api.put(`/suppliers/${editingId}`, form);
        setSuccess('Supplier updated.');
      } else {
        await api.post('/suppliers', form);
        setSuccess('Supplier created.');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete supplier "${row.business_name}"?`)) return;
    setError(''); setSuccess('');
    try {
      await api.delete(`/suppliers/${row.supplier_id}`);
      setSuccess('Supplier deleted.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const columns = [
    { key: 'supplier_id',    header: 'ID' },
    { key: 'business_name',  header: 'Business' },
    { key: 'contact_person', header: 'Contact' },
    { key: 'phone',          header: 'Phone' },
    { key: 'province',       header: 'Province' },
    { key: 'address',        header: 'Address' },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="row-actions">
          <button className="btn btn-sm btn-outline" onClick={() => startEdit(r)}>Edit</button>
          <button className="btn btn-sm btn-danger"  onClick={() => handleDelete(r)}>Delete</button>
        </div>
      )
    }
  ];

  return (
    <div>
      <h1 className="page-title">Suppliers</h1>
      <Alert type="error"   message={error}   onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2 className="card-title">{editingId ? 'Edit Supplier' : 'Add Supplier'}</h2>
        <div className="form-row">
          <label>Business name
            <input name="business_name" value={form.business_name} onChange={handleChange} required />
          </label>
          <label>Contact person
            <input name="contact_person" value={form.contact_person} onChange={handleChange} required />
          </label>
        </div>
        <div className="form-row">
          <label>Phone
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <label>Province
            <select name="province" value={form.province} onChange={handleChange}>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
        <label>Address
          <input name="address" value={form.address} onChange={handleChange} required />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update Supplier' : 'Add Supplier'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? <Loader /> : <DataTable columns={columns} rows={rows} />}
    </div>
  );
}