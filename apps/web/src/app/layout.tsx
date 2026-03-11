import type { Metadata } from 'next';
import AppShell from '../components/app-shell';
import { ToastProvider } from '../components/toast';
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
        <ToastProvider>
          <AppShell>
            {children}
          </AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
