'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:    { bg: '#fef9c3', text: '#92400e' },
  processing: { bg: '#dbeafe', text: '#1d4ed8' },
  done:       { bg: '#d1fae5', text: '#065f46' },
  failed:     { bg: '#fee2e2', text: '#991b1b' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: '#f3f4f6', text: '#374151' };
  return (
    <span style={{ ...s, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', textTransform: 'capitalize' }}>
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>OCR Jobs</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Invoice PDF/image extraction history. Upload via the{' '}
            <Link href="/invoices/new" style={{ color: '#2563eb' }}>New Invoice</Link> page.
          </p>
        </div>
        <button
          onClick={load}
          style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Refresh
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontWeight: 500, color: '#6b7280', marginBottom: '0.5rem' }}>No OCR jobs yet</p>
            <p style={{ fontSize: '0.875rem' }}>Upload an invoice PDF or image on the New Invoice page to start extraction.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Filename', 'Status', 'Invoice Number', 'Vendor', 'Total', 'Confidence', 'Created', 'Invoice Link', ''].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                      style={{ borderBottom: idx < jobs.length - 1 ? '1px solid #f3f4f6' : undefined, cursor: hasData ? 'pointer' : 'default' }}
                      onClick={() => hasData && setExpanded(isExpanded ? null : job.id)}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 500, color: '#111827', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.filename}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge status={job.status} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>
                        {extracted?.invoiceNumber ?? '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>
                        {extracted?.vendorName ?? '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>
                        {extracted?.totalAmount != null
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: extracted.currency ?? 'USD' }).format(extracted.totalAmount)
                          : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {confidence?.overall != null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '60px', background: '#e5e7eb', borderRadius: 4, height: 6 }}>
                              <div style={{ width: `${Math.round(confidence.overall * 100)}%`, background: confidence.overall > 0.8 ? '#22c55e' : confidence.overall > 0.5 ? '#f59e0b' : '#ef4444', height: 6, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{Math.round(confidence.overall * 100)}%</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {job.invoiceId ? (
                          <Link href={`/invoices/${job.invoiceId}`} style={{ color: '#2563eb', fontSize: '0.8rem', textDecoration: 'none' }}>
                            View Invoice
                          </Link>
                        ) : job.status === 'done' ? (
                          <Link href="/invoices/new" style={{ color: '#6b7280', fontSize: '0.8rem', textDecoration: 'none' }}>
                            Create Invoice
                          </Link>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                        {hasData && <span>{isExpanded ? '▲' : '▼'}</span>}
                      </td>
                    </tr>
                    {isExpanded && hasData && (
                      <tr key={`${job.id}-detail`} style={{ background: '#f9fafb', borderBottom: idx < jobs.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                        <td colSpan={9} style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontSize: '0.8rem', color: '#374151', marginBottom: '0.75rem', fontWeight: 600 }}>Extracted Data</div>
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
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{label}</div>
                                <div style={{ color: '#111827' }}>{value ?? '—'}</div>
                              </div>
                            ))}
                          </div>
                          {extracted.lines && extracted.lines.length > 0 && (
                            <>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Line Items</div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                                <thead>
                                  <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                                    {['Description', 'Qty', 'Unit Price', 'Total', 'GL Account'].map((h) => (
                                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {extracted.lines.map((line: any, li: number) => (
                                    <tr key={li} style={{ borderBottom: li < extracted.lines.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                                      <td style={{ padding: '0.5rem 0.75rem' }}>{line.description}</td>
                                      <td style={{ padding: '0.5rem 0.75rem' }}>{line.quantity}</td>
                                      <td style={{ padding: '0.5rem 0.75rem' }}>${line.unitPrice}</td>
                                      <td style={{ padding: '0.5rem 0.75rem' }}>${line.totalPrice}</td>
                                      <td style={{ padding: '0.5rem 0.75rem', color: '#6b7280' }}>{line.glAccount ?? '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </>
                          )}
                          {job.errorMessage && (
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '6px', color: '#dc2626', fontSize: '0.8rem' }}>
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
        )}
      </div>
    </div>
  );
}
