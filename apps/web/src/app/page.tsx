export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        BetterSpend
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Open Source Purchase Order Management System
      </p>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {[
          { title: 'Vendors', href: '/vendors', desc: 'Manage supplier relationships' },
          { title: 'Requisitions', href: '/requisitions', desc: 'Submit purchase requests' },
          { title: 'Purchase Orders', href: '/purchase-orders', desc: 'Track PO lifecycle' },
          { title: 'Receiving', href: '/receiving', desc: 'Log goods receipts' },
          { title: 'Invoices', href: '/invoices', desc: 'AP and 3-way matching' },
          { title: 'Budgets', href: '/budgets', desc: 'Budget management' },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{
              display: 'block',
              padding: '1.5rem',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'border-color 0.2s',
            }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {item.title}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{item.desc}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
