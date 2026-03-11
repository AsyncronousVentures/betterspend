'use client';

import { useState } from 'react';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

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
      const res = await api.auth.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
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
    color: active ? COLORS.textPrimary : COLORS.textSecondary, cursor: 'pointer', background: 'none', border: 'none',
    borderBottom: `2px solid ${active ? COLORS.accentBlue : 'transparent'}`,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.inputBorder}`,
    borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '1.5rem' }}>Settings</h1>

      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: '1.5rem' }}>
        <button style={tabStyle(activeTab === 'org')} onClick={() => setActiveTab('org')}>Organization</button>
        <button style={tabStyle(activeTab === 'password')} onClick={() => setActiveTab('password')}>Change Password</button>
      </div>

      {activeTab === 'org' && (
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '1.5rem', boxShadow: SHADOWS.card }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>Organization Info</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <InfoRow label="Organization ID" value="00000000-0000-0000-0000-000000000001" mono />
            <InfoRow label="Demo Org" value="Acme Corp (Demo)" />
            <InfoRow label="API Base" value={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'} mono />
            <InfoRow label="Version" value="BetterSpend v1.0.0-beta" />
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef9c3', borderRadius: '6px', border: '1px solid #fde68a' }}>
            <p style={{ fontSize: '0.85rem', color: COLORS.accentAmberDark, margin: 0 }}>
              <strong>Demo Mode:</strong> This instance uses the demo organization. Multi-org onboarding is available in Phase 7.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '1.5rem', boxShadow: SHADOWS.card }}>
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
              <div style={{ background: COLORS.accentRedLight, border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem', color: COLORS.accentRedDark, fontSize: '0.875rem' }}>{pwError}</div>
            )}
            {pwMsg && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.75rem', color: '#15803d', fontSize: '0.875rem' }}>{pwMsg}</div>
            )}
            <button type="submit" disabled={pwSaving} style={{ padding: '0.625rem', background: COLORS.accentBlue, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${COLORS.contentBg}` }}>
      <span style={{ fontSize: '0.875rem', color: COLORS.textSecondary }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: COLORS.textPrimary, fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
    </div>
  );
}
