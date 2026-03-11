'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const ENTITY_COLORS: Record<string, string> = {
  requisition: '#eff6ff',
  purchase_order: '#f0fdf4',
  invoice: '#fef9c3',
  goods_receipt: '#fdf4ff',
  budget: '#fff7ed',
  vendor: '#f0f9ff',
  user: '#fef2f2',
};

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  created: { bg: '#dcfce7', text: '#15803d' },
  updated: { bg: '#eff6ff', text: '#1d4ed8' },
  deleted: { bg: '#fee2e2', text: '#dc2626' },
  approved: { bg: '#d1fae5', text: '#065f46' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
  issued: { bg: '#fef9c3', text: '#ca8a04' },
  cancelled: { bg: '#fee2e2', text: '#dc2626' },
};

const ENTITY_TYPES = ['requisition', 'purchase_order', 'invoice', 'goods_receipt', 'budget', 'vendor', 'user'];

export default function AuditPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [filterEntity]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.audit.list({ entityType: filterEntity || undefined, limit: 200 });
      setEntries(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Audit Log</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Immutable record of all system actions</p>
        </div>
        <button onClick={load} style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Entity type:</label>
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
        >
          <option value="">All</option>
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#6b7280' }}>{entries.length} entries</span>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No audit entries found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Time', 'Entity', 'Action', 'Entity ID', 'User', ''].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const ac = ACTION_COLORS[entry.action] || { bg: '#f3f4f6', text: '#374151' };
                const ec = ENTITY_COLORS[entry.entityType] || '#f9fafb';
                const isExpanded = expanded === entry.id;
                const hasChanges = entry.changes && Object.keys(entry.changes).length > 0;
                return (
                  <>
                    <tr
                      key={entry.id}
                      style={{ borderBottom: '1px solid #f3f4f6', cursor: hasChanges ? 'pointer' : 'default' }}
                      onClick={() => hasChanges && setExpanded(isExpanded ? null : entry.id)}
                    >
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ background: ec, padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: '#374151' }}>
                          {entry.entityType.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ background: ac.bg, color: ac.text, padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {entry.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#9ca3af' }}>
                        {entry.entityId.slice(0, 8)}...
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.8rem' }}>
                        {entry.userId ? entry.userId.slice(0, 8) + '...' : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                        {hasChanges && <span>{isExpanded ? '▲' : '▼'}</span>}
                      </td>
                    </tr>
                    {isExpanded && hasChanges && (
                      <tr key={`${entry.id}-detail`} style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                        <td colSpan={6} style={{ padding: '0.75rem 1rem' }}>
                          <pre style={{ fontSize: '0.8rem', color: '#374151', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: '#f3f4f6', padding: '0.75rem', borderRadius: '6px' }}>
                            {JSON.stringify(entry.changes, null, 2)}
                          </pre>
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
