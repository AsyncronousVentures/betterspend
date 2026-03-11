const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

interface Vendor {
  id: string;
  name: string;
  code: string;
  status: string;
  paymentTerms: string | null;
  taxId: string | null;
  contactInfo: { email?: string; phone?: string } | null;
  punchoutEnabled: boolean;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  active: { background: '#d1fae5', color: '#065f46' },
  inactive: { background: '#f3f4f6', color: '#6b7280' },
  suspended: { background: '#fee2e2', color: '#991b1b' },
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
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

async function getVendors(): Promise<Vendor[]> {
  try {
    const res = await fetch(`${API_URL}/vendors`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    return Array.isArray(json) ? (json as Vendor[]) : [];
  } catch {
    return [];
  }
}

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            Vendors
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Supplier master records
          </p>
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {vendors.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#6b7280', fontWeight: 500 }}>
              No vendors yet
            </p>
            <p style={{ fontSize: '0.875rem' }}>Vendors are created via the API or seeded from demo data.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Name', 'Code', 'Status', 'Contact', 'Payment Terms', 'Tax ID'].map((col) => (
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
              {vendors.map((vendor, idx) => (
                <tr
                  key={vendor.id}
                  style={{
                    borderBottom: idx < vendors.length - 1 ? '1px solid #f3f4f6' : undefined,
                  }}
                >
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#111827' }}>
                    {vendor.name}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {vendor.code}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <StatusBadge status={vendor.status} />
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>
                    {vendor.contactInfo?.email ?? '—'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>
                    {vendor.paymentTerms ?? '—'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {vendor.taxId ?? '—'}
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
