'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

interface RequisitionLine {
  id: string;
  description: string;
  qty: string | number;
  uom: string;
  unitPrice: string | number;
}

interface Requisition {
  id: string;
  number: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  currency: string;
  totalAmount: string | null;
  neededBy: string | null;
  createdAt: string;
  lines: RequisitionLine[];
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  draft: { background: '#f3f4f6', color: '#374151' },
  pending_approval: { background: '#fef3c7', color: '#92400e' },
  approved: { background: '#d1fae5', color: '#065f46' },
  rejected: { background: '#fee2e2', color: '#991b1b' },
  cancelled: { background: '#f3f4f6', color: '#6b7280' },
  converted: { background: '#dbeafe', color: '#1e40af' },
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', pending_approval: 'Pending Approval', approved: 'Approved',
  rejected: 'Rejected', cancelled: 'Cancelled', converted: 'Converted',
};

function formatCurrency(amount: string | number | null, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

export default function RequisitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('');
  const [req, setReq] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid);
      api.requisitions.get(pid)
        .then((data) => setReq(data))
        .catch(() => setReq(null))
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function doAction(action: 'submit' | 'cancel') {
    setError('');
    setActionLoading(action);
    try {
      if (action === 'submit') await api.requisitions.submit(id);
      else await api.requisitions.cancel(id);
      const updated = await api.requisitions.get(id);
      setReq(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div style={{ padding: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</div>;
  if (!req) return (
    <div style={{ padding: '2rem', color: '#6b7280' }}>
      Requisition not found. <Link href="/requisitions" style={{ color: '#2563eb' }}>Back to list</Link>
    </div>
  );

  const lines = req.lines ?? [];
  const statusStyle = STATUS_COLORS[req.status] ?? { background: '#f3f4f6', color: '#374151' };

  return (
    <div style={{ padding: '2rem', maxWidth: '960px' }}>
      <Link href="/requisitions" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>
        &larr; Back to Requisitions
      </Link>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginTop: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>{req.number}</h1>
              <span style={{ ...statusStyle, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
                {STATUS_LABELS[req.status] ?? req.status}
              </span>
            </div>
            <p style={{ margin: '0.375rem 0 0', fontSize: '1rem', color: '#374151' }}>{req.title}</p>
            {req.description && <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>{req.description}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{formatCurrency(req.totalAmount, req.currency)}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{req.currency}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
          {[
            { label: 'Priority', value: req.priority.charAt(0).toUpperCase() + req.priority.slice(1) },
            { label: 'Created', value: new Date(req.createdAt).toLocaleDateString() },
            { label: 'Needed By', value: req.neededBy ? new Date(req.neededBy).toLocaleDateString() : '—' },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
              <div style={{ fontSize: '0.875rem', color: '#374151', marginTop: '0.25rem' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Line Items</h2>
        </div>
        {lines.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>No line items</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['#', 'Description', 'Qty', 'UOM', 'Unit Price', 'Total'].map((col) => (
                  <th key={col} style={{ padding: '0.625rem 1rem', textAlign: col === 'Qty' || col === 'Unit Price' || col === 'Total' ? 'right' : 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const lineTotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
                return (
                  <tr key={line.id} style={{ borderBottom: idx < lines.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#9ca3af', width: '2rem' }}>{idx + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{line.description}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#374151' }}>{Number(line.qty)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{line.uom}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#374151' }}>{formatCurrency(line.unitPrice, req.currency)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(lineTotal, req.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
                <td colSpan={5} style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Total</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatCurrency(req.totalAmount, req.currency)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {(req.status === 'draft' || req.status === 'pending_approval') && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {req.status === 'draft' && (
              <button onClick={() => doAction('submit')} disabled={actionLoading !== null}
                style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading === 'submit' ? 'Submitting…' : 'Submit for Approval'}
              </button>
            )}
            <button onClick={() => doAction('cancel')} disabled={actionLoading !== null}
              style={{ background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
              {actionLoading === 'cancel' ? 'Cancelling…' : 'Cancel Requisition'}
            </button>
          </div>
          {error && <div style={{ marginTop: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.625rem 1rem', color: '#991b1b', fontSize: '0.875rem' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
