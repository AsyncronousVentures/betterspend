'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  active: { background: '#d1fae5', color: '#065f46' },
  inactive: { background: '#f3f4f6', color: '#6b7280' },
  blocked: { background: '#fee2e2', color: '#991b1b' },
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Vendors</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Supplier master records</p>
        </div>
        <Link href="/vendors/new" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
          + New Vendor
        </Link>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors..."
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', width: '280px' }}
        />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontWeight: 500, color: '#6b7280', marginBottom: '0.5rem' }}>No vendors found</p>
            <Link href="/vendors/new" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}>Create your first vendor →</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Name', 'Code', 'Status', 'Contact', 'Payment Terms', 'Tax ID'].map((col) => (
                  <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((vendor, idx) => {
                const sc = STATUS_COLORS[vendor.status] ?? { background: '#f3f4f6', color: '#374151' };
                return (
                  <tr
                    key={vendor.id}
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : undefined, cursor: 'pointer' }}
                    onClick={() => window.location.href = `/vendors/${vendor.id}`}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#111827' }}>{vendor.name}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.8rem' }}>{vendor.code || '—'}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ ...sc, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', textTransform: 'capitalize' }}>
                        {vendor.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{vendor.contactInfo?.email ?? '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{vendor.paymentTerms ?? '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.8rem' }}>{vendor.taxId ?? '—'}</td>
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
