'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const ALL_EVENTS = [
  'requisition.created', 'requisition.approved', 'requisition.rejected',
  'purchase_order.created', 'purchase_order.issued', 'purchase_order.cancelled',
  'invoice.created', 'invoice.matched', 'invoice.approved',
  'receiving.created',
  'budget.exceeded',
];

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<any | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [form, setForm] = useState({ url: '', events: [] as string[], secret: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await api.webhooks.list();
      setEndpoints(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await api.webhooks.create({ url: form.url, events: form.events, secret: form.secret || undefined });
      setShowForm(false);
      setForm({ url: '', events: [], secret: '' });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(ep: any) {
    try {
      await api.webhooks.update(ep.id, { isActive: !ep.isActive });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this webhook endpoint?')) return;
    try {
      await api.webhooks.remove(id);
      if (selectedEndpoint?.id === id) setSelectedEndpoint(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function viewDeliveries(ep: any) {
    setSelectedEndpoint(ep);
    try {
      const data = await api.webhooks.deliveries(ep.id);
      setDeliveries(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  function toggleEvent(event: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter((e) => e !== event) : [...f.events, event],
    }));
  }

  const statusColor: Record<string, string> = {
    delivered: '#15803d', failed: '#dc2626', retrying: '#d97706', pending: '#6b7280',
  };

  return (
    <div style={{ padding: '2rem' }}>
      {error && (
        <div style={{ marginBottom: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.625rem 1rem', color: '#991b1b', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}>×</button>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Webhooks</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
        >
          + New Endpoint
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>New Webhook Endpoint</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>URL *</label>
              <input
                value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://example.com/webhook"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Secret (leave blank to auto-generate)</label>
              <input
                value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
                placeholder="Optional HMAC secret"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Events (empty = all events)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {ALL_EVENTS.map((ev) => (
                  <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} />
                    {ev}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSave} disabled={saving || !form.url} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: '#6b7280' }}>Loading...</p> : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {endpoints.map((ep) => (
            <div key={ep.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>{ep.url}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Events: {ep.events.length === 0 ? 'All' : ep.events.join(', ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: ep.isActive ? '#dcfce7' : '#fee2e2', color: ep.isActive ? '#15803d' : '#dc2626' }}>
                    {ep.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => viewDeliveries(ep)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Deliveries</button>
                  <button onClick={() => handleToggleActive(ep)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>
                    {ep.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(ep.id)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', border: '1px solid #fecaca', borderRadius: '4px', background: '#fff', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {endpoints.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>No webhook endpoints yet.</div>}
        </div>
      )}

      {selectedEndpoint && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Deliveries — {selectedEndpoint.url}</h2>
            <button onClick={() => setSelectedEndpoint(null)} style={{ fontSize: '0.875rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Event', 'Status', 'Attempts', 'Response', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d, i) => (
                  <tr key={d.id} style={{ borderBottom: i < deliveries.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>{d.eventType}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8rem', color: statusColor[d.status] || '#6b7280' }}>{d.status}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>{d.attempts}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>{d.responseStatus || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.8rem' }}>{new Date(d.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deliveries.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No deliveries yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
