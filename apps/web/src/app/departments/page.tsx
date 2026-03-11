'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', parentId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await api.departments.list();
      setDepartments(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { name: form.name, code: form.code, parentId: form.parentId || undefined };
      if (editingId) {
        await api.departments.update(editingId, payload);
      } else {
        await api.departments.create(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', code: '', parentId: '' });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this department?')) return;
    try {
      await api.departments.remove(id);
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  function startEdit(dept: any) {
    setForm({ name: dept.name, code: dept.code, parentId: dept.parentId || '' });
    setEditingId(dept.id);
    setShowForm(true);
  }

  const deptById = Object.fromEntries(departments.map((d) => [d.id, d]));

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Departments</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', code: '', parentId: '' }); }} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
          + New Department
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>{editingId ? 'Edit' : 'New'} Department</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Code *</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. ENG, FIN" style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Parent Department</label>
              <select value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                <option value="">None</option>
                {departments.filter((d) => d.id !== editingId).map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={handleSave} disabled={saving || !form.name || !form.code} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: '#6b7280' }}>Loading...</p> : (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Name', 'Code', 'Parent', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, i) => (
                <tr key={dept.id} style={{ borderBottom: i < departments.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 500, color: '#111827' }}>{dept.name}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <code style={{ background: '#f3f4f6', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.85rem' }}>{dept.code}</code>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    {dept.parentId ? deptById[dept.parentId]?.name || dept.parentId : '—'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => startEdit(dept)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(dept.id)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', border: '1px solid #fecaca', borderRadius: '4px', background: '#fff', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {departments.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No departments yet.</div>}
        </div>
      )}
    </div>
  );
}
