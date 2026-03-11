'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

interface Invoice {
  id: string;
  internalNumber: string;
  invoiceNumber: string;
  status: string;
  matchStatus: string;
  totalAmount: string;
  currency: string;
  invoiceDate: string;
  dueDate: string | null;
  vendor: { name: string } | null;
  purchaseOrder: { number: string } | null;
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  draft: { background: '#f3f4f6', color: '#374151' },
  pending_match: { background: '#fef3c7', color: '#92400e' },
  matched: { background: '#d1fae5', color: '#065f46' },
  partial_match: { background: '#dbeafe', color: '#1e40af' },
  exception: { background: '#fee2e2', color: '#991b1b' },
  approved: { background: '#ede9fe', color: '#5b21b6' },
  paid: { background: '#f3f4f6', color: '#374151' },
};

const MATCH_COLORS: Record<string, { background: string; color: string }> = {
  unmatched: { background: '#f3f4f6', color: '#374151' },
  full_match: { background: '#d1fae5', color: '#065f46' },
  partial_match: { background: '#dbeafe', color: '#1e40af' },
  exception: { background: '#fee2e2', color: '#991b1b' },
};

function Badge({ label, colors }: { label: string; colors: { background: string; color: string } }) {
  return (
    <span style={{ ...colors, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
      {label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function formatCurrency(amount: string | number | null, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.invoices.list()
      .then((data) => setInvoices(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter ? invoices.filter((i) => i.status === statusFilter) : invoices;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Invoices</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Vendor invoices with 3-way match status</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', color: '#374151' }}
          >
            <option value="">All Statuses</option>
            <option value="pending_match">Pending Match</option>
            <option value="matched">Matched</option>
            <option value="partial_match">Partial Match</option>
            <option value="exception">Exception</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
          <Link href="/invoices/new" style={{ background: '#111827', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
            + New Invoice
          </Link>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#6b7280', fontWeight: 500 }}>
              {statusFilter ? `No ${statusFilter.replace(/_/g, ' ')} invoices` : 'No invoices yet'}
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              {statusFilter ? 'Try a different filter.' : 'Create an invoice to run 3-way matching against a PO and GRN.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Internal #', 'Vendor Invoice #', 'Vendor', 'PO', 'Invoice Date', 'Due Date', 'Total', 'Match', 'Status'].map((col) => (
                  <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, idx) => {
                const isOverdue = inv.dueDate && !['approved', 'paid', 'cancelled'].includes(inv.status) && new Date(inv.dueDate) < new Date();
                return (
                <tr key={inv.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : undefined, background: isOverdue ? '#fff7f7' : undefined }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                    <Link href={`/invoices/${inv.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{inv.internalNumber}</Link>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{inv.vendor?.name ?? '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{inv.purchaseOrder?.number ?? '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td style={{ padding: '0.875rem 1rem', color: isOverdue ? '#991b1b' : '#6b7280', fontWeight: isOverdue ? 600 : 400 }}>
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                    {isOverdue && <span style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>OVERDUE</span>}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(inv.totalAmount, inv.currency)}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <Badge label={inv.matchStatus} colors={MATCH_COLORS[inv.matchStatus] ?? MATCH_COLORS.unmatched} />
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <Badge label={inv.status} colors={STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft} />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
