import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

async function getInvoices(): Promise<Invoice[]> {
  try {
    const res = await fetch(`${API_URL}/invoices`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Invoices</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Vendor invoices with 3-way match status
          </p>
        </div>
        <Link
          href="/invoices/new"
          style={{ background: '#111827', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}
        >
          + New Invoice
        </Link>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {invoices.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#6b7280', fontWeight: 500 }}>No invoices yet</p>
            <p style={{ fontSize: '0.875rem' }}>Create an invoice to run 3-way matching against a PO and GRN.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Internal #', 'Vendor Invoice #', 'Vendor', 'PO', 'Invoice Date', 'Total', 'Match', 'Status'].map((col) => (
                  <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, idx) => (
                <tr key={inv.id} style={{ borderBottom: idx < invoices.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                    <Link href={`/invoices/${inv.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {inv.internalNumber}
                    </Link>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{inv.vendor?.name ?? '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{inv.purchaseOrder?.number ?? '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td style={{ padding: '0.875rem 1rem', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(inv.totalAmount, inv.currency)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <Badge label={inv.matchStatus} colors={MATCH_COLORS[inv.matchStatus] ?? MATCH_COLORS.unmatched} />
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <Badge label={inv.status} colors={STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft} />
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
