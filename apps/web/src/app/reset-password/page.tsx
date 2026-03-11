'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  border: `1px solid ${COLORS.inputBorder}`,
  borderRadius: '8px',
  fontSize: '0.8125rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  color: COLORS.textPrimary,
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = COLORS.inputBorderFocus;
    e.target.style.boxShadow = SHADOWS.focusRing;
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = COLORS.inputBorder;
    e.target.style.boxShadow = 'none';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing reset token. Please use the link from your email.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.passwordReset.reset(token, password);
      router.push('/login?reset=1');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please request a new reset link.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: COLORS.contentBg,
      padding: '1rem',
    }}>
      <div style={{
        background: COLORS.white,
        borderRadius: '12px',
        padding: '2.5rem',
        boxShadow: SHADOWS.auth,
        width: '100%',
        maxWidth: '400px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontWeight: 700,
            fontSize: '1.625rem',
            color: COLORS.textPrimary,
            letterSpacing: '-0.03em',
          }}>
            BetterSpend
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: '0.8125rem', marginTop: '0.375rem' }}>
            Set a new password
          </div>
        </div>

        {!token ? (
          <div>
            <div style={{
              background: COLORS.accentRedLight,
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '0.625rem 0.875rem',
              color: '#dc2626',
              fontSize: '0.8125rem',
              marginBottom: '1.5rem',
            }}>
              Invalid reset link. Please request a new one.
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: COLORS.textMuted }}>
              <Link href="/forgot-password" style={{ color: COLORS.accentBlue, textDecoration: 'none', fontWeight: 500 }}>
                Request new reset link
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.375rem' }}>
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.375rem' }}>
                Confirm new password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div style={{
                background: COLORS.accentRedLight,
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '0.625rem 0.875rem',
                color: '#dc2626',
                fontSize: '0.8125rem',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#93c5fd' : COLORS.accentBlue,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6875rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                marginTop: '0.375rem',
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = COLORS.accentBlueDark); }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = COLORS.accentBlue); }}
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
              <Link href="/login" style={{ color: COLORS.accentBlue, textDecoration: 'none', fontWeight: 500 }}>
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>

      <div style={{
        marginTop: '1.5rem',
        fontSize: '0.6875rem',
        color: COLORS.textMuted,
        textAlign: 'center',
      }}>
        Open Source Procure-to-Pay by Asynchronous Ventures LLC
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
