'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { COLORS, SHADOWS, FONT } from '../../lib/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  params?: { label: string; key: string; options: { label: string; value: string }[] }[];
}

interface SavedReport {
  id: string;
  name: string;
  reportType: string;
  filters: Record<string, unknown>;
  groupBy?: string;
  createdAt: string;
}

// ─── Static report list (preserved) ──────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { value: 'spend_by_vendor', label: 'Spend by Vendor' },
  { value: 'spend_by_department', label: 'Spend by Department' },
  { value: 'spend_by_category', label: 'Spend by Category' },
  { value: 'po_status_summary', label: 'PO Status Summary' },
  { value: 'invoice_aging', label: 'Invoice Aging' },
  { value: 'approval_cycle_time', label: 'Approval Cycle Time' },
];

const DATE_RANGES = [
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'last12months', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom range' },
];

const GROUP_BY_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'month', label: 'By Month' },
  { value: 'quarter', label: 'By Quarter' },
  { value: 'vendor', label: 'By Vendor' },
  { value: 'department', label: 'By Department' },
];

function getDateRange(preset: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (preset === 'last30') {
    const s = new Date(now); s.setDate(s.getDate() - 30);
    return { startDate: fmt(s), endDate: fmt(now) };
  }
  if (preset === 'last90') {
    const s = new Date(now); s.setDate(s.getDate() - 90);
    return { startDate: fmt(s), endDate: fmt(now) };
  }
  if (preset === 'last12months') {
    const s = new Date(now); s.setFullYear(s.getFullYear() - 1);
    return { startDate: fmt(s), endDate: fmt(now) };
  }
  return {};
}

// ─── Input / Select helpers ───────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: `1px solid ${COLORS.inputBorder}`,
  borderRadius: '6px',
  fontSize: FONT.base,
  color: COLORS.textPrimary,
  background: COLORS.white,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: FONT.sm,
  fontWeight: 500,
  color: COLORS.textSecondary,
  marginBottom: '0.3rem',
};

const btnPrimary: React.CSSProperties = {
  padding: '0.55rem 1.25rem',
  background: COLORS.accentBlue,
  color: COLORS.white,
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: FONT.base,
  whiteSpace: 'nowrap',
};

const btnSecondary: React.CSSProperties = {
  padding: '0.55rem 1.25rem',
  background: COLORS.white,
  color: COLORS.textPrimary,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: FONT.base,
  whiteSpace: 'nowrap',
};

const btnDanger: React.CSSProperties = {
  ...btnSecondary,
  color: COLORS.accentRed,
  borderColor: COLORS.accentRed,
};

// ─── Save Modal ───────────────────────────────────────────────────────────────

function SaveModal({
  onSave,
  onClose,
}: {
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: SHADOWS.overlay,
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: COLORS.white, borderRadius: '10px', padding: '1.75rem', width: '380px', boxShadow: SHADOWS.dropdown }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: FONT.md, marginBottom: '1.25rem', color: COLORS.textPrimary }}>Save Report</div>
        <label style={labelStyle}>Report name</label>
        <input
          style={{ ...inputStyle, marginBottom: '1.25rem' }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Monthly Vendor Spend"
          autoFocus
        />
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button style={btnSecondary} onClick={onClose}>Cancel</button>
          <button
            style={{ ...btnPrimary, opacity: name.trim() ? 1 : 0.5 }}
            disabled={!name.trim()}
            onClick={() => onSave(name.trim())}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Result Table ─────────────────────────────────────────────────────────────

function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.textMuted, fontSize: FONT.base }}>
        No data found for the selected criteria.
      </div>
    );
  }
  const headers = Object.keys(rows[0]);
  return (
    <div style={{ overflowX: 'auto', borderRadius: '6px', border: `1px solid ${COLORS.tableBorder}` }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: FONT.sm }}>
        <thead>
          <tr style={{ background: COLORS.tableHeaderBg }}>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  padding: '0.65rem 0.9rem',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                  borderBottom: `1px solid ${COLORS.tableBorder}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ background: i % 2 === 0 ? COLORS.white : COLORS.hoverBg }}
            >
              {headers.map((h) => (
                <td
                  key={h}
                  style={{
                    padding: '0.6rem 0.9rem',
                    color: COLORS.textPrimary,
                    borderBottom: `1px solid ${COLORS.tableBorder}`,
                  }}
                >
                  {row[h] == null ? '—' : String(row[h])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  // Legacy download state
  const [downloading, setDownloading] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, Record<string, string>>>({});

  // Custom report builder state
  const [reportType, setReportType] = useState('spend_by_vendor');
  const [dateRange, setDateRange] = useState('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Saved reports state
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const loadSavedReports = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const list = await api.reports.savedReports.list();
      setSavedReports(list);
    } catch {
      // ignore
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => { loadSavedReports(); }, [loadSavedReports]);

  // ─── Legacy helpers ─────────────────────────────────────────────────────

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

  // ─── Custom report helpers ──────────────────────────────────────────────

  function buildParams() {
    const dates = dateRange === 'custom'
      ? { startDate: customStart || undefined, endDate: customEnd || undefined }
      : getDateRange(dateRange);
    return {
      reportType,
      ...dates,
      groupBy: groupBy || undefined,
    };
  }

  async function runReport() {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const rows = await api.reports.customReport(buildParams());
      setResults(rows);
    } catch (e: any) {
      setError(e.message || 'Failed to run report');
    } finally {
      setRunning(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await api.reports.customReportCsv(buildParams());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch (e: any) {
      alert('Export failed: ' + e.message);
    } finally {
      setExporting(false);
    }
  }

  async function saveReport(name: string) {
    const { startDate, endDate } = dateRange === 'custom'
      ? { startDate: customStart || undefined, endDate: customEnd || undefined }
      : getDateRange(dateRange);

    await api.reports.savedReports.save({
      name,
      reportType,
      filters: {
        dateRange,
        startDate,
        endDate,
      },
      groupBy: groupBy || undefined,
    });
    setShowSaveModal(false);
    loadSavedReports();
  }

  async function runSavedReport(sr: SavedReport) {
    const filters = sr.filters as { dateRange?: string; startDate?: string; endDate?: string };
    const dates = filters.dateRange && filters.dateRange !== 'custom'
      ? getDateRange(filters.dateRange)
      : { startDate: filters.startDate, endDate: filters.endDate };

    setReportType(sr.reportType);
    setGroupBy(sr.groupBy ?? '');
    setDateRange(filters.dateRange ?? 'last30');
    if (filters.dateRange === 'custom') {
      setCustomStart(filters.startDate ?? '');
      setCustomEnd(filters.endDate ?? '');
    }
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const rows = await api.reports.customReport({
        reportType: sr.reportType,
        ...dates,
        groupBy: sr.groupBy || undefined,
      });
      setResults(rows);
    } catch (e: any) {
      setError(e.message || 'Failed to run report');
    } finally {
      setRunning(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteSavedReport(id: string) {
    try {
      await api.reports.savedReports.delete(id);
      setSavedReports((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert('Delete failed: ' + e.message);
    }
  }

  const reportTypeLabel = REPORT_TYPES.find((r) => r.value === reportType)?.label ?? reportType;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: FONT.xl, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Reports</h1>
        <p style={{ color: COLORS.textSecondary, fontSize: FONT.base, marginTop: '0.25rem' }}>
          Build custom reports, export data as CSV, and save your frequently used configurations.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Custom Report Builder */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1.75rem', marginBottom: '2rem', boxShadow: SHADOWS.card }}>
        <div style={{ fontWeight: 700, fontSize: FONT.md, color: COLORS.textPrimary, marginBottom: '1.25rem' }}>
          Custom Report Builder
        </div>

        {/* Row 1: Report type + Date range + Group by */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={labelStyle}>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={inputStyle}
            >
              {REPORT_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={inputStyle}
            >
              {DATE_RANGES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              style={inputStyle}
            >
              {GROUP_BY_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Custom dates (only when preset = custom) */}
        {dateRange === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={inputStyle} />
            </div>
          </div>
        )}

        {/* Row 3: Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button
            style={{ ...btnPrimary, opacity: running ? 0.6 : 1 }}
            onClick={runReport}
            disabled={running}
          >
            {running ? 'Running...' : 'Run Report'}
          </button>
          <button
            style={{ ...btnSecondary, opacity: exporting ? 0.6 : 1 }}
            onClick={exportCsv}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            style={btnSecondary}
            onClick={() => setShowSaveModal(true)}
          >
            Save Report
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: COLORS.accentRedLight, border: `1px solid ${COLORS.accentRed}`, borderRadius: '6px', color: COLORS.accentRedDark, fontSize: FONT.sm }}>
            {error}
          </div>
        )}

        {/* Results */}
        {results !== null && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: FONT.base }}>
                {reportTypeLabel} — {results.length} row{results.length !== 1 ? 's' : ''}
              </div>
            </div>
            <ResultTable rows={results} />
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Saved Reports */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1.75rem', marginBottom: '2rem', boxShadow: SHADOWS.card }}>
        <div style={{ fontWeight: 700, fontSize: FONT.md, color: COLORS.textPrimary, marginBottom: '1rem' }}>
          Saved Reports
        </div>

        {loadingSaved ? (
          <div style={{ color: COLORS.textMuted, fontSize: FONT.sm }}>Loading...</div>
        ) : savedReports.length === 0 ? (
          <div style={{ color: COLORS.textMuted, fontSize: FONT.sm }}>No saved reports yet. Run a report and click "Save Report" to store it for later.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {savedReports.map((sr) => {
              const label = REPORT_TYPES.find((r) => r.value === sr.reportType)?.label ?? sr.reportType;
              return (
                <div
                  key={sr.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: COLORS.hoverBg,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '7px',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: FONT.base, marginBottom: '0.15rem' }}>{sr.name}</div>
                    <div style={{ fontSize: FONT.sm, color: COLORS.textSecondary }}>
                      {label}{sr.groupBy ? ` · grouped by ${sr.groupBy}` : ''} · saved {new Date(sr.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button style={{ ...btnSecondary, padding: '0.4rem 0.9rem', fontSize: FONT.sm }} onClick={() => runSavedReport(sr)}>Run</button>
                    <button style={{ ...btnDanger, padding: '0.4rem 0.9rem', fontSize: FONT.sm }} onClick={() => deleteSavedReport(sr.id)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Standard CSV Exports (preserved) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: FONT.md, color: COLORS.textPrimary, marginBottom: '0.25rem' }}>
          Standard Exports
        </div>
        <p style={{ color: COLORS.textSecondary, fontSize: FONT.sm, margin: 0 }}>
          Export raw data as CSV for analysis in Excel or other tools.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {REPORTS.map((report) => (
          <div key={report.id} style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '1.5rem', boxShadow: SHADOWS.card }}>
            <div style={{ fontWeight: 600, color: COLORS.textPrimary, marginBottom: '0.375rem' }}>{report.title}</div>
            <div style={{ fontSize: FONT.sm, color: COLORS.textSecondary, marginBottom: '1rem' }}>{report.description}</div>

            {report.params && report.params.map((p) => (
              <div key={p.key} style={{ marginBottom: '0.75rem' }}>
                <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>{p.label}</label>
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
                fontWeight: 500, fontSize: FONT.base, marginTop: '0.25rem',
              }}
            >
              {downloading === report.id ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <SaveModal
          onSave={saveReport}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
