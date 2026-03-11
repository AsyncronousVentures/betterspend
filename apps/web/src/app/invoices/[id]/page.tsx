'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

interface MatchResult {
  id: string;
  priceMatch: boolean;
  quantityMatch: boolean;
  variancePct: string;
  status: string;
}

interface InvoiceLine {
  id: string;
  lineNumber: string;
  description: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  glAccount: string | null;
  poLine: { lineNumber: string; description: string; unitPrice: string; quantity: string } | null;
  matchResults: MatchResult[];
}

interface Invoice {
  id: string;
  internalNumber: string;
  invoiceNumber: string;
  status: string;
  matchStatus: string;
  invoiceDate: string;
  dueDate: string | null;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  vendor: { name: string } | null;
  purchaseOrder: { id: string; number: string } | null;
  lines: InvoiceLine[];
  approvedAt: string | null;
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending_match: { background: '#fef3c7', color: '#92400e' },
  matched: { background: '#d1fae5', color: '#065f46' },
  partial_match: { background: '#dbeafe', color: '#1e40af' },
  exception: { background: '#fee2e2', color: '#991b1b' },
  approved: { background: '#ede9fe', color: '#5b21b6' },
};

const MATCH_COLORS: Record<string, { background: string; color: string }> = {
  unmatched: { background: '#f3f4f6', color: '#374151' },
  full_match: { background: '#d1fae5', color: '#065f46' },
  partial_match: { background: '#dbeafe', color: '#1e40af' },
  exception: { background: '#fee2e2', color: '#991b1b' },
  match: { background: '#d1fae5', color: '#065f46' },
  within_tolerance: { background: '#dbeafe', color: '#1e40af' },
};

function Badge({ label, colors }: { label: string; colors: { background: string; color: string } }) {
  return (
    <span style={{ ...colors, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
      {label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: '#111827' }}>{value ?? '—'}</div>
    </div>
  );
}

function formatCurrency(amount: string | number | null, currency = 'USD') {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [glSystem, setGlSystem] = useState<'qbo' | 'xero'>('qbo');

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid);
      api.invoices.get(pid)
        .then((data) => setInvoice(data))
        .catch(() => setInvoice(null))
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function doApprove() {
    setError('');
    setActionLoading('approve');
    try {
      await api.invoices.approve(id);
      const updated = await api.invoices.get(id);
      setInvoice(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function doGlExport() {
    setError('');
    setActionLoading('gl');
    try {
      await api.glExportJobs.trigger(id, glSystem);
      setError('');
      alert(`GL export job queued for ${glSystem === 'qbo' ? 'QuickBooks Online' : 'Xero'}. Check GL Integration → Export Jobs for status.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GL export failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function doRerunMatch() {
    setError('');
    setActionLoading('match');
    try {
      await api.invoices.rerunMatch(id);
      const updated = await api.invoices.get(id);
      setInvoice(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Match failed');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div style={{ padding: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</div>;
  if (!invoice) return (
    <div style={{ padding: '2rem', color: '#6b7280' }}>
      Invoice not found. <Link href="/invoices" style={{ color: '#2563eb' }}>Back to list</Link>
    </div>
  );

  const hasExceptions = invoice.matchStatus === 'exception';

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href="/invoices" style={{ color: '#6b7280', textDecoration: 'none' }}>Invoices</Link> / {invoice.internalNumber}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>{invoice.internalNumber}</h1>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Vendor invoice: {invoice.invoiceNumber}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Badge label={invoice.status} colors={STATUS_COLORS[invoice.status] ?? { background: '#f3f4f6', color: '#374151' }} />
          <Badge label={`Match: ${invoice.matchStatus}`} colors={MATCH_COLORS[invoice.matchStatus] ?? MATCH_COLORS.unmatched} />
        </div>
      </div>

      {hasExceptions && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, color: '#991b1b', fontSize: '0.875rem' }}>3-Way Match Exceptions Detected</div>
            <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '0.25rem' }}>One or more lines have price or quantity variances outside tolerance. Finance review required before approval.</div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Invoice Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          <Field label="Vendor" value={invoice.vendor?.name ?? null} />
          <Field label="Linked PO" value={invoice.purchaseOrder?.number ?? null} />
          <Field label="Invoice Date" value={new Date(invoice.invoiceDate).toLocaleDateString()} />
          <Field label="Due Date" value={invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : null} />
          <Field label="Subtotal" value={formatCurrency(invoice.subtotal, invoice.currency)} />
          <Field label="Total" value={formatCurrency(invoice.totalAmount, invoice.currency)} />
          {invoice.approvedAt && <Field label="Approved At" value={new Date(invoice.approvedAt).toLocaleString()} />}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#111827' }}>Line Items & 3-Way Match</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['#', 'Description', 'Qty', 'Unit Price', 'Total', 'Price ✓', 'Qty ✓', 'Variance %', 'Match Status'].map((h) => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, idx) => {
              const match = line.matchResults?.[0];
              const rowBg = match?.status === 'exception' ? '#fff7f7' : match?.status === 'match' ? '#f7fef9' : 'transparent';
              return (
                <tr key={line.id} style={{ borderBottom: idx < invoice.lines.length - 1 ? '1px solid #f3f4f6' : undefined, background: rowBg }}>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{line.lineNumber}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div>{line.description}</div>
                    {line.poLine && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>PO: {line.poLine.description} @ ${line.poLine.unitPrice}</div>}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>{line.quantity}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>{formatCurrency(line.unitPrice, invoice.currency)}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 500 }}>{formatCurrency(line.totalPrice, invoice.currency)}</td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>{match ? (match.priceMatch ? <span style={{ color: '#065f46', fontWeight: 700 }}>✓</span> : <span style={{ color: '#991b1b', fontWeight: 700 }}>✗</span>) : '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>{match ? (match.quantityMatch ? <span style={{ color: '#065f46', fontWeight: 700 }}>✓</span> : <span style={{ color: '#991b1b', fontWeight: 700 }}>✗</span>) : '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{match ? `${parseFloat(match.variancePct).toFixed(1)}%` : '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>{match ? <Badge label={match.status} colors={MATCH_COLORS[match.status] ?? MATCH_COLORS.unmatched} /> : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {invoice.status !== 'approved' && (
          <>
            <button onClick={doApprove} disabled={hasExceptions || actionLoading !== null}
              style={{ background: hasExceptions ? '#d1d5db' : '#111827', color: '#fff', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500, cursor: hasExceptions || actionLoading ? 'not-allowed' : 'pointer', opacity: hasExceptions ? 0.5 : 1 }}>
              {actionLoading === 'approve' ? 'Approving…' : 'Approve for Payment'}
            </button>
            <button onClick={doRerunMatch} disabled={actionLoading !== null}
              style={{ padding: '0.625rem 1.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', color: '#374151', background: '#fff', cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
              {actionLoading === 'match' ? 'Running…' : 'Re-run Match'}
            </button>
          </>
        )}
        {invoice.status === 'approved' && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.375rem 0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>Export to GL:</span>
            <select
              value={glSystem}
              onChange={(e) => setGlSystem(e.target.value as 'qbo' | 'xero')}
              style={{ padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.8rem' }}
            >
              <option value="qbo">QuickBooks Online</option>
              <option value="xero">Xero</option>
            </select>
            <button
              onClick={doGlExport}
              disabled={actionLoading !== null}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.375rem 0.875rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500, cursor: actionLoading ? 'not-allowed' : 'pointer' }}
            >
              {actionLoading === 'gl' ? 'Exporting…' : 'Export'}
            </button>
          </div>
        )}
      </div>
      {error && <div style={{ marginTop: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.625rem 1rem', color: '#991b1b', fontSize: '0.875rem' }}>{error}</div>}
    </div>
  );
}
