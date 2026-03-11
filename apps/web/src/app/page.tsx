'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';

function fmt(n: string | number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n));
}

function KpiCard({ label, value, sub, href, color = '#3b82f6' }: { label: string; value: string; sub?: string; href?: string; color?: string }) {
  const inner = (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem', textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.375rem' }}>{sub}</div>}
      {href && <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: color, fontWeight: 500 }}>View →</div>}
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

function ActionItem({ label, count, href, urgent }: { label: string; count: number; href: string; urgent?: boolean }) {
  if (count === 0) return null;
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
      }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ fontSize: '0.875rem', color: '#374151' }}>{label}</span>
        <span style={{
          background: urgent ? '#fee2e2' : '#fef3c7',
          color: urgent ? '#991b1b' : '#92400e',
          padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
        }}>{count}</span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [kpis, setKpis] = useState<any>(null);
  const [pending, setPending] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.analytics.kpis(),
      api.analytics.pendingItems(),
      api.analytics.recentActivity(),
    ]).then(([k, p, a]) => {
      setKpis(k);
      setPending(p);
      setActivity(Array.isArray(a) ? a : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const po = kpis?.purchaseOrders;
  const inv = kpis?.invoices;
  const req = kpis?.requisitions;
  const bud = kpis?.budgets;

  const totalActions = pending
    ? (pending.pendingApprovals ?? 0) + (pending.invoiceExceptions ?? 0)
    : 0;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Welcome to BetterSpend — your P2P control center</p>
      </div>

      {/* KPI grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem', height: '100px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          <KpiCard label="Active POs" value={String(po?.active ?? 0)} sub={`${po?.total ?? 0} total · ${fmt(po?.totalValue)} committed`} href="/purchase-orders" />
          <KpiCard label="Open Requisitions" value={String(req?.total ?? 0)} sub="pending approval or in progress" href="/requisitions" color="#10b981" />
          <KpiCard label="Invoices Paid" value={fmt(inv?.paid)} sub={`${fmt(inv?.pending)} still pending`} href="/invoices" color="#f59e0b" />
          <KpiCard label="Annual Budget" value={fmt(bud?.totalBudget)} sub="all active budgets combined" href="/budgets" color="#8b5cf6" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Action items */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Action Required</h2>
            {totalActions > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>{totalActions}</span>
            )}
          </div>
          {!pending || totalActions === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              {loading ? 'Loading…' : 'All caught up!'}
            </div>
          ) : (
            <div>
              <ActionItem label="Pending Approvals" count={pending.pendingApprovals ?? 0} href="/approvals" />
              <ActionItem label="Invoice Exceptions" count={pending.invoiceExceptions ?? 0} href="/invoices" urgent />
              <ActionItem label="Requisitions Awaiting Approval" count={pending.requisitionsPendingApproval ?? 0} href="/requisitions" />
              <ActionItem label="POs Awaiting First Receipt" count={pending.posAwaitingReceipt ?? 0} href="/receiving" />
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Recent Activity</h2>
          </div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</div>
          ) : activity.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>No recent activity</div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: '280px' }}>
              {activity.slice(0, 12).map((item, i) => (
                <div key={item.id ?? i} style={{ padding: '0.625rem 1rem', borderBottom: '1px solid #f9fafb', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', marginTop: '0.4rem', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', color: '#374151' }}>
                      <span style={{ fontWeight: 600 }}>{item.userName ?? 'System'}</span>{' '}
                      <span style={{ color: '#6b7280' }}>{item.action}</span>{' '}
                      <span style={{ color: '#9ca3af', textTransform: 'capitalize' }}>{String(item.entityType ?? '').replace(/_/g, ' ')}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { label: '+ New Requisition', href: '/requisitions/new', bg: '#3b82f6' },
            { label: '+ New PO', href: '/purchase-orders/new', bg: '#10b981' },
            { label: '+ Receive Goods', href: '/receiving/new', bg: '#f59e0b' },
            { label: '+ New Invoice', href: '/invoices/new', bg: '#8b5cf6' },
            { label: '+ New Vendor', href: '/vendors/new', bg: '#6b7280' },
            { label: '+ New Budget', href: '/budgets/new', bg: '#374151' },
          ].map((a) => (
            <Link key={a.href} href={a.href} style={{ padding: '0.5rem 1rem', background: a.bg, color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Module overview */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>Modules</h2>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {[
            { title: 'Vendors', href: '/vendors', desc: 'Supplier master records & contracts' },
            { title: 'Catalog', href: '/catalog', desc: 'Pre-approved items for requisitions' },
            { title: 'Requisitions', href: '/requisitions', desc: 'Submit and track purchase requests' },
            { title: 'Purchase Orders', href: '/purchase-orders', desc: 'Issue and manage PO lifecycle' },
            { title: 'Approvals', href: '/approvals', desc: 'Pending items requiring your action' },
            { title: 'Receiving', href: '/receiving', desc: 'Log goods receipts (GRN)' },
            { title: 'Invoices', href: '/invoices', desc: 'AP and 3-way invoice matching' },
            { title: 'Budgets', href: '/budgets', desc: 'Department & project budgets' },
            { title: 'GL Integration', href: '/gl-mappings', desc: 'QuickBooks / Xero mapping' },
            { title: 'Analytics', href: '/analytics', desc: 'Spend intelligence & KPIs' },
            { title: 'Approval Rules', href: '/approval-rules', desc: 'Configure auto-routing rules' },
            { title: 'Webhooks', href: '/webhooks', desc: 'Outbound event integrations' },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={{ display: 'block', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{item.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
