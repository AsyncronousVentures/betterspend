'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending: { background: '#f3f4f6', color: '#374151' },
  processing: { background: '#dbeafe', color: '#1e40af' },
  success: { background: '#d1fae5', color: '#065f46' },
  failed: { background: '#fee2e2', color: '#991b1b' },
};

const SYSTEM_LABELS: Record<string, string> = { qbo: 'QuickBooks Online', xero: 'Xero' };

export default function GlExportJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.glExportJobs.list()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function refresh() {
    setLoading(true);
    api.glExportJobs.list()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>GL Export Jobs</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>History of GL exports to QuickBooks Online and Xero</p>
        </div>
        <button onClick={refresh}
          style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
          Refresh
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontWeight: 500, color: '#6b7280', marginBottom: '0.5rem' }}>No export jobs yet</p>
            <p style={{ fontSize: '0.875rem' }}>Trigger GL exports from approved invoice detail pages.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Invoice', 'System', 'Status', 'Created', 'Completed', 'Attempts', ''].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, idx) => {
                const statusStyle = STATUS_COLORS[job.status] ?? { background: '#f3f4f6', color: '#374151' };
                const isExpanded = expanded === job.id;
                const hasError = !!job.errorMessage;
                return (
                  <>
                    <tr key={job.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: hasError ? 'pointer' : 'default' }}
                      onClick={() => hasError && setExpanded(isExpanded ? null : job.id)}>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {job.invoiceId ? (
                          <Link href={`/invoices/${job.invoiceId}`} style={{ color: '#2563eb', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.8rem' }}
                            onClick={(e) => e.stopPropagation()}>
                            {job.invoiceId.slice(0, 8)}…
                          </Link>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{SYSTEM_LABELS[job.targetSystem] ?? job.targetSystem}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ ...statusStyle, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>{job.status}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.8rem' }}>{new Date(job.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.8rem' }}>{job.completedAt ? new Date(job.completedAt).toLocaleString() : '—'}</td>
                      <td style={{ padding: '0.875rem 1rem', color: '#374151', textAlign: 'center' }}>{job.attempts ?? 0}</td>
                      <td style={{ padding: '0.875rem 1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                        {hasError && <span>{isExpanded ? '▲' : '▼'}</span>}
                      </td>
                    </tr>
                    {isExpanded && hasError && (
                      <tr key={`${job.id}-err`} style={{ background: '#fff8f8', borderBottom: '1px solid #f3f4f6' }}>
                        <td colSpan={7} style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontSize: '0.8rem', color: '#991b1b', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.75rem', fontFamily: 'monospace' }}>
                            {job.errorMessage}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
