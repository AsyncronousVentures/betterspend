import type { Metadata } from 'next';
import SidebarNav from '../components/sidebar-nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'BetterSpend',
  description: 'Open Source Purchase Order Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar */}
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

          {/* Main content */}
          <main style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
