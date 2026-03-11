'use client';

import { useState, FormEvent } from 'react';
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);
    try {
      await api.passwordReset.request(email);
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
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
            Reset your password
          </div>
        </div>

        {submitted ? (
          <div>
            <div style={{
              background: COLORS.accentGreenLight,
              border: `1px solid #bbf7d0`,
              borderRadius: '8px',
              padding: '1rem',
              color: COLORS.accentGreenDark,
              fontSize: '0.8125rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
            }}>
              If an account exists for <strong>{email}</strong>, a password reset link has been sent. Please check your inbox.
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: COLORS.textMuted }}>
              <Link href="/login" style={{ color: COLORS.accentBlue, textDecoration: 'none', fontWeight: 500 }}>
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.8125rem', color: COLORS.textSecondary, marginBottom: '1.25rem' }}>
              Enter your email address and we will send you a link to reset your password.
            </p>

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
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: COLORS.textMuted, marginTop: '1.5rem' }}>
              <Link href="/login" style={{ color: COLORS.accentBlue, textDecoration: 'none', fontWeight: 500 }}>
                Back to sign in
              </Link>
            </p>
          </>
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
