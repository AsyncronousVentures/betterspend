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

interface BlanketRelease {
  id: string;
  releaseNumber: number;
  amount: string;
  description: string | null;
  status: string;
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
  poType: string;
  blanketStartDate: string | null;
  blanketEndDate: string | null;
  blanketTotalLimit: string | null;
  blanketReleasedAmount: string | null;
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
  partially_received: { background: '#fef9c3', color: '#92400e' },
};

const RELEASE_STATUS_COLORS: Record<string, { background: string; color: string }> = {
  approved: { background: '#d1fae5', color: '#065f46' },
  cancelled: { background: '#fee2e2', color: '#991b1b' },
  draft: { background: '#f3f4f6', color: '#374151' },
};

function formatCurrency(amount: string | number | null, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

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
  const [releases, setReleases] = useState<BlanketRelease[]>([]);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [releaseAmount, setReleaseAmount] = useState('');
  const [releaseDesc, setReleaseDesc] = useState('');
  const [releaseError, setReleaseError] = useState('');
  const [releaseSubmitting, setReleaseSubmitting] = useState(false);

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid);
      api.purchaseOrders.get(pid)
        .then((data) => {
          setPo(data);
          if (data.poType === 'blanket') {
            api.purchaseOrders.releases(pid).then(setReleases).catch(() => {});
          }
        })
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

  async function submitRelease() {
    if (!releaseAmount || parseFloat(releaseAmount) <= 0) { setReleaseError('Enter a valid amount.'); return; }
    setReleaseError('');
    setReleaseSubmitting(true);
    try {
      await api.purchaseOrders.createRelease(id, { amount: parseFloat(releaseAmount), description: releaseDesc || undefined });
      setReleaseDialogOpen(false);
      setReleaseAmount('');
      setReleaseDesc('');
      const [updated, updatedReleases] = await Promise.all([
        api.purchaseOrders.get(id),
        api.purchaseOrders.releases(id),
      ]);
      setPo(updated);
      setReleases(updatedReleases);
    } catch (err) {
      setReleaseError(err instanceof Error ? err.message : 'Release creation failed');
    } finally {
      setReleaseSubmitting(false);
    }
  }

  async function cancelRelease(releaseId: string) {
    if (!confirm('Cancel this release?')) return;
    try {
      await api.purchaseOrders.cancelRelease(id, releaseId);
      const [updated, updatedReleases] = await Promise.all([
        api.purchaseOrders.get(id),
        api.purchaseOrders.releases(id),
      ]);
      setPo(updated);
      setReleases(updatedReleases);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Cancel release failed');
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
  const canIssue = po.status === 'draft' || po.status === 'approved';
  const canChangeOrder = po.status !== 'closed' && po.status !== 'cancelled';
  const canCancel = po.status !== 'closed' && po.status !== 'cancelled' && po.status !== 'received';
  const isBlanket = po.poType === 'blanket';
  const canCreateRelease = isBlanket && ['issued', 'approved', 'partially_received'].includes(po.status);

  const blanketLimit = po.blanketTotalLimit ? parseFloat(po.blanketTotalLimit) : null;
  const blanketReleased = parseFloat(po.blanketReleasedAmount ?? '0');
  const blanketRemaining = blanketLimit !== null ? blanketLimit - blanketReleased : null;
  const blanketPct = blanketLimit && blanketLimit > 0 ? (blanketReleased / blanketLimit) * 100 : 0;

  async function cancelPO() {
    if (!confirm('Cancel this purchase order?')) return;
    setActionError('');
    setActionLoading('cancel');
    try {
      await api.purchaseOrders.cancel(id);
      const updated = await api.purchaseOrders.get(id);
      setPo(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function downloadPDF() {
    try {
      const res = await api.purchaseOrders.pdf(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${po?.number ?? 'purchase-order'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'PDF download failed');
    }
  }

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
                {po.status.replace('_', ' ')}
              </span>
              {isBlanket && (
                <span style={{ background: '#fef9c3', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
                  Blanket PO
                </span>
              )}
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

      {/* Blanket PO Summary */}
      {isBlanket && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#92400e' }}>Blanket PO Summary</h2>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: blanketLimit ? '1rem' : '0' }}>
            {po.blanketStartDate && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, textTransform: 'uppercase' }}>Start Date</div>
                <div style={{ fontSize: '0.875rem', color: '#78350f', marginTop: '0.25rem' }}>{new Date(po.blanketStartDate).toLocaleDateString()}</div>
              </div>
            )}
            {po.blanketEndDate && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, textTransform: 'uppercase' }}>End Date</div>
                <div style={{ fontSize: '0.875rem', color: '#78350f', marginTop: '0.25rem' }}>{new Date(po.blanketEndDate).toLocaleDateString()}</div>
              </div>
            )}
            {blanketLimit !== null && (
              <>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, textTransform: 'uppercase' }}>Total Limit</div>
                  <div style={{ fontSize: '0.875rem', color: '#78350f', marginTop: '0.25rem' }}>{formatCurrency(blanketLimit, po.currency)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, textTransform: 'uppercase' }}>Released</div>
                  <div style={{ fontSize: '0.875rem', color: '#78350f', marginTop: '0.25rem' }}>{formatCurrency(blanketReleased, po.currency)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, textTransform: 'uppercase' }}>Remaining</div>
                  <div style={{ fontSize: '0.875rem', color: blanketRemaining! < 0 ? '#dc2626' : '#78350f', marginTop: '0.25rem', fontWeight: 600 }}>
                    {formatCurrency(blanketRemaining, po.currency)}
                  </div>
                </div>
              </>
            )}
          </div>
          {blanketLimit !== null && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ height: '8px', background: '#fde68a', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, blanketPct)}%`,
                  background: blanketPct >= 100 ? '#dc2626' : blanketPct >= 80 ? '#f59e0b' : '#059669',
                  borderRadius: '4px',
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.25rem' }}>{blanketPct.toFixed(1)}% utilized</div>
            </div>
          )}
        </div>
      )}

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

      {/* Blanket Releases */}
      {isBlanket && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Releases ({releases.length})</h2>
            {canCreateRelease && (
              <button onClick={() => setReleaseDialogOpen(true)}
                style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.875rem', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
                + New Release
              </button>
            )}
          </div>
          {releases.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>No releases yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Release #', 'Amount', 'Description', 'Status', 'Date', ''].map((col) => (
                    <th key={col} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {releases.map((r, idx) => {
                  const rStatusStyle = RELEASE_STATUS_COLORS[r.status] ?? { background: '#f3f4f6', color: '#374151' };
                  return (
                    <tr key={r.id} style={{ borderBottom: idx < releases.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>#{r.releaseNumber}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#111827' }}>{formatCurrency(r.amount, po.currency)}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{r.description ?? '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ ...rStatusStyle, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {r.status !== 'cancelled' && (
                          <button onClick={() => cancelRelease(r.id)}
                            style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

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
        <button onClick={downloadPDF}
          style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
          Download PDF
        </button>
        {canChangeOrder && (
          <button onClick={() => setChangeDialogOpen(true)} disabled={actionLoading !== null}
            style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
            Change Order
          </button>
        )}
        {canCancel && (
          <button onClick={cancelPO} disabled={actionLoading !== null}
            style={{ background: '#fff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '6px', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
            {actionLoading === 'cancel' ? 'Cancelling…' : 'Cancel PO'}
          </button>
        )}
      </div>
      {actionError && <div style={{ marginTop: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.625rem 1rem', color: '#991b1b', fontSize: '0.875rem' }}>{actionError}</div>}

      {/* Change Order Dialog */}
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

      {/* New Release Dialog */}
      {releaseDialogOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={(e) => { if (e.target === e.currentTarget) setReleaseDialogOpen(false); }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '1.75rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>New Blanket Release</h2>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Release funds against this blanket PO.
              {blanketRemaining !== null && ` Remaining: ${formatCurrency(blanketRemaining, po.currency)}`}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>Amount ({po.currency}) *</label>
                <input type="number" min="0.01" step="0.01" value={releaseAmount} onChange={(e) => setReleaseAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>Description</label>
                <input value={releaseDesc} onChange={(e) => setReleaseDesc(e.target.value)}
                  placeholder="e.g. Q1 office supplies"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            {releaseError && <div style={{ marginTop: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#991b1b', fontSize: '0.8rem' }}>{releaseError}</div>}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setReleaseDialogOpen(false); setReleaseAmount(''); setReleaseDesc(''); setReleaseError(''); }}
                style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" onClick={submitRelease} disabled={releaseSubmitting}
                style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: releaseSubmitting ? 'not-allowed' : 'pointer', opacity: releaseSubmitting ? 0.7 : 1 }}>
                {releaseSubmitting ? 'Creating…' : 'Create Release'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
