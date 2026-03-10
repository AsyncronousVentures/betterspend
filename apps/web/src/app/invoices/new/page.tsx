'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface PO {
  id: string;
  number: string;
  vendorId: string;
  vendor: { id: string; name: string } | null;
  lines: Array<{ id: string; lineNumber: string; description: string; quantity: string; unitPrice: string }>;
}

interface InvoiceLine {
  poLineId: string;
  lineNumber: number;
  description: string;
  quantity: string;
  unitPrice: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [pos, setPOs] = useState<PO[]>([]);
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);
  const [vendorId, setVendorId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/purchase-orders`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.data ?? [];
        setPOs(arr);
      })
      .catch(() => {});
  }, []);

  const handlePOChange = async (poId: string) => {
    if (!poId) { setSelectedPO(null); setLines([]); setVendorId(''); return; }
    const res = await fetch(`${API_URL}/purchase-orders/${poId}`);
    const po: PO = await res.json();
    setSelectedPO(po);
    setVendorId(po.vendor?.id ?? po.vendorId);
    setLines((po.lines ?? []).map((l, i) => ({
      poLineId: l.id,
      lineNumber: i + 1,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    })));
  };

  const updateLine = (idx: number, field: keyof InvoiceLine, value: string) => {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const addLine = () => {
    setLines((prev) => [...prev, { poLineId: '', lineNumber: prev.length + 1, description: '', quantity: '1', unitPrice: '0' }]);
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = lines.reduce((s, l) => s + parseFloat(l.quantity || '0') * parseFloat(l.unitPrice || '0'), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseOrderId: selectedPO?.id || undefined,
          vendorId,
          invoiceNumber,
          invoiceDate,
          dueDate: dueDate || undefined,
          lines: lines.map((l) => ({
            poLineId: l.poLineId || undefined,
            lineNumber: l.lineNumber,
            description: l.description,
            quantity: parseFloat(l.quantity),
            unitPrice: parseFloat(l.unitPrice),
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Failed to create invoice');
      }
      const inv = await res.json();
      router.push(`/invoices/${inv.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block' as const, fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827' }}>Create Invoice</h1>

      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Invoice Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Link to Purchase Order (optional)</label>
              <select onChange={(e) => handlePOChange(e.target.value)} style={inputStyle}>
                <option value="">No PO (standalone invoice)</option>
                {pos.map((po) => (
                  <option key={po.id} value={po.id}>{po.number} — {po.vendor?.name ?? 'Unknown'}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Vendor Invoice Number *</label>
              <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required style={inputStyle} placeholder="e.g. INV-20240115" />
            </div>

            <div>
              <label style={labelStyle}>Invoice Date *</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Lines */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#111827' }}>Line Items</h2>
            <button type="button" onClick={addLine} style={{ fontSize: '0.8rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              + Add Line
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['#', 'Description', 'Qty', 'Unit Price', 'Total', ''].map((h) => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} style={{ borderBottom: idx < lines.length - 1 ? '1px solid #f3f4f6' : undefined }}>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#6b7280', width: '40px' }}>{idx + 1}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <input value={line.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', width: '80px' }}>
                    <input type="number" min="0" step="0.01" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} required style={{ ...inputStyle, width: '80px' }} />
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', width: '100px' }}>
                    <input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)} required style={{ ...inputStyle, width: '100px' }} />
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#374151', width: '90px' }}>
                    ${(parseFloat(line.quantity || '0') * parseFloat(line.unitPrice || '0')).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', width: '30px' }}>
                    <button type="button" onClick={() => removeLine(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>No lines. Add a line or select a PO above.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #e5e7eb' }}>
                <td colSpan={4} style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Total</td>
                <td colSpan={2} style={{ padding: '0.75rem', fontWeight: 700, color: '#111827' }}>
                  ${subtotal.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#991b1b', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={loading || !invoiceNumber || lines.length === 0}
            style={{ background: loading ? '#9ca3af' : '#111827', color: '#fff', padding: '0.625rem 1.5rem', borderRadius: '6px', border: 'none', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
          <a href="/invoices" style={{ padding: '0.625rem 1.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', color: '#374151', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
