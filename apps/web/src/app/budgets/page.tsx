import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

interface Budget {
  id: string;
  name: string;
  fiscalYear: number;
  totalAmount: string | number;
  spentAmount: string | number;
  currency: string;
  budgetType: string;
  scopeId: string | null;
}

interface ApiResponse {
  data: Budget[];
  total?: number;
}

const BUDGET_TYPE_LABELS: Record<string, string> = {
  department:  'Department',
  project:     'Project',
  gl_account:  'GL Account',
};

function formatCurrency(amount: string | number | null, currency = 'USD') {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  return (
    <div style={{ width: '100%', background: '#e5e7eb', borderRadius: 4, height: 8 }}>
      <div
        style={{
          width: `${clamped}%`,
          background: pct > 90 ? '#ef4444' : '#22c55e',
          height: 8,
          borderRadius: 4,
        }}
      />
    </div>
  );
}

async function getBudgets(): Promise<Budget[]> {
  try {
    const res = await fetch(`${API_URL}/budgets`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json: ApiResponse | Budget[] = await res.json();
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch {
    return [];
  }
}

export default async function BudgetsPage() {
  const budgets = await getBudgets();

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            Budgets
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Track department, project, and GL account budgets
          </p>
        </div>
        <Link
          href="/budgets/new"
          style={{
            background: '#111827',
            color: '#fff',
            padding: '0.5rem 1.25rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          + New Budget
        </Link>
      </div>

      {/* Table card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {budgets.length === 0 ? (
          <div
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              color: '#9ca3af',
            }}
          >
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#6b7280', fontWeight: 500 }}>
              No budgets yet
            </p>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              Create your first budget to start tracking spend.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Name', 'Fiscal Year', 'Total Budget', 'Spent', 'Remaining', '% Used', 'Type'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
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
                  <tr
                    key={budget.id}
                    style={{
                      borderBottom: idx < budgets.length - 1 ? '1px solid #f3f4f6' : undefined,
                    }}
                  >
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#111827' }}>
                      {budget.name}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                      {budget.fiscalYear}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(budget.totalAmount, currency)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(budget.spentAmount, currency)}
                    </td>
                    <td
                      style={{
                        padding: '0.875rem 1rem',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        color: isOverBudget ? '#dc2626' : '#374151',
                      }}
                    >
                      {formatCurrency(remaining, currency)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <ProgressBar pct={pct} />
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontVariantNumeric: 'tabular-nums',
                            fontWeight: 600,
                            color: isOverBudget ? '#dc2626' : '#6b7280',
                            minWidth: '2.5rem',
                            textAlign: 'right',
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>
                      {BUDGET_TYPE_LABELS[budget.budgetType] ?? budget.budgetType}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
