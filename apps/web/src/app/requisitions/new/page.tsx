'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { COLORS, SHADOWS } from '../../../lib/theme';

interface CatalogItem {
  id: string;
  name: string;
  sku: string | null;
  unitPrice: string;
  unitOfMeasure: string;
  currency: string;
  vendor: { id: string; name: string } | null;
}

interface LineItem {
  description: string;
  qty: string;
  uom: string;
  unitPrice: string;
  vendorId: string;
  catalogItemId: string;
}

const EMPTY_LINE: LineItem = { description: '', qty: '1', uom: 'each', unitPrice: '0', vendorId: '', catalogItemId: '' };

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.inputBorder}`,
  borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none',
  background: COLORS.white, color: COLORS.textPrimary,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.375rem',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function CatalogPicker({ onSelect, currentDescription }: {
  currentDescription: string;
  onSelect: (item: CatalogItem) => void;
}) {
  const [query, setQuery] = useState(currentDescription);
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function handleChange(val: string) {
    setQuery(val);
    if (debounce.current) clearTimeout(debounce.current);
    if (val.length < 2) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await api.catalog.search(val);
        setResults(items as CatalogItem[]);
        setOpen(true);
      } catch {
        // ignore
      } finally { setLoading(false); }
    }, 250);
  }

  function pick(item: CatalogItem) {
    setQuery(item.name);
    setOpen(false);
    setResults([]);
    onSelect(item);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text" value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
        placeholder="Search catalog or type description"
        style={inputStyle}
      />
      {loading && (
        <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: COLORS.textMuted }}>…</span>
      )}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: COLORS.white, border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px',
          boxShadow: SHADOWS.dropdown, maxHeight: '240px', overflowY: 'auto', marginTop: '2px',
        }}>
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={() => pick(item)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.625rem 0.875rem', background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${COLORS.hoverBg}` }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = COLORS.hoverBg; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.textPrimary }}>{item.name}</div>
              <div style={{ fontSize: '0.75rem', color: COLORS.textSecondary, marginTop: '2px' }}>
                {item.sku && <span style={{ marginRight: '0.5rem' }}>SKU: {item.sku}</span>}
                <span style={{ color: COLORS.accentBlueDark, fontWeight: 500 }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(parseFloat(item.unitPrice))} / {item.unitOfMeasure}
                </span>
                {item.vendor && <span style={{ marginLeft: '0.5rem', color: COLORS.textMuted }}>· {item.vendor.name}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewRequisitionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [currency, setCurrency] = useState('USD');
  const [neededBy, setNeededBy] = useState('');

  // Pre-populate from catalog item if passed via query params
  const prefill = searchParams.get('catalogItemId')
    ? {
        catalogItemId: searchParams.get('catalogItemId') ?? '',
        description: searchParams.get('description') ?? '',
        unitPrice: searchParams.get('unitPrice') ?? '0',
        uom: searchParams.get('uom') ?? 'each',
        vendorId: searchParams.get('vendorId') ?? '',
      }
    : null;

  const [lines, setLines] = useState<LineItem[]>([
    prefill ? { ...EMPTY_LINE, ...prefill } : { ...EMPTY_LINE },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const total = lines.reduce((sum, l) => sum + (parseFloat(l.qty) || 0) * (parseFloat(l.unitPrice) || 0), 0);

  function addLine() { setLines((prev) => [...prev, { ...EMPTY_LINE }]); }
  function removeLine(idx: number) { setLines((prev) => prev.filter((_, i) => i !== idx)); }
  function updateLine(idx: number, field: keyof LineItem, value: string) {
    setLines((prev) => prev.map((line, i) => (i === idx ? { ...line, [field]: value } : line)));
  }
  function applyFromCatalog(idx: number, item: CatalogItem) {
    setLines((prev) => prev.map((line, i) => i === idx ? {
      ...line,
      description: item.name,
      unitPrice: item.unitPrice,
      uom: item.unitOfMeasure,
      vendorId: item.vendor?.id ?? line.vendorId,
      catalogItemId: item.id,
    } : line));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Title is required.'); return; }
    setSubmitting(true);
    try {
      await api.requisitions.create({
        title: title.trim(),
        description: description.trim() || undefined,
        priority, currency,
        neededBy: neededBy || undefined,
        lines: lines.map((l) => ({
          description: l.description,
          quantity: parseFloat(l.qty) || 1,
          unitOfMeasure: l.uom || 'each',
          unitPrice: parseFloat(l.unitPrice) || 0,
          vendorId: l.vendorId || undefined,
          catalogItemId: l.catalogItemId || undefined,
        })),
      });
      router.push('/requisitions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '960px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/requisitions" style={{ color: COLORS.textSecondary, fontSize: '0.875rem', textDecoration: 'none' }}>
          &larr; Back to Requisitions
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0', color: COLORS.textPrimary }}>New Requisition</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.tableBorder}`, borderRadius: '8px', padding: '1.5rem', marginBottom: '1.25rem', boxShadow: SHADOWS.card }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1.25rem', color: COLORS.textPrimary }}>Details</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Title <span style={{ color: COLORS.accentRed }}>*</span></label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Office supplies Q1" style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes or justification" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Currency</label>
                <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Needed By</label>
                <input type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.tableBorder}`, borderRadius: '8px', padding: '1.5rem', marginBottom: '1.25rem', boxShadow: SHADOWS.card }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: COLORS.textPrimary }}>Line Items</h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: COLORS.textMuted }}>
                Start typing to search the catalog — selecting an item auto-fills price, UOM &amp; vendor
              </p>
            </div>
            <button type="button" onClick={addLine} style={{ background: 'transparent', border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px', padding: '0.375rem 0.875rem', fontSize: '0.8rem', cursor: 'pointer', color: COLORS.textSecondary, fontWeight: 500 }}>
              + Add Line
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 80px 80px 120px 100px 40px', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {['Description / Catalog', 'Qty', 'UOM', 'Unit Price', 'Total', ''].map((h) => (
              <div key={h} style={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>

          {lines.map((line, idx) => {
            const lineTotal = (parseFloat(line.qty) || 0) * (parseFloat(line.unitPrice) || 0);
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 80px 80px 120px 100px 40px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'start' }}>
                <CatalogPicker
                  currentDescription={line.description}
                  onSelect={(item) => applyFromCatalog(idx, item)}
                />
                <input type="number" value={line.qty} min="0" step="any"
                  onChange={(e) => updateLine(idx, 'qty', e.target.value)} style={inputStyle} />
                <input type="text" value={line.uom}
                  onChange={(e) => updateLine(idx, 'uom', e.target.value)} placeholder="each" style={inputStyle} />
                <input type="number" value={line.unitPrice} min="0" step="any"
                  onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)} style={inputStyle} />
                <div style={{ fontSize: '0.875rem', color: COLORS.textSecondary, fontVariantNumeric: 'tabular-nums', textAlign: 'right', paddingRight: '0.25rem', paddingTop: '0.5rem' }}>
                  {formatCurrency(lineTotal)}
                </div>
                <button type="button" onClick={() => removeLine(idx)} disabled={lines.length === 1}
                  style={{ background: 'transparent', border: 'none', cursor: lines.length === 1 ? 'not-allowed' : 'pointer', color: lines.length === 1 ? COLORS.inputBorder : COLORS.accentRed, fontSize: '1rem', padding: '0.25rem', marginTop: '0.375rem' }}>
                  &times;
                </button>
              </div>
            );
          })}

          <div style={{ borderTop: `1px solid ${COLORS.tableBorder}`, marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.textSecondary }}>Total</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: COLORS.textPrimary, fontVariantNumeric: 'tabular-nums', minWidth: '120px', textAlign: 'right' }}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {error && (
          <div style={{ background: COLORS.accentRedLight, border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.75rem 1rem', color: COLORS.accentRedDark, fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" disabled={submitting} style={{ background: COLORS.textPrimary, color: COLORS.white, border: 'none', borderRadius: '6px', padding: '0.625rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Saving...' : 'Create Requisition'}
          </button>
          <Link href="/requisitions" style={{ background: COLORS.white, color: COLORS.textSecondary, border: `1px solid ${COLORS.inputBorder}`, borderRadius: '6px', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewRequisitionPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: COLORS.textMuted }}>Loading…</div>}>
      <NewRequisitionContent />
    </Suspense>
  );
}
