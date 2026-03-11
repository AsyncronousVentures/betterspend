'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  ok:            { background: COLORS.accentGreenLight, color: COLORS.accentGreenDark },
  low_stock:     { background: COLORS.accentAmberLight, color: COLORS.accentAmberDark },
  out_of_stock:  { background: COLORS.accentRedLight, color: COLORS.accentRedDark },
};

const STATUS_LABELS: Record<string, string> = {
  ok:            'OK',
  low_stock:     'Low Stock',
  out_of_stock:  'Out of Stock',
};

function fmtQty(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

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

function InventoryPageInner() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('lowStockOnly') === 'true');

  useEffect(() => {
    setLoading(true);
    api.inventory.list({ lowStockOnly })
      .then(setItems)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [lowStockOnly]);

  const filtered = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.sku?.toLowerCase().includes(q) ||
      item.name?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q)
    );
  });

  const lowStockCount = items.filter((i) => i.stockStatus === 'low_stock' || i.stockStatus === 'out_of_stock').length;

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: COLORS.textPrimary }}>Inventory</h1>
          <p style={{ margin: '0.25rem 0 0', color: COLORS.textSecondary, fontSize: '0.875rem' }}>
            Track stock levels, movements, and reorder points
          </p>
        </div>
        <Link
          href="/inventory/new"
          style={{ padding: '0.5rem 1rem', background: COLORS.accentBlue, color: COLORS.white, borderRadius: '6px', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}
        >
          + New Item
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: COLORS.accentRedLight, border: `1px solid #fecaca`, borderRadius: '6px', padding: '0.75rem 1rem', color: COLORS.accentRedDark, fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.accentRedDark, fontWeight: 700, fontSize: '1rem', lineHeight: 1, padding: 0 }}>x</button>
        </div>
      )}

      {/* Low stock alert banner */}
      {!lowStockOnly && !loading && lowStockCount > 0 && (
        <div style={{ background: COLORS.accentAmberLight, border: `1px solid ${COLORS.accentAmber}`, borderRadius: '6px', padding: '0.75rem 1rem', color: COLORS.accentAmberDark, fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <strong>Warning:</strong> {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} below reorder point.{' '}
            <button onClick={() => setLowStockOnly(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.accentAmberDark, textDecoration: 'underline', fontSize: '0.875rem', padding: 0 }}>
              Show low-stock only
            </button>
          </span>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search SKU, name, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            border: `1px solid ${COLORS.inputBorder}`,
            borderRadius: '6px',
            fontSize: '0.875rem',
            outline: 'none',
            maxWidth: '360px',
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: COLORS.textSecondary, cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Low stock only
        </label>
      </div>

      {/* Table */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.tableBorder}`, borderRadius: '8px', overflow: 'hidden', boxShadow: SHADOWS.card }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: COLORS.textMuted }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: COLORS.textMuted }}>
            <p style={{ fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.5rem' }}>
              {items.length === 0 ? 'No inventory items yet' : 'No items match your search'}
            </p>
            {items.length === 0 && (
              <Link href="/inventory/new" style={{ color: COLORS.accentBlue, textDecoration: 'none', fontSize: '0.875rem' }}>
                Create your first inventory item
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.tableBorder}`, background: COLORS.tableHeaderBg }}>
                  <th style={thStyle}>SKU</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Unit</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>On Hand</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Reserved</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Available</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Reorder Point</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const isLowStock = item.stockStatus === 'low_stock' || item.stockStatus === 'out_of_stock';
                  const ss = STATUS_STYLES[item.stockStatus] ?? STATUS_STYLES.ok;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: idx < filtered.length - 1 ? `1px solid ${COLORS.contentBg}` : undefined,
                        cursor: 'pointer',
                        background: isLowStock ? 'rgba(245,158,11,0.04)' : undefined,
                      }}
                      onClick={() => (window.location.href = `/inventory/${item.id}`)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isLowStock ? 'rgba(245,158,11,0.08)' : COLORS.hoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isLowStock ? 'rgba(245,158,11,0.04)' : '')}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: COLORS.accentBlueDark, fontWeight: 600 }}>
                        {item.sku}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: COLORS.textPrimary, maxWidth: '240px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>
                        {item.unit ?? 'each'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: COLORS.textPrimary, fontWeight: 500 }}>
                        {fmtQty(item.quantityOnHand)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: COLORS.textSecondary }}>
                        {fmtQty(item.quantityReserved)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: COLORS.textPrimary }}>
                        {fmtQty(item.quantityAvailable)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: COLORS.textSecondary }}>
                        {item.reorderPoint != null ? fmtQty(item.reorderPoint) : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary, maxWidth: '160px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.location ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ ...ss, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
                          {STATUS_LABELS[item.stockStatus] ?? item.stockStatus}
                        </span>
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

export default function InventoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: COLORS.textMuted }}>Loading...</div>}>
      <InventoryPageInner />
    </Suspense>
  );
}
