'use client';

import { usePathname } from 'next/navigation';
import SidebarNav from './sidebar-nav';

const AUTH_PATHS = ['/login', '/signup', '/punchout'];

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
      <main style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
