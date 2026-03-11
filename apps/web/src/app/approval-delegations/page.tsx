'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { COLORS, SHADOWS, FONT } from '../../lib/theme';
// Note: StatusBadge uses raw hex strings to avoid TypeScript literal type narrowing from `as const`

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ active, startDate, endDate }: { active: boolean; startDate: string; endDate: string }) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  let label = 'Inactive';
  let bg = '#fffbeb';
  let color = '#92400e';

  if (active) {
    if (now >= start && now <= end) {
      label = 'Active';
      bg = '#ecfdf5';
      color = '#065f46';
    } else if (now < start) {
      label = 'Upcoming';
      bg = '#eff6ff';
      color = '#2563eb';
    } else {
      label = 'Expired';
      bg = '#fef2f2';
      color = '#991b1b';
    }
  }

  return (
    <span style={{
      background: bg,
      color,
      borderRadius: '9999px',
      fontSize: FONT.xs,
      fontWeight: 600,
      padding: '2px 10px',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

export default function ApprovalDelegationsPage() {
  const [myDelegations, setMyDelegations] = useState<any[]>([]);
  const [delegateForMe, setDelegateForMe] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    delegateeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const [myData, forMeData, usersData] = await Promise.all([
        api.approvalDelegations.my(),
        api.approvalDelegations.delegateForMe(),
        api.users.list(),
      ]);
      setMyDelegations(myData);
      setDelegateForMe(forMeData);
      setUsers(usersData);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.delegateeId || !form.startDate || !form.endDate) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.approvalDelegations.create({
        delegateeId: form.delegateeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || undefined,
      });
      setShowModal(false);
      setForm({ delegateeId: '', startDate: '', endDate: '', reason: '' });
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create delegation');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancel this delegation?')) return;
    try {
      await api.approvalDelegations.cancel(id);
      await load();
    } catch (e: any) {
      alert(e.message ?? 'Failed to cancel delegation');
    }
  }

  /* ── Shared table styles ── */
  const thStyle: React.CSSProperties = {
    padding: '0.625rem 0.875rem',
    textAlign: 'left',
    fontSize: FONT.xs,
    fontWeight: 600,
    color: COLORS.textSecondary,
    background: COLORS.tableHeaderBg,
    borderBottom: `1px solid ${COLORS.tableBorder}`,
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem 0.875rem',
    fontSize: FONT.sm,
    color: COLORS.textPrimary,
    borderBottom: `1px solid ${COLORS.tableBorder}`,
    verticalAlign: 'middle',
  };

  /* ── Modal ── */
  function renderModal() {
    if (!showModal) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: SHADOWS.overlay,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: COLORS.cardBg,
          borderRadius: '12px',
          padding: '1.75rem',
          width: '100%',
          maxWidth: '480px',
          boxShadow: SHADOWS.dropdown,
        }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: FONT.lg, fontWeight: 700, color: COLORS.textPrimary }}>
            New Delegation
          </h2>

          {error && (
            <div style={{
              background: COLORS.accentRedLight,
              color: COLORS.accentRedDark,
              borderRadius: '6px',
              padding: '0.625rem 0.875rem',
              fontSize: FONT.sm,
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <label style={{ display: 'block', marginBottom: '1rem' }}>
            <span style={{ display: 'block', fontSize: FONT.sm, fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.375rem' }}>
              Delegate To <span style={{ color: COLORS.accentRed }}>*</span>
            </span>
            <select
              value={form.delegateeId}
              onChange={(e) => setForm((f) => ({ ...f, delegateeId: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: `1px solid ${COLORS.inputBorder}`,
                borderRadius: '6px',
                fontSize: FONT.sm,
                color: COLORS.textPrimary,
                background: COLORS.white,
                outline: 'none',
              }}
            >
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <label>
              <span style={{ display: 'block', fontSize: FONT.sm, fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.375rem' }}>
                Start Date <span style={{ color: COLORS.accentRed }}>*</span>
              </span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.inputBorder}`,
                  borderRadius: '6px',
                  fontSize: FONT.sm,
                  color: COLORS.textPrimary,
                  background: COLORS.white,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </label>
            <label>
              <span style={{ display: 'block', fontSize: FONT.sm, fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.375rem' }}>
                End Date <span style={{ color: COLORS.accentRed }}>*</span>
              </span>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${COLORS.inputBorder}`,
                  borderRadius: '6px',
                  fontSize: FONT.sm,
                  color: COLORS.textPrimary,
                  background: COLORS.white,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </label>
          </div>

          <label style={{ display: 'block', marginBottom: '1.5rem' }}>
            <span style={{ display: 'block', fontSize: FONT.sm, fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.375rem' }}>
              Reason (optional)
            </span>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              rows={3}
              placeholder="e.g. Out of office — annual leave"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: `1px solid ${COLORS.inputBorder}`,
                borderRadius: '6px',
                fontSize: FONT.sm,
                color: COLORS.textPrimary,
                background: COLORS.white,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setShowModal(false); setError(''); }}
              style={{
                padding: '0.5rem 1.25rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                background: COLORS.white,
                color: COLORS.textSecondary,
                fontSize: FONT.sm,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{
                padding: '0.5rem 1.25rem',
                border: 'none',
                borderRadius: '6px',
                background: COLORS.accentBlue,
                color: COLORS.white,
                fontSize: FONT.sm,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Create Delegation'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── My Delegations table ── */
  function renderMyDelegations() {
    return (
      <div style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: '10px',
        boxShadow: SHADOWS.card,
        overflow: 'hidden',
        marginBottom: '2rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: FONT.md, fontWeight: 700, color: COLORS.textPrimary }}>
              My Delegations
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: FONT.sm, color: COLORS.textSecondary }}>
              Approval authority you have delegated to others
            </p>
          </div>
          <button
            onClick={() => { setShowModal(true); setError(''); }}
            style={{
              padding: '0.5rem 1.25rem',
              background: COLORS.accentBlue,
              color: COLORS.white,
              border: 'none',
              borderRadius: '6px',
              fontSize: FONT.sm,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + New Delegation
          </button>
        </div>

        {myDelegations.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: COLORS.textMuted, fontSize: FONT.sm }}>
            No delegations set up. Click "New Delegation" to delegate your approval authority.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Delegating To</th>
                  <th style={thStyle}>Start Date</th>
                  <th style={thStyle}>End Date</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {myDelegations.map((d) => (
                  <tr key={d.id} style={{ transition: 'background 0.1s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = COLORS.hoverBg; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{d.delegatee?.name ?? d.delegateeId}</div>
                      <div style={{ fontSize: FONT.xs, color: COLORS.textMuted }}>{d.delegatee?.email ?? ''}</div>
                    </td>
                    <td style={tdStyle}>{formatDate(d.startDate)}</td>
                    <td style={tdStyle}>{formatDate(d.endDate)}</td>
                    <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.reason ?? <span style={{ color: COLORS.textMuted }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge active={d.active} startDate={d.startDate} endDate={d.endDate} />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {d.active && (
                        <button
                          onClick={() => handleCancel(d.id)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: 'transparent',
                            border: `1px solid ${COLORS.accentRed}`,
                            borderRadius: '5px',
                            color: COLORS.accentRed,
                            fontSize: FONT.xs,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  /* ── Delegate For Me table ── */
  function renderDelegateForMe() {
    return (
      <div style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: '10px',
        boxShadow: SHADOWS.card,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 style={{ margin: 0, fontSize: FONT.md, fontWeight: 700, color: COLORS.textPrimary }}>
            Delegated To Me
          </h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: FONT.sm, color: COLORS.textSecondary }}>
            Approval authority others have delegated to you
          </p>
        </div>

        {delegateForMe.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: COLORS.textMuted, fontSize: FONT.sm }}>
            No one has delegated their approval authority to you.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Delegated By</th>
                  <th style={thStyle}>Start Date</th>
                  <th style={thStyle}>End Date</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {delegateForMe.map((d) => (
                  <tr key={d.id} style={{ transition: 'background 0.1s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = COLORS.hoverBg; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{d.delegator?.name ?? d.delegatorId}</div>
                      <div style={{ fontSize: FONT.xs, color: COLORS.textMuted }}>{d.delegator?.email ?? ''}</div>
                    </td>
                    <td style={tdStyle}>{formatDate(d.startDate)}</td>
                    <td style={tdStyle}>{formatDate(d.endDate)}</td>
                    <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.reason ?? <span style={{ color: COLORS.textMuted }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge active={d.active} startDate={d.startDate} endDate={d.endDate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ margin: 0, fontSize: FONT.xl, fontWeight: 700, color: COLORS.textPrimary }}>
          Approval Delegations
        </h1>
        <p style={{ margin: '0.5rem 0 0', fontSize: FONT.sm, color: COLORS.textSecondary }}>
          Manage out-of-office approval routing. Delegating transfers your approval authority to another user for the specified period.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: COLORS.textMuted, fontSize: FONT.sm }}>
          Loading...
        </div>
      ) : (
        <>
          {renderMyDelegations()}
          {renderDelegateForMe()}
        </>
      )}

      {renderModal()}
    </div>
  );
}
