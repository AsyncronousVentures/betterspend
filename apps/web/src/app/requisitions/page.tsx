import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface RequisitionLine {
  id: string;
  unitPrice: string;
  qty: string;
}

interface Requisition {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: string;
  currency: string;
  totalAmount: string | null;
  createdAt: string;
  lines?: RequisitionLine[];
}

interface ApiResponse {
  data: Requisition[];
  total?: number;
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
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  converted: 'Converted',
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_COLORS[status] ?? { background: '#f3f4f6', color: '#374151' };
  return (
    <span
      style={{
        ...style,
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatCurrency(amount: string | number | null, currency = 'USD') {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

async function getRequisitions(): Promise<Requisition[]> {
  try {
    const res = await fetch(`${API_URL}/requisitions`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json: ApiResponse | Requisition[] = await res.json();
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch {
    return [];
  }
}

export default async function RequisitionsPage() {
  const requisitions = await getRequisitions();

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            Requisitions
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Manage purchase requisitions
          </p>
        </div>
        <Link
          href="/requisitions/new"
          style={{
            background: '#111827',
            color: '#fff',
            padding: '0.5rem 1.25rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          + New Requisition
        </Link>
      </div>

      {/* Table card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {requisitions.length === 0 ? (
          <div
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              color: '#9ca3af',
            }}
          >
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#6b7280', fontWeight: 500 }}>
              No requisitions yet
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              Create your first requisition to get started.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Number', 'Title', 'Status', 'Priority', 'Total Amount', 'Created'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requisitions.map((req, idx) => (
                <tr
                  key={req.id}
                  style={{
                    borderBottom: idx < requisitions.length - 1 ? '1px solid #f3f4f6' : undefined,
                  }}
                >
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                    <Link
                      href={`/requisitions/${req.id}`}
                      style={{ color: '#2563eb', textDecoration: 'none' }}
                    >
                      {req.number}
                    </Link>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{req.title}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <StatusBadge status={req.status} />
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280', textTransform: 'capitalize' }}>
                    {req.priority}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(req.totalAmount, req.currency)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>
                    {new Date(req.createdAt).toLocaleDateString()}
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
