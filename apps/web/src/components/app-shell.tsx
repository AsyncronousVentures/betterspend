'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import SidebarNav from './sidebar-nav';
import { api } from '../lib/api';

const AUTH_PATHS = ['/login', '/signup', '/punchout'];

const TYPE_LABELS: Record<string, string> = {
  requisition: 'Req',
  purchase_order: 'PO',
  invoice: 'Inv',
  vendor: 'Vendor',
  catalog_item: 'Catalog',
};

const TYPE_COLORS: Record<string, string> = {
  requisition: '#dbeafe',
  purchase_order: '#d1fae5',
  invoice: '#fef9c3',
  vendor: '#ede9fe',
  catalog_item: '#f0f9ff',
};

function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      api.search.query(query)
        .then((data: any) => {
          const all: any[] = [
            ...data.requisitions,
            ...data.purchaseOrders,
            ...data.invoices,
            ...data.vendors,
            ...data.catalogItems,
          ];
          setResults(all.slice(0, 10));
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '320px' }}>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); if (e.target.value.length >= 2) setOpen(true); }}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder="Search requisitions, POs, invoices…"
        style={{
          width: '100%', padding: '0.4rem 0.75rem', border: '1px solid #374151',
          borderRadius: '6px', fontSize: '0.875rem', background: '#1f2937',
          color: '#f9fafb', outline: 'none', boxSizing: 'border-box',
        }}
      />
      {loading && (
        <div style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '0.75rem' }}>…</div>
      )}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden',
        }}>
          {results.map((r) => (
            <button
              key={`${r._type}-${r.id}`}
              onClick={() => navigate(r._href)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem', width: '100%',
                padding: '0.625rem 0.875rem', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #f3f4f6',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <span style={{
                background: TYPE_COLORS[r._type] ?? '#f3f4f6',
                padding: '0.1rem 0.4rem', borderRadius: '3px',
                fontSize: '0.7rem', fontWeight: 700, color: '#374151',
                minWidth: '38px', textAlign: 'center',
              }}>
                {TYPE_LABELS[r._type] ?? r._type}
              </span>
              <span style={{ fontSize: '0.875rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r._label}
              </span>
              {r.status && (
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#9ca3af', flexShrink: 0 }}>{r.status}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: '220px',
          flexShrink: 0,
          background: '#111827',
          color: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #1f2937',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#fff',
            letterSpacing: '-0.01em',
          }}
        >
          BetterSpend
        </div>
        <SidebarNav />
      </aside>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar with search */}
        <div style={{ background: '#1f2937', padding: '0.625rem 1.5rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid #374151', flexShrink: 0 }}>
          <GlobalSearch />
        </div>
        <main style={{ flex: 1, overflowX: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
