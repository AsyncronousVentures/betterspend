'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const ROLES = ['admin', 'approver', 'requester', 'receiver', 'finance'];

const EMPTY_FORM = { name: '', email: '', password: '', role: 'requester' };

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addRoleUserId, setAddRoleUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('requester');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await api.users.list();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setFormError('Name, email and password are required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      await api.users.create({ name: form.name, email: form.email, password: form.password, role: form.role || undefined });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: any) {
    try {
      if (user.isActive) {
        await api.users.deactivate(user.id);
      } else {
        await api.users.activate(user.id);
      }
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleAddRole(userId: string) {
    try {
      await api.users.addRole(userId, { role: newRole, scopeType: 'global' });
      setAddRoleUserId(null);
      setNewRole('requester');
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleRemoveRole(userId: string, roleId: string) {
    if (!confirm('Remove this role?')) return;
    try {
      await api.users.removeRole(userId, roleId);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Users</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Manage user accounts and roles</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); setForm(EMPTY_FORM); }}
          style={{ background: '#111827', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : '+ Invite User'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Create New User</h2>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Full Name *</label>
                <input
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Smith"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Email *</label>
                <input
                  type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@company.com"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Password *</label>
                <input
                  type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Temporary password"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Initial Role</label>
                <select
                  value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
                >
                  <option value="">— No role —</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {formError && <div style={{ marginBottom: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#991b1b', fontSize: '0.875rem' }}>{formError}</div>}
            <button type="submit" disabled={saving}
              style={{ background: '#059669', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {error && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</div>}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Name', 'Email', 'Status', 'Roles', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 500, color: '#111827' }}>{user.name}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>{user.email}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                      background: user.isActive ? '#dcfce7' : '#fee2e2',
                      color: user.isActive ? '#15803d' : '#dc2626',
                    }}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {(user.userRoles || []).map((r: any) => (
                        <span key={r.id} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                          background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                        }}>
                          {r.role}
                          <button onClick={() => handleRemoveRole(user.id, r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: '0.75rem', padding: 0, lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                      {addRoleUserId === user.id ? (
                        <span style={{ display: 'inline-flex', gap: '0.25rem' }}>
                          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ fontSize: '0.75rem', padding: '0.15rem', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button onClick={() => handleAddRole(user.id)} style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                          <button onClick={() => setAddRoleUserId(null)} style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </span>
                      ) : (
                        <button onClick={() => setAddRoleUserId(user.id)} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}>+ Role</button>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <button
                      onClick={() => toggleActive(user)}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer', color: user.isActive ? '#dc2626' : '#15803d' }}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
