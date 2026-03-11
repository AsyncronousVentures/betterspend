'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

interface PurchaseOrder {
  id: string;
  number: string;
  vendor: { name: string } | null;
  version: number;
  status: string;
  currency: string;
  totalAmount: string | null;
  issuedAt: string | null;
  createdAt: string;
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

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_COLORS[status] ?? { background: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ ...style, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', whiteSpace: 'nowrap' }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatCurrency(amount: string | number | null, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.purchaseOrders.list()
      .then((data) => setOrders(Array.isArray(data) ? data : (data as any).data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Purchase Orders</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Track the full PO lifecycle</p>
        </div>
        <Link href="/purchase-orders/new" style={{ background: '#111827', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
          + New PO
        </Link>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#6b7280', fontWeight: 500 }}>No purchase orders yet</p>
            <p style={{ fontSize: '0.875rem' }}>Create your first PO to get started.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Number', 'Vendor', 'Version', 'Status', 'Total', 'Issued Date'].map((col) => (
                  <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((po, idx) => (
                <tr key={po.id} style={{ borderBottom: idx < orders.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                    <Link href={`/purchase-orders/${po.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{po.number}</Link>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{po.vendor?.name ?? '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>V{po.version ?? 1}</td>
                  <td style={{ padding: '0.875rem 1rem' }}><StatusBadge status={po.status} /></td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(po.totalAmount, po.currency)}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{po.issuedAt ? new Date(po.issuedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
