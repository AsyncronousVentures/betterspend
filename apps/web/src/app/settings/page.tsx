'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';
import { invalidateBrandingCache } from '../../lib/branding';

type Tab = 'org' | 'branding' | 'email' | 'password';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.inputBorder}`,
  borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: COLORS.textPrimary };
const card: React.CSSProperties = { background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '1.5rem', boxShadow: SHADOWS.card };

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('branding');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const [branding, setBranding] = useState({
    app_name: 'BetterSpend', app_logo_url: '', app_favicon_url: '',
    copyright_text: '© 2026 BetterSpend. Open source under MIT License.',
    support_email: '', primary_color: '#3b82f6', accent_color: '#0f172a', hide_powered_by: 'false',
  });
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingMsg, setBrandingMsg] = useState('');
  const [brandingError, setBrandingError] = useState('');

  const [smtp, setSmtp] = useState({
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '',
    smtp_from: 'noreply@betterspend.io', smtp_secure: 'false',
  });
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState('');
  const [smtpError, setSmtpError] = useState('');

  useEffect(() => {
    api.settings.getAll().then((all) => {
      setBranding((b) => ({ ...b, ...Object.fromEntries(Object.entries(all).filter(([k]) => Object.keys(b).includes(k))) }));
      setSmtp((s) => ({ ...s, ...Object.fromEntries(Object.entries(all).filter(([k]) => Object.keys(s).includes(k))) }));
    }).catch(() => {});
  }, []);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: active ? 600 : 400,
    color: active ? COLORS.textPrimary : COLORS.textSecondary, cursor: 'pointer', background: 'none', border: 'none',
    borderBottom: `2px solid ${active ? COLORS.accentBlue : 'transparent'}`,
  });

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault(); setPwError(''); setPwMsg('');
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('New passwords do not match'); return; }
    if (pwForm.newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    setPwSaving(true);
    try {
      const res = await api.auth.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      if (res.ok) { setPwMsg('Password changed successfully.'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
      else { const err = await res.json().catch(() => ({})); setPwError(err.message || 'Failed to change password'); }
    } catch (e: any) { setPwError(e.message); } finally { setPwSaving(false); }
  }

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault(); setBrandingError(''); setBrandingMsg(''); setBrandingSaving(true);
    try {
      await api.settings.updateBranding(branding);
      invalidateBrandingCache();
      setBrandingMsg('Branding settings saved. Reload the page to see changes in the sidebar.');
    } catch (e: any) { setBrandingError(e.message); } finally { setBrandingSaving(false); }
  }

  async function handleSaveSmtp(e: React.FormEvent) {
    e.preventDefault(); setSmtpError(''); setSmtpMsg(''); setSmtpSaving(true);
    try {
      await api.settings.updateSmtp(smtp);
      setSmtpMsg('SMTP settings saved.');
    } catch (e: any) { setSmtpError(e.message); } finally { setSmtpSaving(false); }
  }

  const successStyle: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.75rem', color: '#15803d', fontSize: '0.875rem', marginTop: '1rem' };
  const errorStyle: React.CSSProperties = { background: COLORS.accentRedLight, border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem', color: COLORS.accentRedDark, fontSize: '0.875rem', marginTop: '1rem' };
  const btnPrimary: React.CSSProperties = { padding: '0.625rem 1.25rem', background: COLORS.accentBlue, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' };

  return (
    <div style={{ padding: '2rem', maxWidth: '720px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '1.5rem' }}>Settings</h1>
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: '1.5rem' }}>
        {(['branding', 'email', 'org', 'password'] as Tab[]).map((t) => (
          <button key={t} style={tabStyle(activeTab === t)} onClick={() => setActiveTab(t)}>
            {t === 'branding' ? 'Branding' : t === 'email' ? 'Email / SMTP' : t === 'org' ? 'System Info' : 'Change Password'}
          </button>
        ))}
      </div>

      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding}>
          <div style={card}>
            <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem', color: COLORS.textPrimary }}>White-Label Branding</h2>
            <p style={{ fontSize: '0.8125rem', color: COLORS.textSecondary, marginBottom: '1.5rem', marginTop: '0.25rem' }}>
              Customize the app name, logo, colors, and footer. Perfect for agencies and enterprise deployments. Changes are reflected across all users.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Application Name</label>
                  <input style={inputStyle} value={branding.app_name} onChange={(e) => setBranding((b) => ({ ...b, app_name: e.target.value }))} placeholder="BetterSpend" />
                </div>
                <div>
                  <label style={labelStyle}>Support Email</label>
                  <input type="email" style={inputStyle} value={branding.support_email} onChange={(e) => setBranding((b) => ({ ...b, support_email: e.target.value }))} placeholder="support@yourcompany.com" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Logo URL <span style={{ fontWeight: 400, color: COLORS.textMuted }}>(shown in sidebar)</span></label>
                <input style={inputStyle} value={branding.app_logo_url} onChange={(e) => setBranding((b) => ({ ...b, app_logo_url: e.target.value }))} placeholder="https://example.com/logo.svg" />
                {branding.app_logo_url && <img src={branding.app_logo_url} alt="Logo preview" style={{ marginTop: '0.5rem', maxHeight: '40px', borderRadius: '4px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              </div>
              <div>
                <label style={labelStyle}>Copyright / Footer Text</label>
                <input style={inputStyle} value={branding.copyright_text} onChange={(e) => setBranding((b) => ({ ...b, copyright_text: e.target.value }))} placeholder="© 2026 Your Company. All rights reserved." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Primary Color <span style={{ fontWeight: 400, color: COLORS.textMuted }}>(buttons, links)</span></label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="color" value={branding.primary_color} onChange={(e) => setBranding((b) => ({ ...b, primary_color: e.target.value }))} style={{ width: '40px', height: '36px', padding: '2px', border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px', cursor: 'pointer' }} />
                    <input style={{ ...inputStyle, flex: 1 }} value={branding.primary_color} onChange={(e) => setBranding((b) => ({ ...b, primary_color: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Sidebar Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="color" value={branding.accent_color} onChange={(e) => setBranding((b) => ({ ...b, accent_color: e.target.value }))} style={{ width: '40px', height: '36px', padding: '2px', border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px', cursor: 'pointer' }} />
                    <input style={{ ...inputStyle, flex: 1 }} value={branding.accent_color} onChange={(e) => setBranding((b) => ({ ...b, accent_color: e.target.value }))} />
                  </div>
                </div>
              </div>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem', color: COLORS.textPrimary }}>
                <input type="checkbox" checked={branding.hide_powered_by === 'true'} onChange={(e) => setBranding((b) => ({ ...b, hide_powered_by: e.target.checked ? 'true' : 'false' }))} />
                Hide "Powered by BetterSpend" footer attribution
              </label>
            </div>
            {brandingError && <div style={errorStyle}>{brandingError}</div>}
            {brandingMsg && <div style={successStyle}>{brandingMsg}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="submit" disabled={brandingSaving} style={btnPrimary}>{brandingSaving ? 'Saving...' : 'Save Branding'}</button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'email' && (
        <form onSubmit={handleSaveSmtp}>
          <div style={card}>
            <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem', color: COLORS.textPrimary }}>Email / SMTP Configuration</h2>
            <p style={{ fontSize: '0.8125rem', color: COLORS.textSecondary, marginBottom: '1.5rem', marginTop: '0.25rem' }}>
              Configure SMTP to enable email notifications for approvals, PO issuance, invoice exceptions, and contract expiry alerts.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>SMTP Host</label>
                  <input style={inputStyle} value={smtp.smtp_host} onChange={(e) => setSmtp((s) => ({ ...s, smtp_host: e.target.value }))} placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <label style={labelStyle}>Port</label>
                  <input type="number" style={inputStyle} value={smtp.smtp_port} onChange={(e) => setSmtp((s) => ({ ...s, smtp_port: e.target.value }))} placeholder="587" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Username</label>
                  <input style={inputStyle} value={smtp.smtp_user} onChange={(e) => setSmtp((s) => ({ ...s, smtp_user: e.target.value }))} placeholder="user@example.com" />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <input type="password" style={inputStyle} value={smtp.smtp_pass} onChange={(e) => setSmtp((s) => ({ ...s, smtp_pass: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>From Address</label>
                <input type="email" style={inputStyle} value={smtp.smtp_from} onChange={(e) => setSmtp((s) => ({ ...s, smtp_from: e.target.value }))} placeholder="noreply@yourcompany.com" />
              </div>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem', color: COLORS.textPrimary }}>
                <input type="checkbox" checked={smtp.smtp_secure === 'true'} onChange={(e) => setSmtp((s) => ({ ...s, smtp_secure: e.target.checked ? 'true' : 'false' }))} />
                Use TLS/SSL (port 465)
              </label>
              <div style={{ padding: '0.75rem 1rem', background: COLORS.accentBlueLight, borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '0.8125rem', color: '#1e40af' }}>
                Notifications sent for: approval requests, PO issued, invoice match exceptions, and contract expiry alerts.
              </div>
            </div>
            {smtpError && <div style={errorStyle}>{smtpError}</div>}
            {smtpMsg && <div style={successStyle}>{smtpMsg}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="submit" disabled={smtpSaving} style={btnPrimary}>{smtpSaving ? 'Saving...' : 'Save SMTP Settings'}</button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'org' && (
        <div style={card}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', color: COLORS.textPrimary }}>System Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <InfoRow label="Organization ID" value="00000000-0000-0000-0000-000000000001" mono />
            <InfoRow label="Demo Organization" value="Acme Corp" />
            <InfoRow label="API Base URL" value={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'} mono />
            <InfoRow label="Version" value="BetterSpend v1.0.0-beta" />
            <InfoRow label="License" value="MIT License" />
            <InfoRow label="Source Code" value="github.com/AsyncronousVentures/betterspend" />
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef9c3', borderRadius: '6px', border: '1px solid #fde68a' }}>
            <p style={{ fontSize: '0.85rem', color: COLORS.accentAmberDark, margin: 0 }}>
              <strong>Open Source (MIT):</strong> BetterSpend is free to use, modify, and distribute. White-labeling is fully supported via the Branding tab.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div style={card}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', color: COLORS.textPrimary }}>Change Password</h2>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label style={labelStyle}>Current Password</label><input type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>New Password</label><input type="password" required value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Confirm New Password</label><input type="password" required value={pwForm.confirmPassword} onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))} style={inputStyle} /></div>
            {pwError && <div style={errorStyle}>{pwError}</div>}
            {pwMsg && <div style={successStyle}>{pwMsg}</div>}
            <button type="submit" disabled={pwSaving} style={btnPrimary}>{pwSaving ? 'Changing...' : 'Change Password'}</button>
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
