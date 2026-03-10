'use client';

import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Requisitions', href: '/requisitions' },
  { label: 'Purchase Orders', href: '/purchase-orders' },
  { label: 'Approvals', href: '/approvals' },
  { label: 'Vendors', href: '/vendors' },
  { label: 'Receiving', href: '/receiving' },
  { label: 'Invoices', href: '/invoices' },
  { label: 'Budgets', href: '/budgets' },
];

export default function SidebarNav() {
  return (
    <nav style={{ flex: 1, padding: '0.75rem 0' }}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display: 'block',
            padding: '0.625rem 1.5rem',
            color: '#d1d5db',
            textDecoration: 'none',
            fontSize: '0.9rem',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = '#1f2937';
            (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
            (e.currentTarget as HTMLAnchorElement).style.color = '#d1d5db';
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
