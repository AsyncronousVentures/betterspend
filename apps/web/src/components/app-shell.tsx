'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import SidebarNav from './sidebar-nav';
import { api } from '../lib/api';
import { COLORS, SHADOWS } from '../lib/theme';
import { useIsMobile } from '../lib/use-media-query';
import { useBranding } from '../lib/branding';

const AUTH_PATHS = ['/login', '/signup', '/punchout'];

const TYPE_LABELS: Record<string, string> = {
  requisition: 'Req',
  purchase_order: 'PO',
  invoice: 'Inv',
  vendor: 'Vendor',
  catalog_item: 'Catalog',
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  requisition: { bg: COLORS.accentBlueLight, text: COLORS.accentBlueDark },
  purchase_order: { bg: COLORS.accentGreenLight, text: COLORS.accentGreenDark },
  invoice: { bg: COLORS.accentAmberLight, text: COLORS.accentAmberDark },
  vendor: { bg: COLORS.accentPurpleLight, text: COLORS.accentPurpleDark },
  catalog_item: { bg: '#f0f9ff', text: '#0369a1' },
};

/* ── Hamburger Icon ── */

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke={COLORS.textSecondary} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Close Icon ── */

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke={COLORS.sidebarText} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Global Search ── */

function GlobalSearch({ isMobile }: { isMobile: boolean }) {
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
    <div ref={containerRef} style={{ position: 'relative', width: isMobile ? '100%' : '360px' }}>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); if (e.target.value.length >= 2) setOpen(true); }}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder="Search requisitions, POs, invoices..."
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          border: `1px solid ${COLORS.border}`,
          borderRadius: '8px',
          fontSize: '0.8125rem',
          background: COLORS.contentBg,
          color: COLORS.textPrimary,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocusCapture={(e) => {
          (e.currentTarget as HTMLInputElement).style.borderColor = COLORS.accentBlue;
          (e.currentTarget as HTMLInputElement).style.boxShadow = SHADOWS.focusRing;
        }}
        onBlurCapture={(e) => {
          (e.currentTarget as HTMLInputElement).style.borderColor = COLORS.border;
          (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
        }}
      />
      {loading && (
        <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted, fontSize: '0.75rem' }}>...</div>
      )}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '10px',
          boxShadow: SHADOWS.dropdown,
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {results.map((r) => {
            const tc = TYPE_COLORS[r._type] ?? { bg: COLORS.contentBg, text: COLORS.textSecondary };
            return (
              <button
                key={`${r._type}-${r.id}`}
                onClick={() => navigate(r._href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderBottom: `1px solid ${COLORS.contentBg}`,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <span style={{
                  background: tc.bg,
                  color: tc.text,
                  padding: '0.125rem 0.4rem',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  minWidth: '40px',
                  textAlign: 'center',
                }}>
                  {TYPE_LABELS[r._type] ?? r._type}
                </span>
                <span style={{
                  fontSize: '0.8125rem',
                  color: COLORS.textPrimary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {r._label}
                </span>
                {r.status && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: COLORS.textMuted, flexShrink: 0 }}>{r.status}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── AppShell ── */

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const branding = useBranding();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  const SIDEBAR_WIDTH = isMobile ? 280 : 240;

  const sidebar = (
    <aside
      style={{
        width: `${SIDEBAR_WIDTH}px`,
        flexShrink: 0,
        background: COLORS.sidebarBg,
        color: COLORS.sidebarTextActive,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        ...(isMobile ? {
          position: 'fixed' as const,
          top: 0,
          left: 0,
          zIndex: 60,
        } : {
          position: 'sticky' as const,
          top: 0,
        }),
      }}
    >
      {/* Sidebar header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: `1px solid ${COLORS.sidebarBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        {branding.app_logo_url ? (
          <img src={branding.app_logo_url} alt={branding.app_name} style={{ maxHeight: '32px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <span style={{
            fontWeight: 700,
            fontSize: '1.0625rem',
            color: COLORS.sidebarTextActive,
            letterSpacing: '-0.02em',
          }}>
            {branding.app_name}
          </span>
        )}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>
        )}
      </div>
      <SidebarNav onClose={() => setSidebarOpen(false)} />
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.contentBg }}>
      {/* Desktop sidebar */}
      {!isMobile && sidebar}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: SHADOWS.overlay,
              zIndex: 50,
            }}
          />
          {sidebar}
        </>
      )}

      {/* Main content column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{
          background: COLORS.topbarBg,
          padding: isMobile ? '0.625rem 1rem' : '0.625rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: `1px solid ${COLORS.topbarBorder}`,
          flexShrink: 0,
          position: 'sticky' as const,
          top: 0,
          zIndex: 40,
        }}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              aria-label="Open sidebar"
            >
              <HamburgerIcon />
            </button>
          )}
          <GlobalSearch isMobile={isMobile} />
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflowX: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
