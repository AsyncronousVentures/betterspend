'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  msa: 'MSA',
  sow: 'SOW',
  nda: 'NDA',
  sla: 'SLA',
  purchase_agreement: 'Purchase Agreement',
  framework: 'Framework Agreement',
  other: 'Other',
};

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  draft:            { background: '#f1f5f9', color: COLORS.textSecondary },
  pending_approval: { background: COLORS.accentAmberLight, color: COLORS.accentAmberDark },
  active:           { background: COLORS.accentGreenLight, color: COLORS.accentGreenDark },
  expiring_soon:    { background: '#fff7ed', color: '#9a3412' },
  expired:          { background: COLORS.accentRedLight, color: COLORS.accentRedDark },
  terminated:       { background: '#f8fafc', color: '#475569' },
};

const STATUS_LABELS: Record<string, string> = {
  draft:            'Draft',
  pending_approval: 'Pending Approval',
  active:           'Active',
  expiring_soon:    'Expiring Soon',
  expired:          'Expired',
  terminated:       'Terminated',
};

const TABS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Expiring Soon', value: 'expiring_soon' },
  { label: 'Draft', value: 'draft' },
  { label: 'Expired', value: 'expired' },
  { label: 'Terminated', value: 'terminated' },
];

const fmt = (n: string | number | null | undefined, currency = 'USD') => {
  if (n == null || n === '') return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(n));
};

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ContractsPage() {
  const [contracts, setContracts]       = useState<any[]>([]);
  const [expiring, setExpiring]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [activeTab, setActiveTab]       = useState('');
  const [dismissWarning, setDismissWarning] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = activeTab ? { status: activeTab } : undefined;
    Promise.all([
      api.contracts.list(params),
      api.contracts.expiring(30),
    ])
      .then(([list, exp]) => {
        setContracts(list);
        setExpiring(exp);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontWeight: 600,
    color: COLORS.textSecondary,
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: COLORS.textPrimary }}>Contracts</h1>
          <p style={{ margin: '0.25rem 0 0', color: COLORS.textSecondary, fontSize: '0.875rem' }}>Vendor agreements and procurement contracts</p>
        </div>
        <Link
          href="/contracts/new"
          style={{ padding: '0.5rem 1rem', background: COLORS.accentBlue, color: COLORS.white, borderRadius: '6px', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}
        >
          + New Contract
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: COLORS.accentRedLight, border: `1px solid #fecaca`, borderRadius: '6px', padding: '0.75rem 1rem', color: COLORS.accentRedDark, fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.accentRedDark, fontWeight: 700, fontSize: '1rem', lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}

      {/* Expiring warning banner */}
      {!dismissWarning && expiring.length > 0 && (
        <div style={{ background: '#fffbeb', border: `1px solid #fde68a`, borderRadius: '6px', padding: '0.75rem 1rem', color: '#92400e', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <strong>Warning:</strong> {expiring.length} contract{expiring.length !== 1 ? 's' : ''} expiring within 30 days.{' '}
            <button onClick={() => setActiveTab('expiring_soon')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', textDecoration: 'underline', fontSize: '0.875rem', padding: 0 }}>
              View expiring contracts
            </button>
          </span>
          <button onClick={() => setDismissWarning(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontWeight: 700, fontSize: '1rem', lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', borderBottom: `1px solid ${COLORS.tableBorder}` }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: '0.5rem 1rem',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? `2px solid ${COLORS.accentBlue}` : '2px solid transparent',
                color: isActive ? COLORS.accentBlue : COLORS.textSecondary,
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.tableBorder}`, borderRadius: '8px', overflow: 'hidden', boxShadow: SHADOWS.card }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: COLORS.textMuted }}>Loading...</div>
        ) : contracts.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: COLORS.textMuted }}>
            <p style={{ fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.5rem' }}>No contracts found</p>
            <Link href="/contracts/new" style={{ color: COLORS.accentBlue, textDecoration: 'none', fontSize: '0.875rem' }}>
              Create your first contract →
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.tableBorder}`, background: COLORS.tableHeaderBg }}>
                  <th style={thStyle}>Contract #</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Vendor</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Total Value</th>
                  <th style={thStyle}>Start Date</th>
                  <th style={thStyle}>End Date</th>
                  <th style={thStyle}>Auto-Renew</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract, idx) => {
                  const sc = STATUS_STYLES[contract.status] ?? { background: '#f1f5f9', color: COLORS.textSecondary };
                  return (
                    <tr
                      key={contract.id}
                      style={{ borderBottom: idx < contracts.length - 1 ? `1px solid ${COLORS.contentBg}` : undefined, cursor: 'pointer' }}
                      onClick={() => (window.location.href = `/contracts/${contract.id}`)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.hoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: COLORS.accentBlueDark, fontWeight: 600 }}>
                        {contract.contractNumber || '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: COLORS.textPrimary, maxWidth: '220px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {contract.title}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>
                        {contract.vendor?.name ?? contract.vendorId ?? '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>
                        {CONTRACT_TYPE_LABELS[contract.type] ?? contract.type ?? '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ ...sc, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
                          {STATUS_LABELS[contract.status] ?? contract.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {contract.totalValue != null ? fmt(contract.totalValue, contract.currency ?? 'USD') : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary, whiteSpace: 'nowrap' }}>
                        {fmtDate(contract.startDate)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: contract.status === 'expiring_soon' ? '#9a3412' : COLORS.textSecondary, whiteSpace: 'nowrap', fontWeight: contract.status === 'expiring_soon' ? 600 : 400 }}>
                        {fmtDate(contract.endDate)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {contract.autoRenew ? (
                          <span style={{ background: COLORS.accentBlueLight, color: COLORS.accentBlueDark, padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600 }}>
                            Auto-Renew
                          </span>
                        ) : (
                          <span style={{ color: COLORS.textMuted, fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
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
