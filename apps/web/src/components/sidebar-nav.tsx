'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '../lib/auth-client';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Requisitions', href: '/requisitions' },
  { label: 'Purchase Orders', href: '/purchase-orders' },
  { label: 'Approvals', href: '/approvals' },
  { label: 'Vendors', href: '/vendors' },
  { label: 'Catalog', href: '/catalog' },
  { label: 'Receiving', href: '/receiving' },
  { label: 'Invoices', href: '/invoices' },
  { label: 'OCR Jobs', href: '/ocr' },
  { label: 'Budgets', href: '/budgets' },
  { label: 'GL Integration', href: '/gl-mappings' },
  { label: 'Webhooks', href: '/webhooks' },
  { label: 'Approval Rules', href: '/approval-rules' },
  { label: 'Users', href: '/users' },
  { label: 'Departments', href: '/departments' },
  { label: 'Projects', href: '/projects' },
  { label: 'Reports', href: '/reports' },
  { label: 'Audit Log', href: '/audit' },
  { label: 'Settings', href: '/settings' },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <>
    <nav style={{ flex: 1, padding: '0.75rem 0' }}>
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'block',
              padding: '0.625rem 1.5rem',
              color: active ? '#fff' : '#d1d5db',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: active ? 600 : 400,
              background: active ? '#1f2937' : 'transparent',
              borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLAnchorElement).style.background = '#1f2937';
                (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                (e.currentTarget as HTMLAnchorElement).style.color = '#d1d5db';
              }
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>

    {/* Sign out */}
    <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1f2937' }}>
      <button
        onClick={handleSignOut}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          color: '#9ca3af', fontSize: '0.875rem', textAlign: 'left',
          padding: '0.5rem 0.5rem', cursor: 'pointer', borderRadius: '6px',
          transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#fff';
          (e.currentTarget as HTMLButtonElement).style.background = '#1f2937';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        Sign out
      </button>
    </div>
    </>
  );
}
