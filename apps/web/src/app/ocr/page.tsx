'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { COLORS, SHADOWS } from '../../lib/theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:    { bg: '#fef9c3', text: COLORS.accentAmberDark },
  processing: { bg: '#dbeafe', text: '#1d4ed8' },
  done:       { bg: '#d1fae5', text: COLORS.accentGreenDark },
  failed:     { bg: '#fee2e2', text: COLORS.accentRedDark },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: COLORS.contentBg, text: COLORS.textSecondary };
  return (
    <span style={{ background: s.bg, color: s.text, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

export default function OcrJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    api.ocr.list().then(setJobs).catch(() => {}).finally(() => setLoading(false));
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: COLORS.textPrimary }}>OCR Jobs</h1>
          <p style={{ margin: '0.25rem 0 0', color: COLORS.textSecondary, fontSize: '0.875rem' }}>
            Invoice PDF/image extraction history. Upload via the{' '}
            <Link href="/invoices/new" style={{ color: COLORS.accentBlueDark }}>New Invoice</Link> page.
          </p>
        </div>
        <button
          onClick={load}
          style={{ padding: '0.5rem 1rem', border: `1px solid ${COLORS.tableBorder}`, borderRadius: '6px', background: COLORS.cardBg, cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Refresh
        </button>
      </div>

      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.tableBorder}`, borderRadius: '8px', overflow: 'hidden', boxShadow: SHADOWS.card }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: COLORS.textMuted }}>Loading…</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: COLORS.textMuted }}>
            <p style={{ fontWeight: 500, color: COLORS.textSecondary, marginBottom: '0.5rem' }}>No OCR jobs yet</p>
            <p style={{ fontSize: '0.875rem' }}>Upload an invoice PDF or image on the New Invoice page to start extraction.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: COLORS.tableHeaderBg, borderBottom: `1px solid ${COLORS.tableBorder}` }}>
                  {['Filename', 'Status', 'Invoice Number', 'Vendor', 'Total', 'Confidence', 'Created', 'Invoice Link', ''].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: COLORS.textSecondary, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, idx) => {
                  const extracted = job.extractedData;
                  const confidence = job.confidence;
                  const isExpanded = expanded === job.id;
                  const hasData = extracted && (extracted.invoiceNumber || extracted.lines?.length > 0);
                  return (
                    <>
                      <tr
                        key={job.id}
                        style={{ borderBottom: idx < jobs.length - 1 ? `1px solid ${COLORS.contentBg}` : undefined, cursor: hasData ? 'pointer' : 'default' }}
                        onClick={() => hasData && setExpanded(isExpanded ? null : job.id)}
                      >
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 500, color: COLORS.textPrimary, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.filename}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <StatusBadge status={job.status} />
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>
                          {extracted?.invoiceNumber ?? '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>
                          {extracted?.vendorName ?? '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary }}>
                          {extracted?.totalAmount != null
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: extracted.currency ?? 'USD' }).format(extracted.totalAmount)
                            : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {confidence?.overall != null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '60px', background: COLORS.tableBorder, borderRadius: 4, height: 6 }}>
                                <div style={{ width: `${Math.round(confidence.overall * 100)}%`, background: confidence.overall > 0.8 ? '#22c55e' : confidence.overall > 0.5 ? COLORS.accentAmber : COLORS.accentRed, height: 6, borderRadius: 4 }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: COLORS.textSecondary }}>{Math.round(confidence.overall * 100)}%</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: COLORS.textSecondary, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {job.invoiceId ? (
                            <Link href={`/invoices/${job.invoiceId}`} style={{ color: COLORS.accentBlueDark, fontSize: '0.8rem', textDecoration: 'none' }}>
                              View Invoice
                            </Link>
                          ) : job.status === 'done' ? (
                            <Link href="/invoices/new" style={{ color: COLORS.textSecondary, fontSize: '0.8rem', textDecoration: 'none' }}>
                              Create Invoice
                            </Link>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: COLORS.textMuted, fontSize: '0.8rem' }}>
                          {hasData && <span>{isExpanded ? '▲' : '▼'}</span>}
                        </td>
                      </tr>
                      {isExpanded && hasData && (
                        <tr key={`${job.id}-detail`} style={{ background: COLORS.hoverBg, borderBottom: idx < jobs.length - 1 ? `1px solid ${COLORS.contentBg}` : undefined }}>
                          <td colSpan={9} style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary, marginBottom: '0.75rem', fontWeight: 600 }}>Extracted Data</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                              {[
                                { label: 'Invoice #', value: extracted.invoiceNumber },
                                { label: 'Vendor', value: extracted.vendorName },
                                { label: 'Invoice Date', value: extracted.invoiceDate },
                                { label: 'Due Date', value: extracted.dueDate },
                                { label: 'Subtotal', value: extracted.subtotal != null ? `${extracted.currency ?? '$'}${extracted.subtotal}` : null },
                                { label: 'Tax', value: extracted.taxAmount != null ? `${extracted.currency ?? '$'}${extracted.taxAmount}` : null },
                                { label: 'Total', value: extracted.totalAmount != null ? `${extracted.currency ?? '$'}${extracted.totalAmount}` : null },
                                { label: 'Currency', value: extracted.currency },
                              ].map(({ label, value }) => (
                                <div key={label}>
                                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: '0.2rem' }}>{label}</div>
                                  <div style={{ color: COLORS.textPrimary }}>{value ?? '—'}</div>
                                </div>
                              ))}
                            </div>
                            {extracted.lines && extracted.lines.length > 0 && (
                              <>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.5rem' }}>Line Items</div>
                                <div style={{ overflowX: 'auto' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', background: COLORS.cardBg, border: `1px solid ${COLORS.tableBorder}`, borderRadius: '6px', overflow: 'hidden' }}>
                                    <thead>
                                      <tr style={{ background: COLORS.contentBg, borderBottom: `1px solid ${COLORS.tableBorder}` }}>
                                        {['Description', 'Qty', 'Unit Price', 'Total', 'GL Account'].map((h) => (
                                          <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: COLORS.textSecondary }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {extracted.lines.map((line: any, li: number) => (
                                        <tr key={li} style={{ borderBottom: li < extracted.lines.length - 1 ? `1px solid ${COLORS.contentBg}` : undefined }}>
                                          <td style={{ padding: '0.5rem 0.75rem' }}>{line.description}</td>
                                          <td style={{ padding: '0.5rem 0.75rem' }}>{line.quantity}</td>
                                          <td style={{ padding: '0.5rem 0.75rem' }}>${line.unitPrice}</td>
                                          <td style={{ padding: '0.5rem 0.75rem' }}>${line.totalPrice}</td>
                                          <td style={{ padding: '0.5rem 0.75rem', color: COLORS.textSecondary }}>{line.glAccount ?? '—'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                            {job.errorMessage && (
                              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: COLORS.accentRedLight, borderRadius: '6px', color: COLORS.accentRedDark, fontSize: '0.8rem' }}>
                                Error: {job.errorMessage}
                              </div>
                            )}
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
