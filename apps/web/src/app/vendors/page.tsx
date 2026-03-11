'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  active: { background: '#d1fae5', color: COLORS.accentGreenDark },
  inactive: { background: COLORS.contentBg, color: COLORS.textSecondary },
  blocked: { background: COLORS.accentRedLight, color: COLORS.accentRedDark },
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.vendors.list().then(setVendors).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter((v) =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) || (v.code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: COLORS.textPrimary }}>Vendors</h1>
          <p style={{ margin: '0.25rem 0 0', color: COLORS.textSecondary, fontSize: '0.875rem' }}>Supplier master records</p>
        </div>
        <Link href="/vendors/new" style={{ padding: '0.5rem 1rem', background: COLORS.accentBlue, color: COLORS.white, borderRadius: '6px', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
          + New Vendor
        </Link>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors..."
          style={{ padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px', fontSize: '0.875rem', width: '280px' }}
        />
      </div>

      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.tableBorder}`, borderRadius: '8px', overflow: 'hidden', boxShadow: SHADOWS.card }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: COLORS.textMuted }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: COLORS.textMuted }}>
            <p style={{ fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.5rem' }}>No vendors found</p>
            <Link href="/vendors/new" style={{ color: COLORS.accentBlue, textDecoration: 'none', fontSize: '0.875rem' }}>Create your first vendor →</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.tableBorder}`, background: COLORS.tableHeaderBg }}>
                  {['Name', 'Code', 'Status', 'Contact', 'Payment Terms', 'Tax ID'].map((col) => (
                    <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: COLORS.textSecondary, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((vendor, idx) => {
                  const sc = STATUS_COLORS[vendor.status] ?? { background: COLORS.contentBg, color: COLORS.textSecondary };
                  return (
                    <tr
                      key={vendor.id}
                      style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${COLORS.contentBg}` : undefined, cursor: 'pointer' }}
                      onClick={() => window.location.href = `/vendors/${vendor.id}`}
                      onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.hoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: COLORS.textPrimary }}>{vendor.name}</td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary, fontFamily: 'monospace', fontSize: '0.8rem' }}>{vendor.code || '—'}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ ...sc, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', textTransform: 'capitalize' }}>
                          {vendor.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>{vendor.contactInfo?.email ?? '—'}</td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>{vendor.paymentTerms ?? '—'}</td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary, fontFamily: 'monospace', fontSize: '0.8rem' }}>{vendor.taxId ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
