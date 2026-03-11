'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { COLORS, SHADOWS } from '../../../lib/theme';

const CONTRACT_TYPES = [
  { value: 'msa',                label: 'MSA — Master Service Agreement' },
  { value: 'sow',                label: 'SOW — Statement of Work' },
  { value: 'nda',                label: 'NDA — Non-Disclosure Agreement' },
  { value: 'sla',                label: 'SLA — Service Level Agreement' },
  { value: 'purchase_agreement', label: 'Purchase Agreement' },
  { value: 'framework',          label: 'Framework Agreement' },
  { value: 'other',              label: 'Other' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'MXN'];

export default function NewContractPage() {
  const router = useRouter();
  const [vendors, setVendors]   = useState<any[]>([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const [form, setForm] = useState({
    title:             '',
    type:              'msa',
    vendorId:          '',
    startDate:         '',
    endDate:           '',
    totalValue:        '',
    currency:          'USD',
    paymentTerms:      '',
    autoRenew:         false,
    renewalNoticeDays: '',
    terms:             '',
    internalNotes:     '',
  });

  useEffect(() => {
    api.vendors.list().then(setVendors).catch(() => {});
  }, []);

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        title:        form.title,
        type:         form.type,
        vendorId:     form.vendorId || undefined,
        startDate:    form.startDate || undefined,
        endDate:      form.endDate || undefined,
        totalValue:   form.totalValue ? Number(form.totalValue) : undefined,
        currency:     form.currency,
        paymentTerms: form.paymentTerms || undefined,
        autoRenew:    form.autoRenew,
        terms:        form.terms || undefined,
        internalNotes: form.internalNotes || undefined,
      };
      if (form.autoRenew && form.renewalNoticeDays) {
        payload.renewalNoticeDays = Number(form.renewalNoticeDays);
      }
      const created = await api.contracts.create(payload);
      router.push(`/contracts/${created.id}`);
    } catch (e: any) {
      setError(e.message || 'Failed to create contract');
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: `1px solid ${COLORS.inputBorder}`,
    borderRadius: '6px',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    background: COLORS.white,
    color: COLORS.textPrimary,
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: COLORS.textSecondary,
    marginBottom: '0.25rem',
  };
  const cardStyle: React.CSSProperties = {
    background: COLORS.cardBg,
    border: `1px solid ${COLORS.tableBorder}`,
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: SHADOWS.card,
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '760px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/contracts" style={{ color: COLORS.accentBlue, textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Contracts
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0', color: COLORS.textPrimary }}>New Contract</h1>
        <p style={{ margin: '0.25rem 0 0', color: COLORS.textSecondary, fontSize: '0.875rem' }}>Create a new vendor contract</p>
      </div>

      {error && (
        <div style={{ background: COLORS.accentRedLight, border: `1px solid #fecaca`, borderRadius: '6px', padding: '0.75rem 1rem', color: COLORS.accentRedDark, fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.accentRedDark, fontWeight: 700, fontSize: '1rem', lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={cardStyle}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', color: COLORS.textPrimary, margin: '0 0 1rem' }}>Basic Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Software Licensing Agreement 2026"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Contract Type *</label>
              <select required value={form.type} onChange={(e) => set('type', e.target.value)} style={inputStyle}>
                {CONTRACT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Vendor</label>
              <select value={form.vendorId} onChange={(e) => set('vendorId', e.target.value)} style={inputStyle}>
                <option value="">— Select vendor —</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dates & Value */}
        <div style={cardStyle}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', color: COLORS.textPrimary, margin: '0 0 1rem' }}>Dates & Value</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Total Value</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.totalValue}
                onChange={(e) => set('totalValue', e.target.value)}
                placeholder="0.00"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <select value={form.currency} onChange={(e) => set('currency', e.target.value)} style={inputStyle}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Terms & Renewal */}
        <div style={cardStyle}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', color: COLORS.textPrimary, margin: '0 0 1rem' }}>Terms & Renewal</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Payment Terms</label>
              <select value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} style={inputStyle}>
                <option value="">— Select terms —</option>
                {['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', '2/10 Net 30'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={form.autoRenew}
                  onChange={(e) => set('autoRenew', e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: COLORS.textSecondary }}>Auto-Renew</span>
              </label>
            </div>
            {form.autoRenew && (
              <div>
                <label style={labelStyle}>Renewal Notice (days)</label>
                <input
                  type="number"
                  min="1"
                  value={form.renewalNoticeDays}
                  onChange={(e) => set('renewalNoticeDays', e.target.value)}
                  placeholder="e.g. 30"
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        </div>

        {/* Contract Text */}
        <div style={cardStyle}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', color: COLORS.textPrimary, margin: '0 0 1rem' }}>Contract Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Terms & Conditions</label>
              <textarea
                rows={6}
                value={form.terms}
                onChange={(e) => set('terms', e.target.value)}
                placeholder="Enter contract terms and conditions..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Internal Notes</label>
              <textarea
                rows={3}
                value={form.internalNotes}
                onChange={(e) => set('internalNotes', e.target.value)}
                placeholder="Internal notes (not shared with vendor)..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '0.625rem 1.5rem', background: COLORS.accentBlue, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Creating...' : 'Create Contract'}
          </button>
          <Link
            href="/contracts"
            style={{ padding: '0.625rem 1.25rem', background: COLORS.tableBorder, color: COLORS.textSecondary, border: 'none', borderRadius: '6px', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center' }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
