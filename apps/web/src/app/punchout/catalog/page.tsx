'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';

interface CatalogItem {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  unitPrice: string;
  unitOfMeasure: string;
  currency: string;
  category: string | null;
}

interface CartItem {
  item: CatalogItem;
  quantity: number;
}

export default function PunchoutCatalogPage() {
  const searchParams = useSearchParams();
  const session = searchParams.get('session') ?? '';
  const vendorId = searchParams.get('vendor') ?? '';

  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any | null>(null);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    async function init() {
      if (!session || !vendorId) {
        setSessionValid(false);
        setLoading(false);
        return;
      }
      try {
        const sessionInfo = await api.punchout.getSession(session);
        setSessionValid(sessionInfo.valid);
        if (!sessionInfo.valid) { setLoading(false); return; }

        // Load catalog items for this vendor
        const data = await api.catalog.list({ vendorId });
        setItems((data as CatalogItem[]).filter((i: any) => i.isActive));
      } catch {
        setSessionValid(false);
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [session, vendorId]);

  const filtered = items.filter((i) =>
    !searchQ || i.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    (i.sku ?? '').toLowerCase().includes(searchQ.toLowerCase()) ||
    (i.category ?? '').toLowerCase().includes(searchQ.toLowerCase())
  );

  function addToCart(item: CatalogItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1 }];
    });
  }

  function updateQty(itemId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.item.id !== itemId));
    } else {
      setCart((prev) => prev.map((c) => c.item.id === itemId ? { ...c, quantity: qty } : c));
    }
  }

  const cartTotal = cart.reduce((sum, c) => sum + parseFloat(c.item.unitPrice) * c.quantity, 0);

  async function checkout() {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const orderMessage = {
        buyerCookie: session,
        itemIn: cart.map((c) => ({
          supplierPartId: c.item.sku ?? c.item.id,
          description: c.item.name,
          quantity: c.quantity,
          unitPrice: parseFloat(c.item.unitPrice),
          unitOfMeasure: c.item.unitOfMeasure,
          currency: c.item.currency,
        })),
      };
      const result = await api.punchout.orderReturn(session, orderMessage);
      setCheckoutResult(result);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  }

  function formatPrice(price: string, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(price));
  }

  if (loading) return <div style={{ padding: '2rem', color: '#6b7280', textAlign: 'center' }}>Loading catalog…</div>;

  if (!sessionValid) return (
    <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ color: '#111827', marginBottom: '0.5rem' }}>Invalid or Expired Session</h2>
      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
        This punchout session is no longer valid. Please restart the punchout from your procurement system.
      </p>
    </div>
  );

  if (checkoutResult) return (
    <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
      <h2 style={{ color: '#059669', marginBottom: '0.5rem' }}>Items Sent to Requisition</h2>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        {checkoutResult.lines?.length ?? 0} line(s) have been returned to your procurement system. You may close this window.
      </p>
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1.25rem', textAlign: 'left' }}>
        {checkoutResult.lines?.map((l: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: i < checkoutResult.lines.length - 1 ? '1px solid #d1fae5' : undefined, fontSize: '0.875rem' }}>
            <span style={{ color: '#374151' }}>{l.description} × {l.quantity}</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>${(l.unitPrice * l.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1e3a5f', color: '#fff', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Vendor Catalog</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Punchout Session</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {cart.length > 0 && (
            <div style={{ fontSize: '0.875rem', background: 'rgba(255,255,255,0.1)', padding: '0.375rem 0.75rem', borderRadius: '6px' }}>
              Cart: {cart.length} item{cart.length !== 1 ? 's' : ''} — ${cartTotal.toFixed(2)}
            </div>
          )}
          <button
            onClick={checkout}
            disabled={cart.length === 0 || checkingOut}
            style={{ background: cart.length > 0 ? '#3b82f6' : '#6b7280', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: cart.length > 0 ? 'pointer' : 'not-allowed', opacity: checkingOut ? 0.7 : 1 }}
          >
            {checkingOut ? 'Checking out…' : `Checkout (${cart.length})`}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main catalog */}
        <div>
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search catalog…"
            style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1rem', boxSizing: 'border-box', background: '#fff' }}
          />
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              {items.length === 0 ? 'No catalog items available for this vendor.' : 'No items match your search.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {filtered.map((item) => {
                const inCart = cart.find((c) => c.item.id === item.id);
                return (
                  <div key={item.id} style={{ background: '#fff', border: `1px solid ${inCart ? '#3b82f6' : '#e5e7eb'}`, borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {item.category && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.category}</span>
                    )}
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{item.name}</div>
                    {item.sku && <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#9ca3af' }}>SKU: {item.sku}</div>}
                    {item.description && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.description}</div>}
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#059669' }}>{formatPrice(item.unitPrice, item.currency)}<span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.75rem' }}>/{item.unitOfMeasure}</span></div>
                      {inCart ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <button onClick={() => updateQty(item.id, inCart.quantity - 1)} style={{ width: '24px', height: '24px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>−</button>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>{inCart.quantity}</span>
                          <button onClick={() => updateQty(item.id, inCart.quantity + 1)} style={{ width: '24px', height: '24px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>Add</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart sidebar */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem', position: 'sticky', top: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Cart ({cart.length})</h3>
          {cart.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>No items yet</p>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
                {cart.map((c) => (
                  <div key={c.item.id} style={{ fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: '#374151', fontWeight: 500, flex: 1 }}>{c.item.name}</span>
                      <button onClick={() => updateQty(c.item.id, 0)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1 }}>×</button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', color: '#6b7280' }}>
                      <span>{c.quantity} × {formatPrice(c.item.unitPrice, c.item.currency)}</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{formatPrice(String(parseFloat(c.item.unitPrice) * c.quantity), c.item.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={checkout}
                disabled={checkingOut}
                style={{ width: '100%', marginTop: '1rem', background: '#3b82f6', color: '#fff', border: 'none', padding: '0.625rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', opacity: checkingOut ? 0.7 : 1 }}
              >
                {checkingOut ? 'Checking out…' : 'Send to Requisition'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
