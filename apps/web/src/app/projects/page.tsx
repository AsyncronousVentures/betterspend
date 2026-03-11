'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: COLORS.accentGreenLight, text: '#15803d' },
  completed: { bg: COLORS.accentBlueLight, text: '#1d4ed8' },
  cancelled: { bg: COLORS.accentRedLight, text: COLORS.accentRedDark },
  on_hold: { bg: COLORS.accentAmberLight, text: '#ca8a04' },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', departmentId: '', status: 'active', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.projects.list(), api.departments.list()]).then(([p, d]) => {
      setProjects(p);
      setDepartments(d);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function load() {
    const data = await api.projects.list();
    setProjects(data);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name, code: form.code,
        departmentId: form.departmentId || undefined,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (editingId) {
        await api.projects.update(editingId, payload);
      } else {
        await api.projects.create(payload);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project?')) return;
    try {
      await api.projects.remove(id);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function startEdit(project: any) {
    setForm({
      name: project.name, code: project.code,
      departmentId: project.departmentId || '',
      status: project.status || 'active',
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      endDate: project.endDate ? project.endDate.slice(0, 10) : '',
    });
    setEditingId(project.id);
    setShowForm(true);
  }

  function resetForm() {
    setForm({ name: '', code: '', departmentId: '', status: 'active', startDate: '', endDate: '' });
  }

  const deptById = Object.fromEntries(departments.map((d) => [d.id, d]));

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.textPrimary }}>Projects</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }} style={{ padding: '0.5rem 1rem', background: COLORS.accentBlue, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
          + New Project
        </button>
      </div>

      {showForm && (
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.tableBorder}`, borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: SHADOWS.card }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>{editingId ? 'Edit' : 'New'} Project</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Code *</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. PROJ-001" style={{ width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Department</label>
              <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px' }}>
                <option value="">None</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px' }}>
                {['active', 'on_hold', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
          </div>
          {error && <div style={{ marginTop: '0.75rem', background: COLORS.accentRedLight, border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.5rem 0.75rem', color: COLORS.accentRedDark, fontSize: '0.875rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={handleSave} disabled={saving || !form.name || !form.code} style={{ padding: '0.5rem 1rem', background: COLORS.accentBlue, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setShowForm(false); setError(''); }} style={{ padding: '0.5rem 1rem', background: COLORS.tableBorder, color: COLORS.textSecondary, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: COLORS.textSecondary }}>Loading...</p> : (
        <div style={{ background: COLORS.cardBg, borderRadius: '8px', border: `1px solid ${COLORS.tableBorder}`, overflow: 'hidden', boxShadow: SHADOWS.card }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: COLORS.tableHeaderBg, borderBottom: `1px solid ${COLORS.tableBorder}` }}>
                  {['Name', 'Code', 'Department', 'Status', 'Dates', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((project, i) => {
                  const sc = STATUS_COLORS[project.status] || { bg: COLORS.contentBg, text: COLORS.textSecondary };
                  return (
                    <tr key={project.id} style={{ borderBottom: i < projects.length - 1 ? `1px solid ${COLORS.contentBg}` : 'none' }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 500, color: COLORS.textPrimary }}>{project.name}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <code style={{ background: COLORS.contentBg, padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.85rem' }}>{project.code}</code>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary, fontSize: '0.875rem' }}>
                        {project.departmentId ? deptById[project.departmentId]?.name || '—' : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: sc.bg, color: sc.text }}>
                          {project.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary, fontSize: '0.8rem' }}>
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}
                        {project.endDate ? ` → ${new Date(project.endDate).toLocaleDateString()}` : ''}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => startEdit(project)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', border: `1px solid ${COLORS.tableBorder}`, borderRadius: '4px', background: COLORS.white, cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleDelete(project.id)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', border: '1px solid #fecaca', borderRadius: '4px', background: COLORS.white, color: COLORS.accentRedDark, cursor: 'pointer' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {projects.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: COLORS.textMuted }}>No projects yet.</div>}
        </div>
      )}
    </div>
  );
}
