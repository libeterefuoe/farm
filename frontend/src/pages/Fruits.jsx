import { useEffect, useState } from 'react';
import api from '../api/axios';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import DataTable from '../components/DataTable';
import { FRUIT_STATUSES } from '../constants';

const emptyForm = { fruit_name: '', description: '', status: 'ACTIVE' };

export default function Fruits() {
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
      const res = await api.get('/fruits');
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
    setEditingId(row.fruit_id);
    setForm({
      fruit_name:  row.fruit_name,
      description: row.description || '',
      status:      row.status
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
        await api.put(`/fruits/${editingId}`, form);
        setSuccess('Fruit updated.');
      } else {
        await api.post('/fruits', form);
        setSuccess('Fruit created.');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'fruit_id',    header: 'ID' },
    { key: 'fruit_name',  header: 'Name' },
    { key: 'description', header: 'Description' },
    {
      key: 'status', header: 'Status',
      render: (r) => <span className={`badge badge-${r.status === 'ACTIVE' ? 'success' : 'muted'}`}>{r.status}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="row-actions">
          <button className="btn btn-sm btn-outline" onClick={() => startEdit(r)}>Edit</button>
        </div>
      )
    }
  ];

  return (
    <div>
      <h1 className="page-title">Fruits</h1>
      <Alert type="error"   message={error}   onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2 className="card-title">{editingId ? 'Edit Fruit' : 'Add Fruit'}</h2>
        <div className="form-row">
          <label>Fruit name
            <input name="fruit_name" value={form.fruit_name} onChange={handleChange} required />
          </label>
          <label>Status
            <select name="status" value={form.status} onChange={handleChange}>
              {FRUIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <label>Description
          <input name="description" value={form.description} onChange={handleChange} />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update Fruit' : 'Add Fruit'}
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