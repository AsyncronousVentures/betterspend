'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS, SHADOWS } from '../lib/theme';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(name + '='))
    ?.split('=')[1];
}

interface Document {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  entityType: string;
  entityId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface DocumentUploaderProps {
  entityType: string;
  entityId: string;
  label?: string;
}

export function DocumentUploader({ entityType, entityId, label = 'Documents' }: DocumentUploaderProps) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getCookie('bs_token');
      const res = await fetch(
        `${API_BASE}/api/v1/documents?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);
      const data = await res.json();
      setDocs(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (entityId) fetchDocs();
  }, [fetchDocs, entityId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const token = getCookie('bs_token');
      const form = new FormData();
      form.append('file', file);
      form.append('entityType', entityType);
      form.append('entityId', entityId);

      const res = await fetch(`${API_BASE}/api/v1/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Upload failed (${res.status})`);
      }

      await fetchDocs();
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDownload(doc: Document) {
    setError('');
    try {
      const token = getCookie('bs_token');
      const res = await fetch(`${API_BASE}/api/v1/documents/${doc.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const { url } = await res.json();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setError(e.message || 'Download failed');
    }
  }

  async function handleDelete(doc: Document) {
    if (!confirm(`Delete "${doc.filename}"?`)) return;
    setDeletingId(doc.id);
    setError('');
    try {
      const token = getCookie('bs_token');
      const res = await fetch(`${API_BASE}/api/v1/documents/${doc.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok && res.status !== 204) throw new Error(`Delete failed (${res.status})`);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: COLORS.cardBg,
    border: `1px solid ${COLORS.tableBorder}`,
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: SHADOWS.card,
    marginBottom: '1rem',
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: COLORS.textSecondary, margin: 0 }}>
          {label} {docs.length > 0 ? `(${docs.length})` : ''}
        </h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            style={{ display: 'none' }}
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '0.375rem 0.875rem',
              background: COLORS.accentBlue,
              color: COLORS.white,
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: COLORS.accentRedLight,
          border: `1px solid #fecaca`,
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          color: COLORS.accentRedDark,
          fontSize: '0.8125rem',
          marginBottom: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.accentRedDark, fontWeight: 700, fontSize: '1rem', padding: 0, lineHeight: 1 }}
          >
            x
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: '0.875rem', color: COLORS.textMuted, padding: '0.5rem 0' }}>Loading...</div>
      ) : docs.length === 0 ? (
        <div style={{ fontSize: '0.875rem', color: COLORS.textMuted, padding: '0.25rem 0' }}>
          No documents attached. Click Upload File to add one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.875rem',
                background: COLORS.contentBg,
                borderRadius: '6px',
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.875rem', color: COLORS.textPrimary, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doc.filename}
                </div>
                <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.125rem' }}>
                  {doc.contentType} — {formatBytes(doc.sizeBytes)} — {formatDate(doc.createdAt)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                <button
                  onClick={() => handleDownload(doc)}
                  style={{
                    padding: '0.25rem 0.625rem',
                    background: COLORS.white,
                    color: COLORS.accentBlueDark,
                    border: `1px solid ${COLORS.accentBlue}`,
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc.id}
                  style={{
                    padding: '0.25rem 0.625rem',
                    background: COLORS.white,
                    color: COLORS.accentRedDark,
                    border: `1px solid #fca5a5`,
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: deletingId === doc.id ? 'not-allowed' : 'pointer',
                    opacity: deletingId === doc.id ? 0.6 : 1,
                  }}
                >
                  {deletingId === doc.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
