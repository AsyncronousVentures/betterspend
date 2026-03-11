'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { COLORS, SHADOWS } from '../../../lib/theme';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: `1px solid ${COLORS.inputBorder}`,
  borderRadius: '6px',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: COLORS.textSecondary,
  marginBottom: '0.25rem',
};

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    unit: 'each',
    reorderPoint: '',
    reorderQuantity: '',
    location: '',
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      setError('SKU and Name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const item = await api.inventory.create({
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        unit: form.unit.trim() || 'each',
        reorderPoint: form.reorderPoint !== '' ? Number(form.reorderPoint) : undefined,
        reorderQuantity: form.reorderQuantity !== '' ? Number(form.reorderQuantity) : undefined,
        location: form.location.trim() || undefined,
      });
      router.push(`/inventory/${item.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '680px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/inventory" style={{ fontSize: '0.875rem', color: COLORS.accentBlue, textDecoration: 'none' }}>
          &larr; Back to Inventory
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.75rem 0 0', color: COLORS.textPrimary }}>
          New Inventory Item
        </h1>
      </div>

      {error && (
        <div style={{ background: COLORS.accentRedLight, border: `1px solid #fecaca`, borderRadius: '6px', padding: '0.75rem 1rem', color: COLORS.accentRedDark, fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: '8px', padding: '1.5rem', boxShadow: SHADOWS.card }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 600, color: COLORS.textPrimary }}>
            Item Details
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>SKU *</label>
              <input
                style={inputStyle}
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                placeholder="e.g. WIDGET-001"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Unit of Measure</label>
              <input
                style={inputStyle}
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
                placeholder="each, kg, liter..."
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Name *</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Item name"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Reorder Point</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                value={form.reorderPoint}
                onChange={(e) => set('reorderPoint', e.target.value)}
                placeholder="Trigger reorder at this qty"
              />
            </div>
            <div>
              <label style={labelStyle}>Reorder Quantity</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                value={form.reorderQuantity}
                onChange={(e) => set('reorderQuantity', e.target.value)}
                placeholder="How much to reorder"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Storage Location</label>
            <input
              style={inputStyle}
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Warehouse A, Shelf 3"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.5rem 1.25rem',
              background: COLORS.accentBlue,
              color: COLORS.white,
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Creating...' : 'Create Item'}
          </button>
          <Link
            href="/inventory"
            style={{ padding: '0.5rem 1rem', border: `1px solid ${COLORS.border}`, borderRadius: '6px', textDecoration: 'none', color: COLORS.textSecondary, fontSize: '0.875rem', fontWeight: 500 }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
