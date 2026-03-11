'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function NewVendorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', code: '', taxId: '', paymentTerms: 'Net 30', status: 'active',
    contactName: '', email: '', phone: '',
    street: '', city: '', state: '', postalCode: '', country: '',
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const vendor = await api.vendors.create({
        name: form.name,
        code: form.code || undefined,
        taxId: form.taxId || undefined,
        paymentTerms: form.paymentTerms || undefined,
        status: form.status,
        contactInfo: {
          contactName: form.contactName || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
        },
        address: {
          street: form.street || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          postalCode: form.postalCode || undefined,
          country: form.country || undefined,
        },
      });
      router.push(`/vendors/${vendor.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/vendors" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}>← Vendors</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginTop: '0.5rem' }}>New Vendor</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Basic Info</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Name *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Code</label>
              <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="ACME" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Tax ID</label>
              <input value={form.taxId} onChange={(e) => set('taxId', e.target.value)} placeholder="12-3456789" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Payment Terms</label>
              <select value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} style={inputStyle}>
                {['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', '2/10 Net 30'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} style={inputStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Contact</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Address</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Street</label>
              <input value={form.street} onChange={(e) => set('street', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input value={form.city} onChange={(e) => set('city', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>State / Province</label>
              <input value={form.state} onChange={(e) => set('state', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Postal Code</label>
              <input value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <input value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="US" style={inputStyle} />
            </div>
          </div>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" disabled={saving} style={{ padding: '0.625rem 1.25rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            {saving ? 'Creating...' : 'Create Vendor'}
          </button>
          <Link href="/vendors" style={{ padding: '0.625rem 1.25rem', background: '#e5e7eb', color: '#374151', borderRadius: '6px', textDecoration: 'none', fontWeight: 500 }}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
