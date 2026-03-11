'use client';

import { useState } from 'react';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

interface Report {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  params?: { label: string; key: string; options: { label: string; value: string }[] }[];
}

const REPORTS: Report[] = [
  {
    id: 'pos',
    title: 'Purchase Orders',
    description: 'All purchase orders with vendor, status, and amounts.',
    endpoint: '/reports/purchase-orders/csv',
    params: [{
      label: 'Status', key: 'status',
      options: [
        { label: 'All', value: '' },
        { label: 'Draft', value: 'draft' },
        { label: 'Pending Approval', value: 'pending_approval' },
        { label: 'Approved', value: 'approved' },
        { label: 'Issued', value: 'issued' },
        { label: 'Received', value: 'received' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    }],
  },
  {
    id: 'invoices',
    title: 'Invoices',
    description: 'All invoices with match status, amounts, and approval info.',
    endpoint: '/reports/invoices/csv',
    params: [{
      label: 'Status', key: 'status',
      options: [
        { label: 'All', value: '' },
        { label: 'Pending Match', value: 'pending_match' },
        { label: 'Matched', value: 'matched' },
        { label: 'Exception', value: 'exception' },
        { label: 'Approved', value: 'approved' },
      ],
    }],
  },
  {
    id: 'requisitions',
    title: 'Requisitions',
    description: 'All requisitions with department, priority, and totals.',
    endpoint: '/reports/requisitions/csv',
  },
  {
    id: 'spend',
    title: 'Spend Summary by Vendor',
    description: 'Aggregated spend per vendor from approved invoices.',
    endpoint: '/reports/spend-summary/csv',
  },
  {
    id: 'budgets',
    title: 'Budget Utilization',
    description: 'All budgets with allocated, spent, remaining, and utilization percentage.',
    endpoint: '/reports/budgets/csv',
  },
  {
    id: 'dept-spend',
    title: 'Department Spend',
    description: 'PO and requisition totals broken down by department.',
    endpoint: '/reports/department-spend/csv',
  },
  {
    id: 'ap-aging',
    title: 'AP Aging',
    description: 'Overdue unpaid invoices grouped by aging bucket (0-30, 31-60, 61-90, 90+ days).',
    endpoint: '/reports/ap-aging/csv',
  },
  {
    id: 'grn',
    title: 'Goods Receipts',
    description: 'All GRNs with PO, vendor, received date, and quantities.',
    endpoint: '/reports/goods-receipts/csv',
  },
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, Record<string, string>>>({});

  function setParam(reportId: string, key: string, value: string) {
    setParams((p) => ({ ...p, [reportId]: { ...(p[reportId] || {}), [key]: value } }));
  }

  async function download(report: Report) {
    setDownloading(report.id);
    try {
      const rp = params[report.id] || {};
      const filtered: Record<string, string> = {};
      for (const [k, v] of Object.entries(rp)) { if (v) filtered[k] = v; }
      const res = await api.reports.download(report.endpoint.replace('/reports/', ''), filtered);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${report.id}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch (e: any) {
      alert('Download failed: ' + e.message);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.textPrimary }}>Reports</h1>
        <p style={{ color: COLORS.textSecondary, fontSize: '0.875rem', marginTop: '0.25rem' }}>Export data as CSV for analysis in Excel or other tools.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {REPORTS.map((report) => (
          <div key={report.id} style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '1.5rem', boxShadow: SHADOWS.card }}>
            <div style={{ fontWeight: 600, color: COLORS.textPrimary, marginBottom: '0.375rem' }}>{report.title}</div>
            <div style={{ fontSize: '0.875rem', color: COLORS.textSecondary, marginBottom: '1rem' }}>{report.description}</div>

            {report.params && report.params.map((p) => (
              <div key={p.key} style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.25rem' }}>{p.label}</label>
                <select
                  value={params[report.id]?.[p.key] || ''}
                  onChange={(e) => setParam(report.id, p.key, e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  {p.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}

            <button
              onClick={() => download(report)}
              disabled={downloading === report.id}
              style={{
                width: '100%', padding: '0.6rem', background: downloading === report.id ? '#93c5fd' : COLORS.accentBlue,
                color: COLORS.white, border: 'none', borderRadius: '6px', cursor: downloading === report.id ? 'not-allowed' : 'pointer',
                fontWeight: 500, fontSize: '0.875rem', marginTop: '0.25rem',
              }}
            >
              {downloading === report.id ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
