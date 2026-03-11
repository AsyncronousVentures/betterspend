'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '../../lib/auth-client';
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordReset = searchParams.get('reset') === '1';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (!result.token) {
        setError(result.message || result.error || 'Invalid email or password');
      } else {
        const next = searchParams.get('next') || '/';
        router.push(next);
        router.refresh();
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = COLORS.inputBorderFocus;
    e.target.style.boxShadow = SHADOWS.focusRing;
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = COLORS.inputBorder;
    e.target.style.boxShadow = 'none';
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
        {/* Logo */}
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
            Sign in to your account
          </div>
        </div>

        {passwordReset && (
          <div style={{
            background: COLORS.accentGreenLight,
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '0.625rem 0.875rem',
            color: COLORS.accentGreenDark,
            fontSize: '0.8125rem',
            marginBottom: '1rem',
            textAlign: 'center',
          }}>
            Password reset successful. Please sign in with your new password.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.375rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: COLORS.textSecondary }}>
                Password
              </label>
              <Link href="/forgot-password" style={{ fontSize: '0.75rem', color: COLORS.accentBlue, textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: COLORS.textMuted, marginTop: '1.5rem' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: COLORS.accentBlue, textDecoration: 'none', fontWeight: 500 }}>
            Sign up
          </Link>
        </p>
      </div>

      {/* Credit */}
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
