import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AppShell from '../components/app-shell';
import { ToastProvider } from '../components/toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

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
    <html lang="en" className={inter.className}>
      <body>
        <ToastProvider>
          <AppShell>
            {children}
          </AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
