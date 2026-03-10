import Link from 'next/link';
import { notFound } from 'next/navigation';
import POActions from './actions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

interface Vendor {
  id: string;
  name: string;
}

interface POLine {
  id: string;
  description: string;
  qty: string | number;
  uom: string;
  unitPrice: string | number;
  totalPrice: string | number | null;
}

interface POVersion {
  id: string;
  version: number;
  changeReason: string | null;
  createdAt: string;
  snapshotData?: unknown;
}

interface PurchaseOrder {
  id: string;
  number: string;
  vendor: Vendor | null;
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
  draft: 'Draft',
  approved: 'Approved',
  issued: 'Issued',
  received: 'Received',
  invoiced: 'Invoiced',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_COLORS[status] ?? { background: '#f3f4f6', color: '#374151' };
  return (
    <span
      style={{
        ...style,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        display: 'inline-block',
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

async function getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
  try {
    const res = await fetch(`${API_URL}/purchase-orders/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const po = await getPurchaseOrder(id);

  if (!po) notFound();

  const lines: POLine[] = po.lines ?? [];
  const versions: POVersion[] = po.versions ?? [];
  const pdfUrl = `${API_BASE}/api/v1/purchase-orders/${po.id}/pdf`;

  return (
    <div style={{ padding: '2rem', maxWidth: '960px' }}>
      {/* Back link */}
      <Link
        href="/purchase-orders"
        style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}
      >
        &larr; Back to Purchase Orders
      </Link>

      {/* Header card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1.5rem',
          marginTop: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>
                {po.number}
              </h1>
              <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>V{po.version ?? 1}</span>
              <StatusBadge status={po.status} />
            </div>
            <p style={{ margin: '0.375rem 0 0', fontSize: '0.95rem', color: '#374151' }}>
              {po.vendor?.name ?? 'No vendor assigned'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCurrency(po.totalAmount, po.currency)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{po.currency}</div>
          </div>
        </div>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f3f4f6',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Payment Terms', value: po.paymentTerms ?? '—' },
            { label: 'Created', value: new Date(po.createdAt).toLocaleDateString() },
            { label: 'Issued', value: po.issuedAt ? new Date(po.issuedAt).toLocaleDateString() : '—' },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#374151', marginTop: '0.25rem' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {po.notes && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.375rem' }}>
              Notes
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{po.notes}</p>
          </div>
        )}
      </div>

      {/* Line items */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>
            Line Items
          </h2>
        </div>
        {lines.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
            No line items
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['#', 'Description', 'Qty', 'UOM', 'Unit Price', 'Total'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '0.625rem 1rem',
                      textAlign: col === 'Qty' || col === 'Unit Price' || col === 'Total' ? 'right' : 'left',
                      fontWeight: 600,
                      color: '#6b7280',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const lineTotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
                return (
                  <tr
                    key={line.id}
                    style={{ borderBottom: idx < lines.length - 1 ? '1px solid #f3f4f6' : undefined }}
                  >
                    <td style={{ padding: '0.75rem 1rem', color: '#9ca3af', width: '2rem' }}>{idx + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{line.description}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#374151' }}>
                      {Number(line.qty)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{line.uom}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(line.unitPrice, po.currency)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(lineTotal, po.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
                <td colSpan={5} style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Total
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(po.totalAmount, po.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Version history */}
      {versions.length > 0 && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>
              Version History
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Version', 'Change Reason', 'Date'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '0.625rem 1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#6b7280',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versions.map((v, idx) => (
                <tr
                  key={v.id}
                  style={{ borderBottom: idx < versions.length - 1 ? '1px solid #f3f4f6' : undefined }}
                >
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>
                    V{v.version}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>
                    {v.changeReason ?? <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Initial version</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>
                    {new Date(v.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action buttons (client island) */}
      <POActions id={po.id} status={po.status} pdfUrl={pdfUrl} />
    </div>
  );
}
