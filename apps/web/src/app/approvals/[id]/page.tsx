import Link from 'next/link';
import { notFound } from 'next/navigation';
import ApprovalDetailActions from './actions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

interface ApprovalAction {
  id: string;
  step: number;
  actorId: string;
  action: string;
  comment: string | null;
  createdAt: string;
}

interface ApprovalRule {
  id: string;
  name: string;
}

interface ApprovalRequest {
  id: string;
  approvableType: string;
  approvableId: string;
  currentStep: number;
  status: string;
  createdAt: string;
  rule?: ApprovalRule;
  actions?: ApprovalAction[];
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending:   { background: '#fef3c7', color: '#92400e' },
  approved:  { background: '#d1fae5', color: '#065f46' },
  rejected:  { background: '#fee2e2', color: '#991b1b' },
  cancelled: { background: '#f3f4f6', color: '#6b7280' },
};

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  approved:  'Approved',
  rejected:  'Rejected',
  cancelled: 'Cancelled',
};

const ACTION_COLORS: Record<string, { background: string; color: string }> = {
  approved:  { background: '#d1fae5', color: '#065f46' },
  rejected:  { background: '#fee2e2', color: '#991b1b' },
  commented: { background: '#dbeafe', color: '#1e40af' },
  delegated: { background: '#ede9fe', color: '#5b21b6' },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_COLORS[status] ?? { background: '#f3f4f6', color: '#374151' };
  return (
    <span
      style={{
        ...style,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_COLORS[action] ?? { background: '#f3f4f6', color: '#374151' };
  return (
    <span
      style={{
        ...style,
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {action}
    </span>
  );
}

function truncateId(id: string): string {
  return id.length > 8 ? `…${id.slice(-8)}` : id;
}

async function getApproval(id: string): Promise<ApprovalRequest | null> {
  try {
    const res = await fetch(`${API_URL}/approvals/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const approval = await getApproval(id);

  if (!approval) notFound();

  const actions: ApprovalAction[] = approval.actions ?? [];

  return (
    <div style={{ padding: '2rem', maxWidth: '960px' }}>
      {/* Back link */}
      <Link
        href="/approvals"
        style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}
      >
        &larr; Back to Approvals Queue
      </Link>

      {/* Header card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1.5rem',
          marginTop: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: 0,
                  color: '#111827',
                  textTransform: 'capitalize',
                }}
              >
                {approval.approvableType.replace(/_/g, ' ')}
              </h1>
              <StatusBadge status={approval.status} />
            </div>
            <p
              style={{
                margin: '0.375rem 0 0',
                fontSize: '0.875rem',
                color: '#9ca3af',
                fontFamily: 'monospace',
              }}
            >
              ID: {truncateId(approval.approvableId)}
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f3f4f6',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Rule', value: approval.rule?.name ?? '—' },
            { label: 'Current Step', value: `Step ${approval.currentStep}` },
            { label: 'Created', value: new Date(approval.createdAt).toLocaleDateString() },
          ].map((item) => (
            <div key={item.label}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#374151', marginTop: '0.25rem' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions log card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>
            Action History
          </h2>
        </div>

        {actions.length === 0 ? (
          <div
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '0.875rem',
            }}
          >
            No actions recorded yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Step', 'Actor', 'Action', 'Comment', 'Date'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '0.625rem 1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#6b7280',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actions.map((act, idx) => (
                <tr
                  key={act.id}
                  style={{
                    borderBottom: idx < actions.length - 1 ? '1px solid #f3f4f6' : undefined,
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                    {act.step}
                  </td>
                  <td
                    style={{
                      padding: '0.75rem 1rem',
                      color: '#9ca3af',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                    }}
                  >
                    {truncateId(act.actorId)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <ActionBadge action={act.action} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>
                    {act.comment ?? <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>
                    {new Date(act.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Client actions island */}
      <ApprovalDetailActions id={approval.id} status={approval.status} />
    </div>
  );
}
