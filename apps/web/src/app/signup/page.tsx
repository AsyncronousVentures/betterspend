'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '../../lib/auth-client';

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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.875rem',
    border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f9fafb',
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '2.5rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#111827', letterSpacing: '-0.02em' }}>
            BetterSpend
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.375rem' }}>
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                required
                placeholder={placeholder}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>
          ))}

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '0.625rem 0.875rem', color: '#dc2626', fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#93c5fd' : '#3b82f6',
              color: '#fff', border: 'none', borderRadius: '8px',
              padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s', marginTop: '0.5rem',
            }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
