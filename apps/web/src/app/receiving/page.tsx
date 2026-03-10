import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface GRN {
  id: string;
  number: string;
  status: string;
  receivedDate: string;
  notes: string | null;
  purchaseOrder: { number: string; vendor: { name: string } | null } | null;
  lines: Array<{ quantityReceived: string; quantityRejected: string }>;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  draft: { background: '#f3f4f6', color: '#374151' },
  confirmed: { background: '#d1fae5', color: '#065f46' },
  cancelled: { background: '#fee2e2', color: '#991b1b' },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_COLORS[status] ?? { background: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ ...style, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
      {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

async function getGRNs(): Promise<GRN[]> {
  try {
    const res = await fetch(`${API_URL}/receiving`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ReceivingPage() {
  const grns = await getGRNs();

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Goods Receipts</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Record received goods against purchase orders
          </p>
        </div>
        <Link
          href="/receiving/new"
          style={{
            background: '#111827', color: '#fff', padding: '0.5rem 1.25rem',
            borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
          }}
        >
          + New GRN
        </Link>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {grns.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#6b7280', fontWeight: 500 }}>No goods receipts yet</p>
            <p style={{ fontSize: '0.875rem' }}>Create a GRN when goods arrive against an issued PO.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['GRN Number', 'PO Number', 'Vendor', 'Received Date', 'Lines', 'Status'].map((col) => (
                  <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grns.map((grn, idx) => (
                <tr key={grn.id} style={{ borderBottom: idx < grns.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                    <Link href={`/receiving/${grn.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {grn.number}
                    </Link>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>
                    {grn.purchaseOrder?.number ?? '—'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>
                    {grn.purchaseOrder?.vendor?.name ?? '—'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>
                    {new Date(grn.receivedDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>
                    {grn.lines?.length ?? 0} line{grn.lines?.length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <StatusBadge status={grn.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
