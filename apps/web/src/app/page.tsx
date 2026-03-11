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

export default function HomePage() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.kpis()
      .then(setKpis)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const po = kpis?.purchaseOrders;
  const inv = kpis?.invoices;
  const req = kpis?.requisitions;
  const bud = kpis?.budgets;

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
            <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem', height: '100px', animation: 'pulse 1.5s ease-in-out infinite' }} />
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
