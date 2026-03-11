'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

function fmt(n: string | number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n));
}
function fmtN(n: string | number | null | undefined, dp = 1) {
  if (n == null) return '—';
  return Number(n).toFixed(dp);
}

interface KpiData {
  purchaseOrders: { total: number; active: number; totalValue: string };
  requisitions:   { total: number };
  invoices:       { total: number; paid: string; pending: string };
  budgets:        { totalBudget: string };
}
interface VendorRow   { vendorId: string; vendorName: string; total: string; invoiceCount: number }
interface DeptRow     { department: string; total: string; poCount: number }
interface MonthRow    { month: string; total: string; invoiceCount: number }
interface AgingRow    { bucket: string; count: number; total: string }
interface CycleRow    { avgDays: string | null; minDays: string | null; maxDays: string | null; poCount: number }

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem',
};
const sectionTitle: React.CSSProperties = {
  fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: '0 0 1rem',
};

export default function AnalyticsPage() {
  const [kpis,    setKpis]    = useState<KpiData | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [depts,   setDepts]   = useState<DeptRow[]>([]);
  const [monthly, setMonthly] = useState<MonthRow[]>([]);
  const [aging,   setAging]   = useState<AgingRow[]>([]);
  const [cycle,   setCycle]   = useState<CycleRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchJson<KpiData>('/analytics/kpis'),
      fetchJson<VendorRow[]>('/analytics/spend/by-vendor'),
      fetchJson<DeptRow[]>('/analytics/spend/by-department'),
      fetchJson<MonthRow[]>('/analytics/spend/monthly'),
      fetchJson<AgingRow[]>('/analytics/invoice-aging'),
      fetchJson<CycleRow>('/analytics/po-cycle-time'),
    ])
      .then(([k, v, d, m, a, c]) => {
        setKpis(k); setVendors(v); setDepts(d); setMonthly(m); setAging(a); setCycle(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>Loading analytics…</div>
    );
  }

  const maxVendor  = Math.max(...vendors.map((v) => Number(v.total)), 1);
  const maxDept    = Math.max(...depts.map((d) => Number(d.total)), 1);
  const maxMonthly = Math.max(...monthly.map((m) => Number(m.total)), 1);
  const totalAging = aging.reduce((s, r) => s + Number(r.total), 0) || 1;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Analytics</h1>
        <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Spend intelligence and operational metrics</p>
      </div>

      {/* KPI tiles */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiTile label="Active POs" value={String(kpis.purchaseOrders.active ?? 0)} sub={`${kpis.purchaseOrders.total} total`} />
          <KpiTile label="PO Spend" value={fmt(kpis.purchaseOrders.totalValue)} sub="all time" />
          <KpiTile label="Invoices Paid" value={fmt(kpis.invoices.paid)} sub={`${fmt(kpis.invoices.pending)} pending`} />
          <KpiTile label="Budget (active)" value={fmt(kpis.budgets.totalBudget)} sub={`${kpis.requisitions.total} active reqs`} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Spend by vendor */}
        <div style={card}>
          <h2 style={sectionTitle}>Spend by Vendor</h2>
          {vendors.length === 0 ? (
            <Empty text="No approved invoices yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {vendors.map((v) => (
                <BarRow
                  key={v.vendorId}
                  label={v.vendorName}
                  value={fmt(v.total)}
                  pct={(Number(v.total) / maxVendor) * 100}
                  sub={`${v.invoiceCount} invoice${v.invoiceCount !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Spend by department */}
        <div style={card}>
          <h2 style={sectionTitle}>Spend by Department</h2>
          {depts.length === 0 ? (
            <Empty text="No active purchase orders yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {depts.map((d) => (
                <BarRow
                  key={d.department}
                  label={d.department}
                  value={fmt(d.total)}
                  pct={(Number(d.total) / maxDept) * 100}
                  sub={`${d.poCount} PO${d.poCount !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly spend + invoice aging */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Monthly trend */}
        <div style={card}>
          <h2 style={sectionTitle}>Monthly Spend (Last 12 Months)</h2>
          {monthly.length === 0 ? (
            <Empty text="No approved invoices in past 12 months" />
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px' }}>
              {monthly.map((m) => {
                const pct = (Number(m.total) / maxMonthly) * 100;
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }} title={`${m.month}: ${fmt(m.total)}`}>
                    <div style={{ width: '100%', background: '#2563eb', borderRadius: '3px 3px 0 0', height: `${Math.max(pct, 2)}%`, transition: 'height 0.3s' }} />
                    <div style={{ fontSize: '0.6rem', color: '#6b7280', marginTop: '4px', textAlign: 'center', writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '36px', overflow: 'hidden' }}>{m.month.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoice aging */}
        <div style={card}>
          <h2 style={sectionTitle}>Invoice Aging</h2>
          {aging.length === 0 ? (
            <Empty text="No outstanding invoices" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {aging.map((a) => {
                const pct = (Number(a.total) / totalAging) * 100;
                const color = a.bucket === '0-30 days' ? '#10b981' : a.bucket === '31-60 days' ? '#f59e0b' : a.bucket === '61-90 days' ? '#f97316' : '#ef4444';
                return (
                  <div key={a.bucket}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span style={{ color: '#374151', fontWeight: 500 }}>{a.bucket}</span>
                      <span style={{ color: '#6b7280' }}>{fmt(a.total)} ({a.count})</span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '8px' }}>
                      <div style={{ background: color, width: `${pct}%`, height: '100%', borderRadius: '4px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PO cycle time */}
      {cycle && (
        <div style={card}>
          <h2 style={sectionTitle}>PO Cycle Time (Draft → Issued)</h2>
          {!cycle.avgDays ? (
            <Empty text="No issued purchase orders yet" />
          ) : (
            <div style={{ display: 'flex', gap: '2.5rem' }}>
              <Stat label="Average" value={`${fmtN(cycle.avgDays)} days`} />
              <Stat label="Fastest" value={`${fmtN(cycle.minDays)} days`} />
              <Stat label="Slowest" value={`${fmtN(cycle.maxDays)} days`} />
              <Stat label="Sample Size" value={`${cycle.poCount} POs`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.25rem' }}>{sub}</div>
    </div>
  );
}

function BarRow({ label, value, pct, sub }: { label: string; value: string; pct: number; sub: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
        <span style={{ color: '#111827', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{label}</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>{value} <span style={{ color: '#9ca3af', fontWeight: 400 }}>· {sub}</span></span>
      </div>
      <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px' }}>
        <div style={{ background: '#2563eb', width: `${Math.max(pct, 2)}%`, height: '100%', borderRadius: '4px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0, padding: '1rem 0' }}>{text}</p>;
}
