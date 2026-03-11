'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  return document.cookie.split('; ').find((r) => r.startsWith(name + '='))?.split('=')[1];
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'org' | 'password'>('org');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwMsg('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    setPwSaving(true);
    try {
      const token = getCookie('bs_token');
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      if (res.ok) {
        setPwMsg('Password changed successfully.');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const err = await res.json().catch(() => ({}));
        setPwError(err.message || 'Failed to change password');
      }
    } catch (e: any) {
      setPwError(e.message);
    } finally {
      setPwSaving(false);
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: active ? 600 : 400,
    color: active ? '#111827' : '#6b7280', cursor: 'pointer', background: 'none', border: 'none',
    borderBottom: `2px solid ${active ? '#3b82f6' : 'transparent'}`,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>Settings</h1>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
        <button style={tabStyle(activeTab === 'org')} onClick={() => setActiveTab('org')}>Organization</button>
        <button style={tabStyle(activeTab === 'password')} onClick={() => setActiveTab('password')}>Change Password</button>
      </div>

      {activeTab === 'org' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>Organization Info</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <InfoRow label="Organization ID" value="00000000-0000-0000-0000-000000000001" mono />
            <InfoRow label="Demo Org" value="Acme Corp (Demo)" />
            <InfoRow label="API Base" value={API_BASE} mono />
            <InfoRow label="Version" value="BetterSpend v1.0.0-beta" />
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef9c3', borderRadius: '6px', border: '1px solid #fde68a' }}>
            <p style={{ fontSize: '0.85rem', color: '#92400e', margin: 0 }}>
              <strong>Demo Mode:</strong> This instance uses the demo organization. Multi-org onboarding is available in Phase 7.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>Change Password</h2>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Current Password</label>
              <input type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>New Password</label>
              <input type="password" required value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Confirm New Password</label>
              <input type="password" required value={pwForm.confirmPassword} onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))} style={inputStyle} />
            </div>
            {pwError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem', color: '#dc2626', fontSize: '0.875rem' }}>{pwError}</div>
            )}
            {pwMsg && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.75rem', color: '#15803d', fontSize: '0.875rem' }}>{pwMsg}</div>
            )}
            <button type="submit" disabled={pwSaving} style={{ padding: '0.625rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: '#111827', fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
    </div>
  );
}
