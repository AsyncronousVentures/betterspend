'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    api.vendors.get(id).then((v) => {
      setVendor(v);
      setForm({
        name: v.name || '', code: v.code || '', taxId: v.taxId || '',
        paymentTerms: v.paymentTerms || '', status: v.status || 'active',
        contactName: v.contactInfo?.contactName || '',
        email: v.contactInfo?.email || '',
        phone: v.contactInfo?.phone || '',
        street: v.address?.street || '', city: v.address?.city || '',
        state: v.address?.state || '', postalCode: v.address?.postalCode || '',
        country: v.address?.country || '',
      });
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await api.vendors.update(id, {
        name: form.name, code: form.code || undefined, taxId: form.taxId || undefined,
        paymentTerms: form.paymentTerms || undefined, status: form.status,
        contactInfo: { contactName: form.contactName || undefined, email: form.email || undefined, phone: form.phone || undefined },
        address: { street: form.street || undefined, city: form.city || undefined, state: form.state || undefined, postalCode: form.postalCode || undefined, country: form.country || undefined },
      });
      setVendor(updated);
      setEditing(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function set(key: string, value: string) {
    setForm((f: any) => ({ ...f, [key]: value }));
  }

  const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' };

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    active: { bg: '#dcfce7', text: '#15803d' },
    inactive: { bg: '#f3f4f6', text: '#6b7280' },
    blocked: { bg: '#fee2e2', text: '#dc2626' },
  };

  if (loading) return <div style={{ padding: '2rem', color: '#6b7280' }}>Loading...</div>;
  if (error && !vendor) return <div style={{ padding: '2rem', color: '#dc2626' }}>{error}</div>;
  if (!vendor) return null;

  const sc = STATUS_COLORS[vendor.status] || { bg: '#f3f4f6', text: '#374151' };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/vendors" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}>← Vendors</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{vendor.name}</h1>
            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: sc.bg, color: sc.text }}>
              {vendor.status}
            </span>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
              Edit
            </button>
          )}
        </div>
      </div>

      {!editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Section title="Basic Info">
            <Field label="Code" value={vendor.code || '—'} />
            <Field label="Tax ID" value={vendor.taxId || '—'} />
            <Field label="Payment Terms" value={vendor.paymentTerms || '—'} />
          </Section>
          <Section title="Contact">
            <Field label="Contact Name" value={vendor.contactInfo?.contactName || '—'} />
            <Field label="Email" value={vendor.contactInfo?.email || '—'} />
            <Field label="Phone" value={vendor.contactInfo?.phone || '—'} />
          </Section>
          <Section title="Address">
            <Field label="Street" value={vendor.address?.street || '—'} />
            <Field label="City" value={vendor.address?.city || '—'} />
            <Field label="State" value={vendor.address?.state || '—'} />
            <Field label="Postal Code" value={vendor.address?.postalCode || '—'} />
            <Field label="Country" value={vendor.address?.country || '—'} />
          </Section>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Basic Info</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Name *</label>
                <input required value={form.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} />
              </div>
              <div><label style={labelStyle}>Code</label><input value={form.code} onChange={(e) => set('code', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Tax ID</label><input value={form.taxId} onChange={(e) => set('taxId', e.target.value)} style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Payment Terms</label>
                <select value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} style={inputStyle}>
                  {['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', '2/10 Net 30'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} style={inputStyle}>
                  <option value="active">Active</option><option value="inactive">Inactive</option><option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Contact</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label style={labelStyle}>Contact Name</label><input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Phone</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} style={inputStyle} /></div>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Address</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Street</label><input value={form.street} onChange={(e) => set('street', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>City</label><input value={form.city} onChange={(e) => set('city', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>State</label><input value={form.state} onChange={(e) => set('state', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Postal Code</label><input value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Country</label><input value={form.country} onChange={(e) => set('country', e.target.value)} style={inputStyle} /></div>
            </div>
          </div>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" disabled={saving} style={{ padding: '0.625rem 1.25rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setEditing(false)} style={{ padding: '0.625rem 1.25rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem' }}>
      <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151', marginBottom: '0.75rem' }}>{title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.15rem' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: '#111827' }}>{value}</div>
    </div>
  );
}
