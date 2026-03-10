'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface PO {
  id: string;
  number: string;
  status: string;
  vendor: { name: string } | null;
  lines: Array<{ id: string; lineNumber: string; description: string; quantity: string; quantityReceived: string }>;
}

export default function NewGRNPage() {
  const router = useRouter();
  const [pos, setPOs] = useState<PO[]>([]);
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [lineQtys, setLineQtys] = useState<Record<string, { received: string; rejected: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/purchase-orders`)
      .then((r) => r.json())
      .then((data) => {
        const eligible = (Array.isArray(data) ? data : data.data ?? []).filter((po: PO) =>
          ['approved', 'issued', 'partially_received'].includes(po.status),
        );
        setPOs(eligible);
      })
      .catch(() => {});
  }, []);

  const handlePOChange = async (poId: string) => {
    if (!poId) { setSelectedPO(null); setLineQtys({}); return; }
    const res = await fetch(`${API_URL}/purchase-orders/${poId}`);
    const po: PO = await res.json();
    setSelectedPO(po);
    const qtys: Record<string, { received: string; rejected: string }> = {};
    (po.lines ?? []).forEach((l) => { qtys[l.id] = { received: l.quantity, rejected: '0' }; });
    setLineQtys(qtys);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    setLoading(true);
    setError('');

    const lines = (selectedPO.lines ?? [])
      .filter((l) => parseFloat(lineQtys[l.id]?.received ?? '0') > 0)
      .map((l) => ({
        poLineId: l.id,
        quantityReceived: parseFloat(lineQtys[l.id]?.received ?? '0'),
        quantityRejected: parseFloat(lineQtys[l.id]?.rejected ?? '0'),
      }));

    try {
      const res = await fetch(`${API_URL}/receiving`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseOrderId: selectedPO.id,
          receivedBy: '00000000-0000-0000-0000-000000000002',
          receivedDate,
          notes: notes || undefined,
          lines,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Failed to create GRN');
      }
      const grn = await res.json();
      router.push(`/receiving/${grn.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827' }}>
        Create Goods Receipt (GRN)
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Receipt Details</h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                Purchase Order *
              </label>
              <select
                onChange={(e) => handlePOChange(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
              >
                <option value="">Select a PO...</option>
                {pos.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.number} — {po.vendor?.name ?? 'Unknown vendor'}
                  </option>
                ))}
              </select>
              {pos.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  No eligible POs. POs must be in approved/issued/partially_received status.
                </p>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                Received Date *
              </label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {selectedPO && (selectedPO.lines ?? []).length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Line Items</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  {['#', 'Description', 'PO Qty', 'Received Qty', 'Rejected Qty'].map((h) => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selectedPO.lines ?? []).map((line, idx) => (
                  <tr key={line.id} style={{ borderBottom: idx < (selectedPO.lines?.length ?? 0) - 1 ? '1px solid #f3f4f6' : undefined }}>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#6b7280' }}>{line.lineNumber}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{line.description}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#374151' }}>{line.quantity}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={line.quantity}
                        value={lineQtys[line.id]?.received ?? ''}
                        onChange={(e) => setLineQtys((prev) => ({ ...prev, [line.id]: { ...prev[line.id], received: e.target.value } }))}
                        style={{ width: '80px', padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={lineQtys[line.id]?.rejected ?? '0'}
                        onChange={(e) => setLineQtys((prev) => ({ ...prev, [line.id]: { ...prev[line.id], rejected: e.target.value } }))}
                        style={{ width: '80px', padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#991b1b', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={loading || !selectedPO}
            style={{
              background: loading ? '#9ca3af' : '#111827', color: '#fff', padding: '0.625rem 1.5rem',
              borderRadius: '6px', border: 'none', fontSize: '0.875rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create GRN'}
          </button>
          <a href="/receiving" style={{ padding: '0.625rem 1.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', color: '#374151', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
