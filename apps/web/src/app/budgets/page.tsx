'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

const BUDGET_TYPE_LABELS: Record<string, string> = {
  department: 'Department', project: 'Project', gl_account: 'GL Account',
};

function formatCurrency(amount: string | number | null, currency = 'USD') {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  return (
    <div style={{ width: '100%', background: COLORS.tableBorder, borderRadius: 4, height: 8 }}>
      <div style={{ width: `${clamped}%`, background: pct > 90 ? COLORS.accentRed : COLORS.accentGreen, height: 8, borderRadius: 4 }} />
    </div>
  );
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.budgets.list().then(setBudgets).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: COLORS.textPrimary }}>Budgets</h1>
          <p style={{ margin: '0.25rem 0 0', color: COLORS.textSecondary, fontSize: '0.875rem' }}>Track department, project, and GL account budgets</p>
        </div>
        <Link href="/budgets/new" style={{ background: COLORS.accentBlue, color: COLORS.white, padding: '0.5rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
          + New Budget
        </Link>
      </div>

      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.tableBorder}`, borderRadius: '8px', overflow: 'hidden', boxShadow: SHADOWS.card }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: COLORS.textMuted }}>Loading...</div>
        ) : budgets.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: COLORS.textMuted }}>
            <p style={{ fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.5rem' }}>No budgets yet</p>
            <Link href="/budgets/new" style={{ color: COLORS.accentBlue, textDecoration: 'none', fontSize: '0.875rem' }}>Create your first budget →</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.tableBorder}`, background: COLORS.tableHeaderBg }}>
                  {['Name', 'Fiscal Year', 'Total Budget', 'Spent', 'Remaining', '% Used', 'Type'].map((col) => (
                    <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: COLORS.textSecondary, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget, idx) => {
                  const total = Number(budget.totalAmount) || 0;
                  const spent = Number(budget.spentAmount) || 0;
                  const remaining = total - spent;
                  const pct = total > 0 ? Math.round((spent / total) * 100) : 0;
                  const currency = budget.currency || 'USD';
                  const isOverBudget = pct > 90;
                  return (
                    <tr key={budget.id} style={{ borderBottom: idx < budgets.length - 1 ? `1px solid ${COLORS.contentBg}` : undefined }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                        <Link href={`/budgets/${budget.id}`} style={{ color: COLORS.accentBlueDark, textDecoration: 'none' }}>{budget.name}</Link>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>{budget.fiscalYear}</td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>{formatCurrency(budget.totalAmount, currency)}</td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>{formatCurrency(budget.spentAmount, currency)}</td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: isOverBudget ? COLORS.accentRedDark : COLORS.textSecondary }}>
                        {formatCurrency(remaining, currency)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', minWidth: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}><ProgressBar pct={pct} /></div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isOverBudget ? COLORS.accentRedDark : COLORS.textSecondary, minWidth: '2.5rem', textAlign: 'right' }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>{BUDGET_TYPE_LABELS[budget.budgetType] ?? budget.budgetType}</td>
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
