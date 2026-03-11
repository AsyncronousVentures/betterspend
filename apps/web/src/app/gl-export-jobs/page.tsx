'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending: { background: COLORS.contentBg, color: COLORS.textSecondary },
  processing: { background: '#dbeafe', color: '#1e40af' },
  success: { background: '#d1fae5', color: COLORS.accentGreenDark },
  failed: { background: '#fee2e2', color: COLORS.accentRedDark },
};

const SYSTEM_LABELS: Record<string, string> = { qbo: 'QuickBooks Online', xero: 'Xero' };

export default function GlExportJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryResult, setRetryResult] = useState<{ id: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.glExportJobs.list()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRetry(e: React.MouseEvent, jobId: string) {
    e.stopPropagation();
    setRetrying(jobId);
    setRetryResult(null);
    try {
      await api.glExportJobs.retry(jobId);
      setRetryResult({ id: jobId, ok: true });
      setTimeout(refresh, 1500);
    } catch {
      setRetryResult({ id: jobId, ok: false });
    } finally {
      setRetrying(null);
    }
  }

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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>GL Export Jobs</h1>
          <p style={{ margin: '0.25rem 0 0', color: COLORS.textSecondary, fontSize: '0.875rem' }}>History of GL exports to QuickBooks Online and Xero</p>
        </div>
        <button onClick={refresh}
          style={{ padding: '0.5rem 1rem', border: `1px solid ${COLORS.tableBorder}`, borderRadius: '6px', background: COLORS.cardBg, cursor: 'pointer', fontSize: '0.875rem', color: COLORS.textSecondary }}>
          Refresh
        </button>
      </div>

      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.tableBorder}`, borderRadius: '8px', overflow: 'hidden', boxShadow: SHADOWS.card }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: COLORS.textMuted }}>Loading…</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: COLORS.textMuted }}>
            <p style={{ fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.5rem' }}>No export jobs yet</p>
            <p style={{ fontSize: '0.875rem' }}>Trigger GL exports from approved invoice detail pages.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: COLORS.tableHeaderBg, borderBottom: `1px solid ${COLORS.tableBorder}` }}>
                  {['Invoice', 'System', 'Status', 'Created', 'Completed', 'Attempts', ''].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: COLORS.textSecondary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, idx) => {
                  const statusStyle = STATUS_COLORS[job.status] ?? { background: COLORS.contentBg, color: COLORS.textSecondary };
                  const isExpanded = expanded === job.id;
                  const hasError = !!job.errorMessage;
                  return (
                    <>
                      <tr key={job.id} style={{ borderBottom: `1px solid ${COLORS.contentBg}`, cursor: hasError ? 'pointer' : 'default' }}
                        onClick={() => hasError && setExpanded(isExpanded ? null : job.id)}>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {job.invoiceId ? (
                            <Link href={`/invoices/${job.invoiceId}`} style={{ color: COLORS.accentBlueDark, textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.8rem' }}
                              onClick={(e) => e.stopPropagation()}>
                              {job.invoiceId.slice(0, 8)}…
                            </Link>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>{SYSTEM_LABELS[job.targetSystem] ?? job.targetSystem}</td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ ...statusStyle, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>{job.status}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary, fontSize: '0.8rem' }}>{new Date(job.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary, fontSize: '0.8rem' }}>{job.completedAt ? new Date(job.completedAt).toLocaleString() : '—'}</td>
                        <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary, textAlign: 'center' }}>{job.attempts ?? 0}</td>
                        <td style={{ padding: '0.875rem 1rem', color: COLORS.textMuted, fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {job.status === 'failed' && (
                            <button
                              onClick={(e) => handleRetry(e, job.id)}
                              disabled={retrying === job.id}
                              style={{ padding: '0.2rem 0.6rem', background: COLORS.accentBlueDark, color: COLORS.white, border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: retrying === job.id ? 'not-allowed' : 'pointer', opacity: retrying === job.id ? 0.6 : 1 }}
                            >
                              {retrying === job.id ? '…' : retryResult?.id === job.id ? (retryResult?.ok ? 'Queued!' : 'Failed') : 'Retry'}
                            </button>
                          )}
                          {hasError && <span>{isExpanded ? '▲' : '▼'}</span>}
                        </td>
                      </tr>
                      {isExpanded && hasError && (
                        <tr key={`${job.id}-err`} style={{ background: '#fff8f8', borderBottom: `1px solid ${COLORS.contentBg}` }}>
                          <td colSpan={7} style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: COLORS.accentRedDark, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.75rem', fontFamily: 'monospace' }}>
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
          </div>
        )}
      </div>
    </div>
  );
}
