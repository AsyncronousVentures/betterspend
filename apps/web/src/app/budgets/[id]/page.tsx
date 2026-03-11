'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

function formatCurrency(amount: string | number | null, currency = 'USD') {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ width: '100%', background: '#e5e7eb', borderRadius: 4, height: 10 }}>
      <div style={{ width: `${clamped}%`, background: color, height: 10, borderRadius: 4, transition: 'width 0.3s' }} />
    </div>
  );
}

export default function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', totalAmount: '' });
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState('');
  const [addPeriodOpen, setAddPeriodOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState({ periodStart: '', periodEnd: '', allocatedAmount: '' });
  const [periodSaving, setPeriodSaving] = useState(false);

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid);
      api.budgets.get(pid)
        .then((data) => {
          setBudget(data);
          setEditForm({ name: data.name, totalAmount: String(data.totalAmount) });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.budgets.update(id, {
        name: editForm.name,
        totalAmount: parseFloat(editForm.totalAmount),
      });
      setBudget(updated);
      setEditing(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPeriod() {
    if (!periodForm.periodStart || !periodForm.periodEnd || !periodForm.allocatedAmount) return;
    setPeriodSaving(true);
    try {
      const updated = await api.budgets.addPeriod(id, {
        periodStart: periodForm.periodStart,
        periodEnd: periodForm.periodEnd,
        allocatedAmount: parseFloat(periodForm.allocatedAmount),
      });
      setBudget(updated);
      setAddPeriodOpen(false);
      setPeriodForm({ periodStart: '', periodEnd: '', allocatedAmount: '' });
    } catch (e: any) { alert(e.message); } finally { setPeriodSaving(false); }
  }

  async function handleRemovePeriod(periodId: string) {
    if (!confirm('Remove this period?')) return;
    try {
      const updated = await api.budgets.removePeriod(id, periodId);
      setBudget(updated);
    } catch (e: any) { alert(e.message); }
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>;
  if (!budget) return <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>Budget not found.</div>;

  const total = parseFloat(budget.totalAmount ?? '0');
  const spent = parseFloat(budget.spentAmount ?? '0');
  const remaining = total - spent;
  const pct = total > 0 ? (spent / total) * 100 : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <Link href="/budgets" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>
        &larr; Back to Budgets
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', margin: '1rem 0 1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>{budget.name}</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            {budget.budgetType?.replace('_', ' ')} · FY{budget.fiscalYear} · {budget.currency}
          </p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{ background: editing ? '#f3f4f6' : '#111827', color: editing ? '#374151' : '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {editing && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Edit Budget</h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Total Budget Amount</label>
              <input
                type="number" min="0" step="0.01"
                value={editForm.totalAmount}
                onChange={(e) => setEditForm((f) => ({ ...f, totalAmount: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ marginTop: '1rem', background: '#111827', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Budget', value: formatCurrency(total, budget.currency), color: '#111827' },
          { label: 'Spent', value: formatCurrency(spent, budget.currency), color: pct > 90 ? '#dc2626' : '#374151' },
          { label: 'Remaining', value: formatCurrency(remaining, budget.currency), color: remaining < 0 ? '#dc2626' : '#059669' },
        ].map((card) => (
          <div key={card.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Utilization bar */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Budget Utilization</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: pct > 90 ? '#dc2626' : '#111827' }}>{pct.toFixed(1)}%</span>
        </div>
        <ProgressBar pct={pct} />
      </div>

      {/* Budget periods */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827' }}>Budget Periods ({budget.periods?.length ?? 0})</h2>
          <button onClick={() => setAddPeriodOpen(!addPeriodOpen)}
            style={{ background: '#111827', color: '#fff', border: 'none', padding: '0.375rem 0.875rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
            {addPeriodOpen ? 'Cancel' : '+ Add Period'}
          </button>
        </div>

        {addPeriodOpen && (
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Period Start</label>
                <input type="date" value={periodForm.periodStart} onChange={(e) => setPeriodForm((f) => ({ ...f, periodStart: e.target.value }))}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Period End</label>
                <input type="date" value={periodForm.periodEnd} onChange={(e) => setPeriodForm((f) => ({ ...f, periodEnd: e.target.value }))}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Allocated Amount</label>
                <input type="number" min="0" step="0.01" value={periodForm.allocatedAmount} onChange={(e) => setPeriodForm((f) => ({ ...f, allocatedAmount: e.target.value }))}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={handleAddPeriod} disabled={periodSaving}
              style={{ marginTop: '0.75rem', background: '#059669', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500, cursor: periodSaving ? 'not-allowed' : 'pointer', opacity: periodSaving ? 0.7 : 1 }}>
              {periodSaving ? 'Adding…' : 'Add Period'}
            </button>
          </div>
        )}

        {budget.periods && budget.periods.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Period Start', 'Period End', 'Allocated', 'Spent', 'Remaining', 'Utilization', ''].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {budget.periods.map((period: any, idx: number) => {
                const alloc = parseFloat(period.allocatedAmount ?? period.amount ?? '0');
                const periodSpent = parseFloat(period.spentAmount ?? '0');
                const periodPct = alloc > 0 ? (periodSpent / alloc) * 100 : 0;
                return (
                  <tr key={period.id} style={{ borderBottom: idx < budget.periods.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{new Date(period.periodStart).toLocaleDateString()}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{new Date(period.periodEnd).toLocaleDateString()}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#111827', fontWeight: 600 }}>{formatCurrency(alloc, budget.currency)}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{formatCurrency(periodSpent, budget.currency)}</td>
                    <td style={{ padding: '0.875rem 1rem', color: alloc - periodSpent < 0 ? '#dc2626' : '#059669' }}>{formatCurrency(alloc - periodSpent, budget.currency)}</td>
                    <td style={{ padding: '0.875rem 1rem', minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 4, height: 6 }}>
                          <div style={{ width: `${Math.min(periodPct, 100)}%`, background: periodPct > 90 ? '#ef4444' : '#22c55e', height: 6, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: '36px' }}>{periodPct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <button onClick={() => handleRemovePeriod(period.id)}
                        style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
            No budget periods. Add one above.
          </div>
        )}
      </div>
    </div>
  );
}
