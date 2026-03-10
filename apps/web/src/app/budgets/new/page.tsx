'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

const CURRENT_YEAR = new Date().getFullYear();

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fff',
  color: '#111827',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '0.375rem',
};

export default function NewBudgetPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [fiscalYear, setFiscalYear] = useState(String(CURRENT_YEAR));
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [budgetType, setBudgetType] = useState('department');
  const [scopeId, setScopeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Budget name is required.');
      return;
    }
    const parsedYear = parseInt(fiscalYear, 10);
    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      setError('Please enter a valid fiscal year (e.g. 2025).');
      return;
    }
    const parsedAmount = parseFloat(totalAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Please enter a valid total amount.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        fiscalYear: parsedYear,
        totalAmount: parsedAmount,
        currency: currency.trim().toUpperCase() || 'USD',
        budgetType,
      };
      if (scopeId.trim()) {
        payload.scopeId = scopeId.trim();
      }

      const res = await fetch(`${API_URL}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error((err as { message?: string }).message || `HTTP ${res.status}`);
      }

      router.push('/budgets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '640px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/budgets"
          style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}
        >
          &larr; Back to Budgets
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0', color: '#111827' }}>
          New Budget
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.25rem',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1.25rem', color: '#111827' }}>
            Budget Details
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>
                Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering Q1 2025"
                style={inputStyle}
                required
              />
            </div>

            {/* Fiscal Year + Total Amount */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>
                  Fiscal Year <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  min={2000}
                  max={2100}
                  step={1}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Total Amount <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  min={0}
                  step="any"
                  placeholder="0.00"
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            {/* Currency + Budget Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  maxLength={3}
                  placeholder="USD"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Budget Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={budgetType}
                  onChange={(e) => setBudgetType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="department">Department</option>
                  <option value="project">Project</option>
                  <option value="gl_account">GL Account</option>
                </select>
              </div>
            </div>

            {/* Scope ID */}
            <div>
              <label style={labelStyle}>Scope ID</label>
              <input
                type="text"
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                placeholder="Optional — department, project, or GL account UUID"
                style={inputStyle}
              />
              <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                Link this budget to a specific department, project, or GL account by its UUID.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              color: '#991b1b',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Saving...' : 'Create Budget'}
          </button>
          <Link
            href="/budgets"
            style={{
              background: '#fff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
