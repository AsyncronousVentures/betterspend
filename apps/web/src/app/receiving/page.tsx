'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

interface GRN {
  id: string;
  number: string;
  status: string;
  receivedDate: string;
  purchaseOrder: { number: string; vendor: { name: string } | null } | null;
  lines: Array<{ quantityReceived: string }>;
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  draft: { background: COLORS.contentBg, color: COLORS.textSecondary },
  confirmed: { background: COLORS.accentGreenLight, color: COLORS.accentGreenDark },
  cancelled: { background: COLORS.accentRedLight, color: COLORS.accentRedDark },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_COLORS[status] ?? { background: COLORS.contentBg, color: COLORS.textSecondary };
  return (
    <span style={{ ...style, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
      {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

export default function ReceivingPage() {
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.receiving.list()
      .then((data) => setGrns(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: COLORS.textPrimary }}>Goods Receipts</h1>
          <p style={{ margin: '0.25rem 0 0', color: COLORS.textSecondary, fontSize: '0.875rem' }}>Record received goods against purchase orders</p>
        </div>
        <Link href="/receiving/new" style={{ background: COLORS.textPrimary, color: COLORS.white, padding: '0.5rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
          + New GRN
        </Link>
      </div>

      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.tableBorder}`, borderRadius: '8px', overflow: 'hidden', boxShadow: SHADOWS.card }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: COLORS.textMuted, fontSize: '0.875rem' }}>Loading…</div>
        ) : grns.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: COLORS.textMuted }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: COLORS.textSecondary, fontWeight: 500 }}>No goods receipts yet</p>
            <p style={{ fontSize: '0.875rem' }}>Create a GRN when goods arrive against an issued PO.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.tableBorder}`, background: COLORS.tableHeaderBg }}>
                  {['GRN Number', 'PO Number', 'Vendor', 'Received Date', 'Lines', 'Status'].map((col) => (
                    <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: COLORS.textSecondary, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grns.map((grn, idx) => (
                  <tr key={grn.id} style={{ borderBottom: idx < grns.length - 1 ? `1px solid ${COLORS.contentBg}` : undefined }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                      <Link href={`/receiving/${grn.id}`} style={{ color: COLORS.accentBlueDark, textDecoration: 'none' }}>{grn.number}</Link>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>{grn.purchaseOrder?.number ?? '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>{grn.purchaseOrder?.vendor?.name ?? '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>{new Date(grn.receivedDate).toLocaleDateString()}</td>
                    <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>{grn.lines?.length ?? 0} line{grn.lines?.length !== 1 ? 's' : ''}</td>
                    <td style={{ padding: '0.875rem 1rem' }}><StatusBadge status={grn.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
