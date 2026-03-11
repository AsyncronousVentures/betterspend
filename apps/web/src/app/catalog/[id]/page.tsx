'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db',
  borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box',
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: '#111827' }}>{value ?? '—'}</div>
    </div>
  );
}

export default function CatalogItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [id, setId] = useState('');
  const [form, setForm] = useState({
    name: '', sku: '', description: '', category: '',
    unitOfMeasure: 'each', unitPrice: '', currency: 'USD',
  });

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid);
      api.catalog.get(pid)
        .then((data) => {
          setItem(data);
          setForm({
            name: data.name || '', sku: data.sku || '',
            description: data.description || '', category: data.category || '',
            unitOfMeasure: data.unitOfMeasure || 'each',
            unitPrice: String(data.unitPrice || '0'), currency: data.currency || 'USD',
          });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    });
  }, []);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.catalog.update(id, {
        name: form.name, sku: form.sku || undefined, description: form.description || undefined,
        category: form.category || undefined, unitOfMeasure: form.unitOfMeasure,
        unitPrice: form.unitPrice, currency: form.currency,
      });
      setItem(updated);
      setEditing(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    setToggling(true);
    try {
      const updated = await api.catalog.update(id, { isActive: !item.isActive });
      setItem(updated);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setToggling(false);
    }
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>;
  if (!item) return <div style={{ padding: '2rem', color: '#dc2626' }}>Item not found. <Link href="/catalog" style={{ color: '#2563eb' }}>Back to catalog</Link></div>;

  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency || 'USD' }).format(parseFloat(item.unitPrice || '0'));

  return (
    <div style={{ padding: '2rem', maxWidth: '700px' }}>
      <Link href="/catalog" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>
        &larr; Back to Catalog
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '1rem 0 1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>{item.name}</h1>
            <span style={{
              padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
              background: item.isActive ? '#d1fae5' : '#f3f4f6',
              color: item.isActive ? '#065f46' : '#6b7280',
            }}>
              {item.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {item.sku && <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>SKU: {item.sku}</div>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {item.isActive && (
            <Link
              href={`/requisitions/new?catalogItemId=${item.id}&description=${encodeURIComponent(item.name)}&unitPrice=${encodeURIComponent(item.unitPrice ?? '0')}&uom=${encodeURIComponent(item.unitOfMeasure ?? 'each')}${item.vendor?.id ? `&vendorId=${item.vendor.id}` : ''}`}
              style={{ padding: '0.4rem 0.875rem', borderRadius: '6px', background: '#111827', color: '#fff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, display: 'inline-block' }}
            >
              + Create Requisition
            </Link>
          )}
          <button
            onClick={toggleActive}
            disabled={toggling}
            style={{ padding: '0.4rem 0.875rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
              background: item.isActive ? '#fef2f2' : '#d1fae5', color: item.isActive ? '#dc2626' : '#059669' }}
          >
            {toggling ? '…' : item.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => setEditing(!editing)}
            style={{ padding: '0.4rem 0.875rem', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, background: '#fff', color: '#374151' }}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {editing ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Edit Catalog Item</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Name *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>SKU</label>
              <input value={form.sku} onChange={(e) => set('sku', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Category</label>
              <input value={form.category} onChange={(e) => set('category', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Unit of Measure</label>
              <input value={form.unitOfMeasure} onChange={(e) => set('unitOfMeasure', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Unit Price</label>
              <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Currency</label>
              <input value={form.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} maxLength={3} style={inputStyle} />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || !form.name}
            style={{ marginTop: '1rem', background: '#111827', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <Field label="Name" value={item.name} />
            <Field label="SKU" value={item.sku} />
            <Field label="Category" value={item.category} />
            <Field label="Unit of Measure" value={item.unitOfMeasure} />
            <Field label="Unit Price" value={price} />
            <Field label="Currency" value={item.currency} />
            {item.description && <div style={{ gridColumn: '1 / -1' }}><Field label="Description" value={item.description} /></div>}
          </div>
        </div>
      )}

      {item.vendor && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Vendor</div>
          <Link href={`/vendors/${item.vendor.id}`} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
            {item.vendor.name}
          </Link>
        </div>
      )}
    </div>
  );
}
