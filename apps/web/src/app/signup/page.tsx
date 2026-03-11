'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '../../lib/auth-client';
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

function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = COLORS.inputBorderFocus;
  e.target.style.boxShadow = SHADOWS.focusRing;
}

function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = COLORS.inputBorder;
  e.target.style.boxShadow = 'none';
}

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

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
      const result = await signUp(email, password, name);
      if (result.error || result.message?.toLowerCase().includes('already')) {
        setError(result.message || result.error || 'Sign-up failed');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Network error — please try again');
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
            Create your account
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'Full name', type: 'text', value: name, setter: setName, placeholder: 'Jane Smith' },
            { label: 'Email', type: 'email', value: email, setter: setEmail, placeholder: 'you@company.com' },
            { label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: '••••••••' },
            { label: 'Confirm password', type: 'password', value: confirm, setter: setConfirm, placeholder: '••••••••' },
          ].map(({ label, type, value, setter, placeholder }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.375rem' }}>
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                required
                placeholder={placeholder}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          ))}

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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: COLORS.textMuted, marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: COLORS.accentBlue, textDecoration: 'none', fontWeight: 500 }}>
            Sign in
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
