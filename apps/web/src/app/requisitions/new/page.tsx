'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface LineItem {
  description: string;
  qty: string;
  uom: string;
  unitPrice: string;
}

const EMPTY_LINE: LineItem = { description: '', qty: '1', uom: 'each', unitPrice: '0' };

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fff',
  color: '#111827',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '0.375rem',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function NewRequisitionPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [currency, setCurrency] = useState('USD');
  const [neededBy, setNeededBy] = useState('');
  const [lines, setLines] = useState<LineItem[]>([{ ...EMPTY_LINE }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const total = lines.reduce((sum, l) => {
    const qty = parseFloat(l.qty) || 0;
    const price = parseFloat(l.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof LineItem, value: string) {
    setLines((prev) =>
      prev.map((line, i) => (i === idx ? { ...line, [field]: value } : line)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (lines.length === 0) {
      setError('At least one line item is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        currency,
        neededBy: neededBy || undefined,
        lines: lines.map((l) => ({
          description: l.description,
          qty: parseFloat(l.qty) || 1,
          uom: l.uom || 'each',
          unitPrice: parseFloat(l.unitPrice) || 0,
        })),
      };

      const res = await fetch(`${API_URL}/requisitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      router.push('/requisitions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/requisitions"
          style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}
        >
          &larr; Back to Requisitions
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0', color: '#111827' }}>
          New Requisition
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main fields card */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.25rem',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1.25rem', color: '#111827' }}>
            Details
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>
                Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Office supplies Q1"
                style={inputStyle}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes or justification"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Row: priority / currency / neededBy */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={inputStyle}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  maxLength={3}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Needed By</label>
                <input
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line items card */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#111827' }}>
              Line Items
            </h2>
            <button
              type="button"
              onClick={addLine}
              style={{
                background: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '0.375rem 0.875rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                color: '#374151',
                fontWeight: 500,
              }}
            >
              + Add Line
            </button>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '3fr 80px 80px 120px 100px 40px',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            {['Description', 'Qty', 'UOM', 'Unit Price', 'Total', ''].map((h) => (
              <div
                key={h}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {lines.map((line, idx) => {
            const lineTotal = (parseFloat(line.qty) || 0) * (parseFloat(line.unitPrice) || 0);
            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 80px 80px 120px 100px 40px',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  value={line.description}
                  onChange={(e) => updateLine(idx, 'description', e.target.value)}
                  placeholder="Item description"
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={line.qty}
                  min="0"
                  step="any"
                  onChange={(e) => updateLine(idx, 'qty', e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={line.uom}
                  onChange={(e) => updateLine(idx, 'uom', e.target.value)}
                  placeholder="each"
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={line.unitPrice}
                  min="0"
                  step="any"
                  onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)}
                  style={inputStyle}
                />
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                    paddingRight: '0.25rem',
                  }}
                >
                  {formatCurrency(lineTotal)}
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  disabled={lines.length === 1}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: lines.length === 1 ? 'not-allowed' : 'pointer',
                    color: lines.length === 1 ? '#d1d5db' : '#ef4444',
                    fontSize: '1rem',
                    padding: '0.25rem',
                  }}
                  title="Remove line"
                >
                  &times;
                </button>
              </div>
            );
          })}

          {/* Total row */}
          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Total</span>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#111827',
                fontVariantNumeric: 'tabular-nums',
                minWidth: '120px',
                textAlign: 'right',
              }}
            >
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              color: '#991b1b',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Saving...' : 'Create Requisition'}
          </button>
          <Link
            href="/requisitions"
            style={{
              background: '#fff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
