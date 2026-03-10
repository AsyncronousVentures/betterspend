import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface GRNLine {
  id: string;
  poLineId: string;
  quantityReceived: string;
  quantityRejected: string;
  rejectionReason: string | null;
  storageLocation: string | null;
  poLine: { lineNumber: string; description: string; quantity: string } | null;
}

interface GRN {
  id: string;
  number: string;
  status: string;
  receivedDate: string;
  notes: string | null;
  purchaseOrder: {
    id: string;
    number: string;
    vendor: { name: string } | null;
  } | null;
  lines: GRNLine[];
  createdAt: string;
}

async function getGRN(id: string): Promise<GRN | null> {
  try {
    const res = await fetch(`${API_URL}/receiving/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { background: string; color: string }> = {
    confirmed: { background: '#d1fae5', color: '#065f46' },
    draft: { background: '#f3f4f6', color: '#374151' },
    cancelled: { background: '#fee2e2', color: '#991b1b' },
  };
  const style = colors[status] ?? { background: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ ...style, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
      {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
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

export default async function GRNDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grn = await getGRN(id);

  if (!grn) {
    return (
      <div style={{ padding: '2rem', color: '#6b7280' }}>
        GRN not found. <Link href="/receiving" style={{ color: '#2563eb' }}>Back to list</Link>
      </div>
    );
  }

  const totalReceived = grn.lines.reduce((s, l) => s + parseFloat(l.quantityReceived), 0);
  const totalRejected = grn.lines.reduce((s, l) => s + parseFloat(l.quantityRejected), 0);

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href="/receiving" style={{ color: '#6b7280', textDecoration: 'none' }}>Goods Receipts</Link>
            {' / '}
            {grn.number}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>{grn.number}</h1>
        </div>
        <StatusBadge status={grn.status} />
      </div>

      {/* Meta */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Receipt Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <Field label="GRN Number" value={grn.number} />
          <Field label="Purchase Order" value={grn.purchaseOrder?.number ?? null} />
          <Field label="Vendor" value={grn.purchaseOrder?.vendor?.name ?? null} />
          <Field label="Received Date" value={new Date(grn.receivedDate).toLocaleDateString()} />
          <Field label="Total Received" value={String(totalReceived)} />
          <Field label="Total Rejected" value={totalRejected > 0 ? String(totalRejected) : '0'} />
        </div>
        {grn.notes && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
            <Field label="Notes" value={grn.notes} />
          </div>
        )}
      </div>

      {/* Lines */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#111827' }}>Received Lines</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Line', 'Description', 'PO Qty', 'Received', 'Rejected', 'Rejection Reason'].map((h) => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grn.lines.map((line, idx) => (
              <tr key={line.id} style={{ borderBottom: idx < grn.lines.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{line.poLine?.lineNumber ?? '—'}</td>
                <td style={{ padding: '0.875rem 1rem' }}>{line.poLine?.description ?? '—'}</td>
                <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{line.poLine?.quantity ?? '—'}</td>
                <td style={{ padding: '0.875rem 1rem', color: '#065f46', fontWeight: 600 }}>{line.quantityReceived}</td>
                <td style={{ padding: '0.875rem 1rem', color: parseFloat(line.quantityRejected) > 0 ? '#991b1b' : '#6b7280' }}>
                  {line.quantityRejected}
                </td>
                <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{line.rejectionReason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
