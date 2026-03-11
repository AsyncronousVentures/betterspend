'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

interface ScorecardRow {
  vendorId: string;
  vendorName: string;
  overallScore: number;
  deliveryScore: number;
  qualityScore: number;
  priceScore: number;
  invoiceAccuracyScore: number;
  totalPos: number;
  totalInvoices: number;
}

interface ScorecardDetail {
  vendor: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
  };
  scores: {
    overallScore: number;
    deliveryScore: number;
    qualityScore: number;
    priceScore: number;
    invoiceAccuracyScore: number;
    totalPos: number;
    totalInvoices: number;
  };
  trend: Array<{ month: string; invoiceAccuracy: number; priceScore: number }>;
  recentPos: Array<{
    id: string;
    poNumber: string;
    status: string;
    totalAmount: string;
    issuedAt: string | null;
    expectedDeliveryDate: string | null;
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    matchStatus: string | null;
    totalAmount: string;
    invoiceDate: string;
  }>;
}

function scoreBadgeColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 80) return { bg: COLORS.accentGreenLight, text: '#15803d', border: '#bbf7d0' };
  if (score >= 60) return { bg: COLORS.accentAmberLight, text: COLORS.accentAmberDark, border: '#fde68a' };
  return { bg: COLORS.accentRedLight, text: COLORS.accentRedDark, border: '#fecaca' };
}

function ScoreBadge({ score }: { score: number }) {
  const colors = scoreBadgeColor(score);
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '42px',
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 700,
      background: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
    }}>
      {score}
    </span>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const colors = scoreBadgeColor(score);
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.8rem', color: COLORS.textSecondary }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text }}>{score}</span>
      </div>
      <div style={{ background: COLORS.tableBorder, borderRadius: '4px', height: '8px' }}>
        <div style={{
          width: `${Math.min(score, 100)}%`,
          background: colors.text,
          height: '8px',
          borderRadius: '4px',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

function fmt(n: string | number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n));
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return s;
  }
}

const card: React.CSSProperties = {
  background: COLORS.cardBg,
  border: `1px solid ${COLORS.cardBorder}`,
  borderRadius: '8px',
  padding: '1.25rem',
  boxShadow: SHADOWS.card,
};

const th: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  textAlign: 'left',
  fontWeight: 600,
  color: COLORS.textSecondary,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '0.625rem 0.75rem',
  color: COLORS.textSecondary,
  fontSize: '0.875rem',
};

export default function SupplierScorecardPage() {
  const [rows, setRows] = useState<ScorecardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ScorecardDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof ScorecardRow>('overallScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    api.supplierScorecard.list()
      .then((data) => setRows(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleRowClick(vendorId: string) {
    if (selectedVendorId === vendorId) {
      setSelectedVendorId(null);
      setDetail(null);
      return;
    }
    setSelectedVendorId(vendorId);
    setDetail(null);
    setDetailLoading(true);
    api.supplierScorecard.get(vendorId)
      .then((d) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }

  function handleSort(field: keyof ScorecardRow) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortField];
    const bv = b[sortField];
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const selectedRow = rows.find((r) => r.vendorId === selectedVendorId);

  const columns: Array<{ key: keyof ScorecardRow; label: string }> = [
    { key: 'vendorName', label: 'Vendor' },
    { key: 'overallScore', label: 'Overall' },
    { key: 'deliveryScore', label: 'Delivery' },
    { key: 'invoiceAccuracyScore', label: 'Invoice Accuracy' },
    { key: 'priceScore', label: 'Price' },
    { key: 'qualityScore', label: 'Quality' },
    { key: 'totalPos', label: 'POs' },
    { key: 'totalInvoices', label: 'Invoices' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: COLORS.textPrimary }}>
          Supplier Scorecard
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: COLORS.textSecondary, fontSize: '0.875rem' }}>
          Vendor reliability scores based on delivery, invoice accuracy, pricing, and quality
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Excellent (80+)', bg: COLORS.accentGreenLight, text: '#15803d', border: '#bbf7d0' },
          { label: 'Good (60-79)', bg: COLORS.accentAmberLight, text: COLORS.accentAmberDark, border: '#fde68a' },
          { label: 'Needs Attention (<60)', bg: COLORS.accentRedLight, text: COLORS.accentRedDark, border: '#fecaca' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: item.text }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.bg, border: `1px solid ${item.border}` }} />
            {item.label}
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ color: COLORS.textMuted, fontSize: '0.875rem', padding: '2rem 0' }}>
          Loading supplier scores...
        </div>
      )}

      {error && (
        <div style={{ color: COLORS.accentRed, fontSize: '0.875rem', padding: '2rem 0' }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div style={{ ...card, color: COLORS.textMuted, fontSize: '0.875rem' }}>
          No vendor data yet. Scores are computed once vendors have purchase orders or invoices.
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div style={card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: COLORS.tableHeaderBg, borderBottom: `1px solid ${COLORS.tableBorder}` }}>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        ...th,
                        cursor: 'pointer',
                        userSelect: 'none',
                        color: sortField === col.key ? COLORS.accentBlue : COLORS.textSecondary,
                      }}
                    >
                      {col.label}
                      {sortField === col.key && (
                        <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                          {sortDir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const isSelected = row.vendorId === selectedVendorId;
                  return (
                    <>
                      <tr
                        key={row.vendorId}
                        onClick={() => handleRowClick(row.vendorId)}
                        style={{
                          borderBottom: `1px solid ${COLORS.tableBorder}`,
                          cursor: 'pointer',
                          background: isSelected ? COLORS.accentBlueLight : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = COLORS.hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                        }}
                      >
                        <td style={{ ...td, fontWeight: 500, color: COLORS.textPrimary }}>
                          {row.vendorName}
                        </td>
                        <td style={td}>
                          <ScoreBadge score={row.overallScore} />
                        </td>
                        <td style={td}>
                          <ScoreBadge score={row.deliveryScore} />
                        </td>
                        <td style={td}>
                          <ScoreBadge score={row.invoiceAccuracyScore} />
                        </td>
                        <td style={td}>
                          <ScoreBadge score={row.priceScore} />
                        </td>
                        <td style={td}>
                          <ScoreBadge score={row.qualityScore} />
                        </td>
                        <td style={td}>{row.totalPos}</td>
                        <td style={td}>{row.totalInvoices}</td>
                      </tr>

                      {/* Inline detail panel */}
                      {isSelected && (
                        <tr key={`${row.vendorId}-detail`}>
                          <td colSpan={8} style={{ padding: 0, background: COLORS.accentBlueLight }}>
                            <div style={{ padding: '1.25rem', borderTop: `1px solid ${COLORS.cardBorder}` }}>
                              {detailLoading && (
                                <div style={{ color: COLORS.textMuted, fontSize: '0.875rem' }}>Loading details...</div>
                              )}
                              {!detailLoading && detail && (
                                <DetailPanel detail={detail} />
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailPanel({ detail }: { detail: ScorecardDetail }) {
  const s = detail.scores;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
      {/* Score breakdown */}
      <div style={{ background: COLORS.cardBg, borderRadius: '6px', padding: '1rem', border: `1px solid ${COLORS.cardBorder}` }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 1rem' }}>
          Score Breakdown
        </h3>
        <ScoreBar score={s.deliveryScore} label="Delivery (30%)" />
        <ScoreBar score={s.invoiceAccuracyScore} label="Invoice Accuracy (30%)" />
        <ScoreBar score={s.priceScore} label="Price (25%)" />
        <ScoreBar score={s.qualityScore} label="Quality (15%)" />
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${COLORS.tableBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.textPrimary }}>Overall Score</span>
          <ScoreBadge score={s.overallScore} />
        </div>
        <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.78rem', color: COLORS.textMuted }}>
            <div style={{ fontWeight: 600, color: COLORS.textSecondary }}>{s.totalPos}</div>
            <div>Purchase Orders</div>
          </div>
          <div style={{ fontSize: '0.78rem', color: COLORS.textMuted }}>
            <div style={{ fontWeight: 600, color: COLORS.textSecondary }}>{s.totalInvoices}</div>
            <div>Invoices</div>
          </div>
        </div>
      </div>

      {/* Recent POs */}
      <div style={{ background: COLORS.cardBg, borderRadius: '6px', padding: '1rem', border: `1px solid ${COLORS.cardBorder}` }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 0.875rem' }}>
          Recent Purchase Orders
        </h3>
        {detail.recentPos.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: COLORS.textMuted, margin: 0 }}>No purchase orders yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {detail.recentPos.map((po) => (
              <div key={po.id} style={{ fontSize: '0.8rem', padding: '0.5rem', background: COLORS.contentBg, borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>{po.poNumber}</span>
                  <StatusChip status={po.status} />
                </div>
                <div style={{ color: COLORS.textMuted, marginTop: '2px' }}>
                  {fmt(po.totalAmount)}
                  {po.expectedDeliveryDate && (
                    <span style={{ marginLeft: '0.5rem' }}>Due: {fmtDate(po.expectedDeliveryDate)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      <div style={{ background: COLORS.cardBg, borderRadius: '6px', padding: '1rem', border: `1px solid ${COLORS.cardBorder}` }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 0.875rem' }}>
          Recent Invoices
        </h3>
        {detail.recentInvoices.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: COLORS.textMuted, margin: 0 }}>No invoices yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {detail.recentInvoices.map((inv) => (
              <div key={inv.id} style={{ fontSize: '0.8rem', padding: '0.5rem', background: COLORS.contentBg, borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>{inv.invoiceNumber}</span>
                  <MatchChip matchStatus={inv.matchStatus} />
                </div>
                <div style={{ color: COLORS.textMuted, marginTop: '2px' }}>
                  {fmt(inv.totalAmount)}
                  <span style={{ marginLeft: '0.5rem' }}>{fmtDate(inv.invoiceDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    draft:               { bg: '#f1f5f9', text: COLORS.textSecondary },
    pending_approval:    { bg: COLORS.accentAmberLight, text: COLORS.accentAmberDark },
    approved:            { bg: COLORS.accentGreenLight, text: '#15803d' },
    issued:              { bg: COLORS.accentBlueLight, text: '#1d4ed8' },
    partially_received:  { bg: '#f0fdf4', text: '#166534' },
    received:            { bg: COLORS.accentGreenLight, text: '#15803d' },
    cancelled:           { bg: COLORS.accentRedLight, text: COLORS.accentRedDark },
  };
  const style = map[status] ?? { bg: '#f1f5f9', text: COLORS.textSecondary };
  return (
    <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '9999px', fontWeight: 600, background: style.bg, color: style.text }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function MatchChip({ matchStatus }: { matchStatus: string | null }) {
  if (!matchStatus) return <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>—</span>;
  const map: Record<string, { bg: string; text: string }> = {
    full_match:    { bg: COLORS.accentGreenLight, text: '#15803d' },
    partial_match: { bg: COLORS.accentAmberLight, text: COLORS.accentAmberDark },
    exception:     { bg: COLORS.accentRedLight, text: COLORS.accentRedDark },
  };
  const style = map[matchStatus] ?? { bg: '#f1f5f9', text: COLORS.textSecondary };
  return (
    <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '9999px', fontWeight: 600, background: style.bg, color: style.text }}>
      {matchStatus.replace(/_/g, ' ')}
    </span>
  );
}
