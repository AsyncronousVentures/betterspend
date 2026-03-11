'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

interface POLine {
  id: string;
  description: string;
  qty: string | number;
  uom: string;
  unitPrice: string | number;
}

interface POVersion {
  id: string;
  version: number;
  changeReason: string | null;
  createdAt: string;
}

interface PurchaseOrder {
  id: string;
  number: string;
  vendor: { name: string } | null;
  version: number;
  status: string;
  currency: string;
  paymentTerms: string | null;
  notes: string | null;
  totalAmount: string | null;
  issuedAt: string | null;
  createdAt: string;
  lines: POLine[];
  versions?: POVersion[];
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  draft: { background: '#f3f4f6', color: '#374151' },
  approved: { background: '#d1fae5', color: '#065f46' },
  issued: { background: '#dbeafe', color: '#1e40af' },
  received: { background: '#ede9fe', color: '#5b21b6' },
  invoiced: { background: '#ffedd5', color: '#9a3412' },
  closed: { background: '#f3f4f6', color: '#6b7280' },
  cancelled: { background: '#fee2e2', color: '#991b1b' },
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', approved: 'Approved', issued: 'Issued',
  received: 'Received', invoiced: 'Invoiced', closed: 'Closed', cancelled: 'Cancelled',
};

function formatCurrency(amount: string | number | null, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('');
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeSubmitting, setChangeSubmitting] = useState(false);

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid);
      api.purchaseOrders.get(pid)
        .then((data) => setPo(data))
        .catch(() => setPo(null))
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function issuePO() {
    setActionError('');
    setActionLoading('issue');
    try {
      await api.purchaseOrders.issue(id);
      const updated = await api.purchaseOrders.get(id);
      setPo(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Issue failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function submitChangeOrder() {
    if (!changeReason.trim()) { setChangeError('Change reason is required.'); return; }
    setChangeError('');
    setChangeSubmitting(true);
    try {
      await api.purchaseOrders.changeOrder(id, { changeReason: changeReason.trim() });
      setChangeDialogOpen(false);
      setChangeReason('');
      const updated = await api.purchaseOrders.get(id);
      setPo(updated);
    } catch (err) {
      setChangeError(err instanceof Error ? err.message : 'Change order failed');
    } finally {
      setChangeSubmitting(false);
    }
  }

  if (loading) return <div style={{ padding: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</div>;
  if (!po) return (
    <div style={{ padding: '2rem', color: '#6b7280' }}>
      Purchase order not found. <Link href="/purchase-orders" style={{ color: '#2563eb' }}>Back to list</Link>
    </div>
  );

  const lines = po.lines ?? [];
  const versions = po.versions ?? [];
  const statusStyle = STATUS_COLORS[po.status] ?? { background: '#f3f4f6', color: '#374151' };
  const pdfUrl = `${API_BASE}/api/v1/purchase-orders/${po.id}/pdf`;
  const canIssue = po.status === 'draft' || po.status === 'approved';
  const canChangeOrder = po.status !== 'closed' && po.status !== 'cancelled';

  return (
    <div style={{ padding: '2rem', maxWidth: '960px' }}>
      <Link href="/purchase-orders" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>
        &larr; Back to Purchase Orders
      </Link>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginTop: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>{po.number}</h1>
              <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>V{po.version ?? 1}</span>
              <span style={{ ...statusStyle, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
                {STATUS_LABELS[po.status] ?? po.status}
              </span>
            </div>
            <p style={{ margin: '0.375rem 0 0', fontSize: '0.95rem', color: '#374151' }}>{po.vendor?.name ?? 'No vendor assigned'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{formatCurrency(po.totalAmount, po.currency)}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{po.currency}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
          {[
            { label: 'Payment Terms', value: po.paymentTerms ?? '—' },
            { label: 'Created', value: new Date(po.createdAt).toLocaleDateString() },
            { label: 'Issued', value: po.issuedAt ? new Date(po.issuedAt).toLocaleDateString() : '—' },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
              <div style={{ fontSize: '0.875rem', color: '#374151', marginTop: '0.25rem' }}>{item.value}</div>
            </div>
          ))}
        </div>
        {po.notes && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.375rem' }}>Notes</div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{po.notes}</p>
          </div>
        )}
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
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#374151' }}>{formatCurrency(line.unitPrice, po.currency)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(lineTotal, po.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
                <td colSpan={5} style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Total</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatCurrency(po.totalAmount, po.currency)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {versions.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Version History</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Version', 'Change Reason', 'Date'].map((col) => (
                  <th key={col} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versions.map((v, idx) => (
                <tr key={v.id} style={{ borderBottom: idx < versions.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>V{v.version}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{v.changeReason ?? <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Initial version</span>}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {canIssue && (
          <button onClick={issuePO} disabled={actionLoading !== null}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
            {actionLoading === 'issue' ? 'Issuing…' : 'Issue PO'}
          </button>
        )}
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
          style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>
          Download PDF
        </a>
        {canChangeOrder && (
          <button onClick={() => setChangeDialogOpen(true)} disabled={actionLoading !== null}
            style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
            Change Order
          </button>
        )}
      </div>
      {actionError && <div style={{ marginTop: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.625rem 1rem', color: '#991b1b', fontSize: '0.875rem' }}>{actionError}</div>}

      {changeDialogOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={(e) => { if (e.target === e.currentTarget) setChangeDialogOpen(false); }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '1.75rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Create Change Order</h2>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>Describe the reason for this change order. A new version of the PO will be created.</p>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>Change Reason <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea value={changeReason} onChange={(e) => setChangeReason(e.target.value)} rows={4}
              placeholder="e.g. Updated pricing agreed with vendor"
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical' }} />
            {changeError && <div style={{ marginTop: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#991b1b', fontSize: '0.8rem' }}>{changeError}</div>}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setChangeDialogOpen(false); setChangeReason(''); setChangeError(''); }}
                style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" onClick={submitChangeOrder} disabled={changeSubmitting}
                style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: changeSubmitting ? 'not-allowed' : 'pointer', opacity: changeSubmitting ? 0.7 : 1 }}>
                {changeSubmitting ? 'Submitting…' : 'Submit Change Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
