import { Suspense } from 'react';

export default function PunchoutCatalogLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div style={{ padding: '2rem', color: '#6b7280', textAlign: 'center' }}>Loading…</div>}>{children}</Suspense>;
}
