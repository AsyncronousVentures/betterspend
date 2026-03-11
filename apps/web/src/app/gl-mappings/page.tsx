'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

type TargetSystem = 'qbo' | 'xero';

interface GlMapping {
  id: string;
  glAccount: string;
  glAccountName: string | null;
  targetSystem: string;
  externalAccountCode: string;
  externalAccountName: string | null;
  isActive: boolean;
  createdAt: string;
}

interface GlExportJob {
  id: string;
  invoiceId: string;
  targetSystem: string;
  status: string;
  attempts: number;
  exportedAt: string | null;
  errorMessage: string | null;
  externalId: string | null;
  createdAt: string;
  invoice?: { internalNumber: string; invoiceNumber: string };
}

const SYSTEM_LABELS: Record<string, string> = { qbo: 'QuickBooks Online', xero: 'Xero' };

const JOB_STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending:  { background: '#fef3c7', color: '#92400e' },
  exported: { background: '#d1fae5', color: '#065f46' },
  failed:   { background: '#fee2e2', color: '#991b1b' },
  skipped:  { background: '#f3f4f6', color: '#6b7280' },
};

function StatusBadge({ status }: { status: string }) {
  const style = JOB_STATUS_COLORS[status] ?? { background: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ ...style, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db',
  borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  background: '#111827', color: '#fff', border: 'none', padding: '0.5rem 1.25rem',
  borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  background: 'transparent', color: '#dc2626', border: '1px solid #dc2626',
  padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer',
};

export default function GlMappingsPage() {
  const [activeTab, setActiveTab] = useState<'mappings' | 'jobs'>('mappings');
  const [mappings, setMappings] = useState<GlMapping[]>([]);
  const [jobs, setJobs] = useState<GlExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSystem, setFilterSystem] = useState<TargetSystem | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    glAccount: '', glAccountName: '', targetSystem: 'qbo' as TargetSystem,
    externalAccountCode: '', externalAccountName: '',
  });

  async function loadMappings() {
    const url = filterSystem
      ? `${API_URL}/gl/mappings?targetSystem=${filterSystem}`
      : `${API_URL}/gl/mappings`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) setMappings(await res.json() as GlMapping[]);
  }

  async function loadJobs() {
    const res = await fetch(`${API_URL}/gl/export-jobs`, { cache: 'no-store' });
    if (res.ok) setJobs(await res.json() as GlExportJob[]);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMappings(), loadJobs()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSystem]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/gl/mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          glAccount: form.glAccount,
          glAccountName: form.glAccountName || undefined,
          targetSystem: form.targetSystem,
          externalAccountCode: form.externalAccountCode,
          externalAccountName: form.externalAccountName || undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ glAccount: '', glAccountName: '', targetSystem: 'qbo', externalAccountCode: '', externalAccountName: '' });
        await loadMappings();
      } else {
        const err = await res.json() as { message?: string };
        alert(err.message ?? 'Failed to create mapping');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this mapping?')) return;
    await fetch(`${API_URL}/gl/mappings/${id}`, { method: 'DELETE' });
    await loadMappings();
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: active ? 600 : 400,
    borderBottom: active ? '2px solid #111827' : '2px solid transparent',
    color: active ? '#111827' : '#6b7280', cursor: 'pointer', background: 'none', border: 'none',
    borderBottomWidth: '2px', borderBottomStyle: 'solid',
    borderBottomColor: active ? '#111827' : 'transparent',
  });

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>GL Integration</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Map internal GL accounts to QuickBooks Online or Xero account codes
          </p>
        </div>
        {activeTab === 'mappings' && (
          <button style={btnPrimary} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Mapping'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
        <button style={tabStyle(activeTab === 'mappings')} onClick={() => setActiveTab('mappings')}>
          Account Mappings
        </button>
        <button style={tabStyle(activeTab === 'jobs')} onClick={() => setActiveTab('jobs')}>
          Export Jobs
        </button>
      </div>

      {/* Create form */}
      {activeTab === 'mappings' && showForm && (
        <Card style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>New GL Mapping</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                  GL Account Code *
                </label>
                <input
                  style={inputStyle} required value={form.glAccount}
                  onChange={(e) => setForm({ ...form, glAccount: e.target.value })}
                  placeholder="e.g. 6000"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                  GL Account Name
                </label>
                <input
                  style={inputStyle} value={form.glAccountName}
                  onChange={(e) => setForm({ ...form, glAccountName: e.target.value })}
                  placeholder="e.g. Office Supplies"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                  Target System *
                </label>
                <select
                  style={inputStyle} value={form.targetSystem}
                  onChange={(e) => setForm({ ...form, targetSystem: e.target.value as TargetSystem })}
                >
                  <option value="qbo">QuickBooks Online</option>
                  <option value="xero">Xero</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                  External Account Code *
                </label>
                <input
                  style={inputStyle} required value={form.externalAccountCode}
                  onChange={(e) => setForm({ ...form, externalAccountCode: e.target.value })}
                  placeholder="e.g. 200 (QBO) or OFFSUPP (Xero)"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                  External Account Name
                </label>
                <input
                  style={inputStyle} value={form.externalAccountName}
                  onChange={(e) => setForm({ ...form, externalAccountName: e.target.value })}
                  placeholder="Name as it appears in the external system"
                />
              </div>
            </div>
            <button type="submit" style={btnPrimary} disabled={saving}>
              {saving ? 'Saving…' : 'Save Mapping'}
            </button>
          </form>
        </Card>
      )}

      {/* Mappings tab */}
      {activeTab === 'mappings' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>Filter by system:</label>
            <select
              style={{ ...inputStyle, width: 'auto' }}
              value={filterSystem}
              onChange={(e) => setFilterSystem(e.target.value as TargetSystem | '')}
            >
              <option value="">All systems</option>
              <option value="qbo">QuickBooks Online</option>
              <option value="xero">Xero</option>
            </select>
          </div>

          <Card>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
            ) : mappings.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
                <p style={{ fontWeight: 500, color: '#6b7280', marginBottom: '0.5rem' }}>No mappings configured</p>
                <p style={{ fontSize: '0.875rem' }}>Add a mapping to enable GL export when invoices are approved.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    {['GL Account', 'GL Account Name', 'Target System', 'External Code', 'External Name', 'Active', ''].map((col) => (
                      <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m, idx) => (
                    <tr key={m.id} style={{ borderBottom: idx < mappings.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                      <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#111827' }}>{m.glAccount}</td>
                      <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{m.glAccountName ?? '—'}</td>
                      <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{SYSTEM_LABELS[m.targetSystem] ?? m.targetSystem}</td>
                      <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', color: '#2563eb' }}>{m.externalAccountCode}</td>
                      <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{m.externalAccountName ?? '—'}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ color: m.isActive ? '#059669' : '#9ca3af', fontWeight: 600, fontSize: '0.8rem' }}>
                          {m.isActive ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <button style={btnDanger} onClick={() => handleDelete(m.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {/* Export Jobs tab */}
      {activeTab === 'jobs' && (
        <Card>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ fontWeight: 500, color: '#6b7280', marginBottom: '0.5rem' }}>No export jobs yet</p>
              <p style={{ fontSize: '0.875rem' }}>Jobs are created automatically when invoices are approved.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  {['Invoice', 'Target System', 'Status', 'External ID', 'Exported At', 'Error'].map((col) => (
                    <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, idx) => (
                  <tr key={job.id} style={{ borderBottom: idx < jobs.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#111827' }}>
                      {job.invoice?.internalNumber ?? job.invoiceId.slice(0, 8)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>
                      {SYSTEM_LABELS[job.targetSystem] ?? job.targetSystem}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <StatusBadge status={job.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#6b7280' }}>
                      {job.externalId ?? '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>
                      {job.exportedAt ? new Date(job.exportedAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#dc2626', fontSize: '0.8rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.errorMessage ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
