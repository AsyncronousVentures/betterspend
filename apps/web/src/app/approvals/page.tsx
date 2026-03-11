'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

interface ApprovalRequest {
  id: string;
  approvableType: string;
  approvableId: string;
  currentStep: number;
  status: string;
  createdAt: string;
  rule?: { name: string };
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending:   { background: '#fef3c7', color: '#92400e' },
  approved:  { background: '#d1fae5', color: '#065f46' },
  rejected:  { background: '#fee2e2', color: '#991b1b' },
  cancelled: { background: '#f3f4f6', color: '#6b7280' },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_COLORS[status] ?? { background: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ ...style, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', whiteSpace: 'nowrap' }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.approvals.list()
      .then((data) => setApprovals(Array.isArray(data) ? data : (data as any).data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Approvals Queue</h1>
        <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Review and act on pending approval requests</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</div>
        ) : approvals.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#6b7280', fontWeight: 500 }}>No pending approvals</p>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>All caught up! There are no items awaiting your review.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Entity', 'Amount', 'Rule Name', 'Current Step', 'Status', 'Created', 'Actions'].map((col) => (
                  <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval, idx) => {
                const entity = (approval as any).entitySummary;
                const entityHref = approval.approvableType === 'requisition'
                  ? `/requisitions/${approval.approvableId}`
                  : `/purchase-orders/${approval.approvableId}`;
                return (
                  <tr key={approval.id} style={{ borderBottom: idx < approvals.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#111827', textTransform: 'capitalize', fontSize: '0.8rem' }}>
                        {approval.approvableType.replace(/_/g, ' ')}
                      </div>
                      {entity ? (
                        <Link href={entityHref} style={{ color: '#2563eb', fontSize: '0.8rem', textDecoration: 'none' }}>
                          {entity.number}{entity.title ? ` — ${entity.title}` : entity.vendorName ? ` — ${entity.vendorName}` : ''}
                        </Link>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: '0.75rem', fontFamily: 'monospace' }}>…{approval.approvableId.slice(-8)}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151', fontWeight: 500 }}>
                      {entity?.amount != null
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(entity.amount)
                        : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{approval.rule?.name ?? '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>Step {approval.currentStep}</td>
                    <td style={{ padding: '0.875rem 1rem' }}><StatusBadge status={approval.status} /></td>
                    <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{new Date(approval.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <Link href={`/approvals/${approval.id}`} style={{ background: '#111827', color: '#fff', padding: '0.375rem 0.875rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, display: 'inline-block' }}>
                        Review
                      </Link>
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
