'use client';

import { useState, useEffect } from 'react';
import { COLORS, SHADOWS, FONT } from '../../lib/theme';
import { api } from '../../lib/api';

const DIVERSITY_LABELS: Record<string, string> = {
  minority_owned: 'Minority-Owned',
  women_owned: 'Women-Owned',
  veteran_owned: 'Veteran-Owned',
  small_business: 'Small Business',
  lgbtq_owned: 'LGBTQ+-Owned',
  disability_owned: 'Disability-Owned',
  hub_zone: 'HUBZone',
  indigenous_owned: 'Indigenous-Owned',
};

const ESG_COLORS: Record<string, { bg: string; text: string }> = {
  'A+': { bg: '#dcfce7', text: '#065f46' },
  A: { bg: '#d1fae5', text: '#065f46' },
  'B+': { bg: '#d0f0fd', text: '#0c4a6e' },
  B: { bg: '#e0f2fe', text: '#0c4a6e' },
  C: { bg: COLORS.accentAmberLight, text: COLORS.accentAmberDark },
  D: { bg: COLORS.accentRedLight, text: COLORS.accentRedDark },
};

const CERT_LABELS: Record<string, string> = {
  iso14001: 'ISO 14001',
  b_corp: 'B Corp',
  fair_trade: 'Fair Trade',
  fsc: 'FSC Certified',
  leed: 'LEED',
  energy_star: 'Energy Star',
};

export default function SupplierDiversityPage() {
  const [summary, setSummary] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [sum, vlist] = await Promise.all([
        fetch('/api/v1/vendors/diversity/summary', { headers: { 'x-org-id': '00000000-0000-0000-0000-000000000001' } }).then((r) => r.json()),
        api.vendors.list(),
      ]);
      setSummary(sum);
      setVendors(vlist as any[]);
    } catch {
      setMsg('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(vendor: any) {
    setEditingId(vendor.id);
    setEditForm({
      diversityCategories: (vendor.diversityCategories as string[]) ?? [],
      esgRating: vendor.esgRating ?? '',
      carbonFootprintTons: vendor.carbonFootprintTons ?? '',
      sustainabilityCertifications: (vendor.sustainabilityCertifications as string[]) ?? [],
      esgNotes: vendor.esgNotes ?? '',
    });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/v1/vendors/${id}/esg`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': '00000000-0000-0000-0000-000000000001',
        },
        body: JSON.stringify({
          ...editForm,
          esgRating: editForm.esgRating || undefined,
          carbonFootprintTons: editForm.carbonFootprintTons || undefined,
        }),
      });
      setEditingId(null);
      setMsg('ESG data saved');
      load();
    } catch {
      setMsg('Save failed');
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(cat: string) {
    const cats: string[] = editForm.diversityCategories ?? [];
    setEditForm({
      ...editForm,
      diversityCategories: cats.includes(cat) ? cats.filter((c: string) => c !== cat) : [...cats, cat],
    });
  }

  function toggleCert(cert: string) {
    const certs: string[] = editForm.sustainabilityCertifications ?? [];
    setEditForm({
      ...editForm,
      sustainabilityCertifications: certs.includes(cert) ? certs.filter((c: string) => c !== cert) : [...certs, cert],
    });
  }

  const inp: React.CSSProperties = {
    border: `1px solid ${COLORS.inputBorder}`,
    borderRadius: 6,
    padding: '0.35rem 0.5rem',
    fontSize: FONT.xs,
    background: '#fff',
    color: COLORS.textPrimary,
  };

  return (
    <div style={{ padding: '1.5rem', background: COLORS.contentBg, minHeight: '100vh' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: FONT.xl, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Supplier Diversity & ESG</h1>
        <p style={{ fontSize: FONT.sm, color: COLORS.textSecondary, margin: '0.25rem 0 0' }}>
          Track diversity certifications, ESG ratings, and sustainability initiatives across your supply chain
        </p>
      </div>

      {msg && (
        <div style={{ background: COLORS.accentBlueLight, color: COLORS.accentBlueDark, padding: '0.5rem 0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: FONT.sm }}>
          {msg}
        </div>
      )}

      {/* Summary cards */}
      {summary && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Vendors', value: summary.totalVendors, color: COLORS.accentBlue },
            { label: 'Diverse Suppliers', value: summary.diverseVendors, color: COLORS.accentPurple },
            { label: 'Diversity Rate', value: `${summary.diversityRate}%`, color: COLORS.accentGreen },
            { label: 'ESG Rated', value: summary.esgRatedVendors, color: COLORS.accentAmber },
          ].map((s) => (
            <div key={s.label} style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: '1.25rem', boxShadow: SHADOWS.card }}>
              <div style={{ fontSize: FONT.xs, color: COLORS.textSecondary, marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontSize: FONT.xxl, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Diversity breakdown */}
      {summary && Object.keys(summary.diversityBreakdown ?? {}).length > 0 && (
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', boxShadow: SHADOWS.card }}>
          <h3 style={{ fontSize: FONT.base, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 1rem' }}>Diversity Category Breakdown</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {Object.entries(summary.diversityBreakdown).map(([cat, count]: any) => (
              <div key={cat} style={{ background: COLORS.accentPurpleLight, borderRadius: 8, padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: FONT.sm, color: COLORS.accentPurpleDark, fontWeight: 600 }}>{DIVERSITY_LABELS[cat] ?? cat}</span>
                <span style={{ fontSize: FONT.xs, background: COLORS.accentPurple, color: '#fff', borderRadius: 20, padding: '0.1rem 0.4rem', fontWeight: 700 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendor table */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, boxShadow: SHADOWS.card, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 style={{ fontSize: FONT.base, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>All Vendors</h3>
        </div>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: COLORS.textMuted }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: COLORS.tableHeaderBg }}>
                {['Vendor', 'Diversity Categories', 'ESG Rating', 'Certifications', 'Carbon (tons/yr)', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: FONT.xs, fontWeight: 700, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.tableBorder}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => {
                const cats = (v.diversityCategories as string[]) ?? [];
                const certs = (v.sustainabilityCertifications as string[]) ?? [];
                const isEditing = editingId === v.id;
                return (
                  <tr key={v.id} style={{ borderBottom: `1px solid ${COLORS.tableBorder}` }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: FONT.sm, fontWeight: 600, color: COLORS.textPrimary }}>{v.name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {Object.keys(DIVERSITY_LABELS).map((cat) => (
                            <button key={cat} onClick={() => toggleCategory(cat)} style={{
                              background: editForm.diversityCategories?.includes(cat) ? COLORS.accentPurple : COLORS.contentBg,
                              color: editForm.diversityCategories?.includes(cat) ? '#fff' : COLORS.textSecondary,
                              border: `1px solid ${COLORS.border}`, borderRadius: 20,
                              padding: '0.15rem 0.5rem', fontSize: FONT.xs, cursor: 'pointer',
                            }}>{DIVERSITY_LABELS[cat]}</button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {cats.length === 0 ? <span style={{ fontSize: FONT.xs, color: COLORS.textMuted }}>—</span> :
                            cats.map((c) => <span key={c} style={{ fontSize: FONT.xs, background: COLORS.accentPurpleLight, color: COLORS.accentPurpleDark, borderRadius: 20, padding: '0.15rem 0.5rem', fontWeight: 600 }}>{DIVERSITY_LABELS[c] ?? c}</span>)
                          }
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {isEditing ? (
                        <select style={inp} value={editForm.esgRating} onChange={(e) => setEditForm({ ...editForm, esgRating: e.target.value })}>
                          <option value="">Not Rated</option>
                          {['A+', 'A', 'B+', 'B', 'C', 'D'].map((r) => <option key={r}>{r}</option>)}
                        </select>
                      ) : v.esgRating ? (
                        <span style={{ fontSize: FONT.xs, fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 20, ...(ESG_COLORS[v.esgRating] ?? {}) }}>{v.esgRating}</span>
                      ) : <span style={{ fontSize: FONT.xs, color: COLORS.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {Object.keys(CERT_LABELS).map((cert) => (
                            <button key={cert} onClick={() => toggleCert(cert)} style={{
                              background: editForm.sustainabilityCertifications?.includes(cert) ? COLORS.accentGreen : COLORS.contentBg,
                              color: editForm.sustainabilityCertifications?.includes(cert) ? '#fff' : COLORS.textSecondary,
                              border: `1px solid ${COLORS.border}`, borderRadius: 20,
                              padding: '0.15rem 0.5rem', fontSize: FONT.xs, cursor: 'pointer',
                            }}>{CERT_LABELS[cert]}</button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {certs.length === 0 ? <span style={{ fontSize: FONT.xs, color: COLORS.textMuted }}>—</span> :
                            certs.map((c) => <span key={c} style={{ fontSize: FONT.xs, background: COLORS.accentGreenLight, color: COLORS.accentGreenDark, borderRadius: 20, padding: '0.15rem 0.5rem' }}>{CERT_LABELS[c] ?? c}</span>)
                          }
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {isEditing ? (
                        <input style={{ ...inp, width: 80 }} type="number" value={editForm.carbonFootprintTons} onChange={(e) => setEditForm({ ...editForm, carbonFootprintTons: e.target.value })} placeholder="0" />
                      ) : <span style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>{v.carbonFootprintTons ?? '—'}</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => saveEdit(v.id)} disabled={saving} style={{ background: COLORS.accentBlue, color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', fontSize: FONT.xs, cursor: 'pointer' }}>Save</button>
                          <button onClick={() => setEditingId(null)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '0.3rem 0.6rem', fontSize: FONT.xs, cursor: 'pointer', color: COLORS.textSecondary }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(v)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '0.3rem 0.6rem', fontSize: FONT.xs, cursor: 'pointer', color: COLORS.textSecondary }}>Edit ESG</button>
                      )}
                    </td>
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
