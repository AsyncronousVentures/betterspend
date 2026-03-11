'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function ApprovalRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    entityType: 'requisition',
    priority: 100,
    conditions: '{"field":"total","operator":"gte","value":1000}',
    steps: [{ stepOrder: 1, approverType: 'role', approverRole: 'approver', requiredCount: 1 }],
  });
  const [saving, setSaving] = useState(false);
  const [condError, setCondError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await api.approvalRules.list();
      setRules(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    let conditions: object;
    try {
      conditions = JSON.parse(form.conditions);
      setCondError('');
    } catch {
      setCondError('Conditions must be valid JSON');
      return;
    }
    setSaving(true);
    try {
      await api.approvalRules.create({
        name: form.name,
        description: form.description || undefined,
        entityType: form.entityType,
        priority: form.priority,
        conditions,
        steps: form.steps,
      });
      setShowForm(false);
      resetForm();
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this rule?')) return;
    try {
      await api.approvalRules.remove(id);
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  function resetForm() {
    setForm({
      name: '', description: '', entityType: 'requisition', priority: 100,
      conditions: '{"field":"total","operator":"gte","value":1000}',
      steps: [{ stepOrder: 1, approverType: 'role', approverRole: 'approver', requiredCount: 1 }],
    });
  }

  function addStep() {
    setForm((f) => ({
      ...f,
      steps: [...f.steps, { stepOrder: f.steps.length + 1, approverType: 'role', approverRole: 'approver', requiredCount: 1 }],
    }));
  }

  function removeStep(idx: number) {
    setForm((f) => ({ ...f, steps: f.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepOrder: i + 1 })) }));
  }

  function updateStep(idx: number, key: string, value: any) {
    setForm((f) => ({ ...f, steps: f.steps.map((s, i) => i === idx ? { ...s, [key]: value } : s) }));
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Approval Rules</h1>
        <button onClick={() => setShowForm(true)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
          + New Rule
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>New Approval Rule</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Entity Type</label>
              <select value={form.entityType} onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                <option value="requisition">Requisition</option>
                <option value="purchase_order">Purchase Order</option>
                <option value="invoice">Invoice</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Priority (lower = higher priority)</label>
              <input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Conditions (JSON) — e.g. {`{"field":"total","operator":"gte","value":5000}`}
              </label>
              <textarea
                value={form.conditions}
                onChange={(e) => setForm((f) => ({ ...f, conditions: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '0.5rem', border: `1px solid ${condError ? '#fca5a5' : '#d1d5db'}`, borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
              {condError && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{condError}</p>}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ fontWeight: 500, fontSize: '0.875rem' }}>Approval Steps</label>
              <button onClick={addStep} style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}>+ Step</button>
            </div>
            {form.steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', minWidth: '3rem' }}>Step {step.stepOrder}</span>
                <select value={step.approverType} onChange={(e) => updateStep(idx, 'approverType', e.target.value)} style={{ padding: '0.35rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.85rem' }}>
                  <option value="role">Role</option>
                  <option value="user">Specific User</option>
                  <option value="manager">Manager</option>
                </select>
                {step.approverType === 'role' && (
                  <select value={step.approverRole} onChange={(e) => updateStep(idx, 'approverRole', e.target.value)} style={{ padding: '0.35rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.85rem' }}>
                    {['approver', 'admin', 'finance'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
                <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Required:
                  <input type="number" min={1} value={step.requiredCount} onChange={(e) => updateStep(idx, 'requiredCount', Number(e.target.value))} style={{ width: '3rem', marginLeft: '0.25rem', padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                </label>
                {form.steps.length > 1 && (
                  <button onClick={() => removeStep(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.875rem' }}>Remove</button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={handleSave} disabled={saving || !form.name} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save Rule'}
            </button>
            <button onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: '0.5rem 1rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: '#6b7280' }}>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rules.map((rule) => (
            <div key={rule.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <div
                style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{rule.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>
                    Priority {rule.priority} · {rule.entityType || 'any'} · {rule.steps?.length || 0} step(s)
                    {!rule.isActive && <span style={{ marginLeft: '0.5rem', color: '#dc2626' }}>(Inactive)</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {rule.isActive && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeactivate(rule.id); }} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', border: '1px solid #fecaca', borderRadius: '4px', background: '#fff', color: '#dc2626', cursor: 'pointer' }}>
                      Deactivate
                    </button>
                  )}
                  <span style={{ color: '#9ca3af' }}>{expanded === rule.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expanded === rule.id && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '1rem 1.25rem', background: '#f9fafb' }}>
                  {rule.description && <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{rule.description}</p>}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Conditions: </span>
                    <code style={{ fontSize: '0.8rem', background: '#e5e7eb', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {typeof rule.conditions === 'string' ? rule.conditions : JSON.stringify(rule.conditions)}
                    </code>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Steps:</span>
                    {(rule.steps || []).map((step: any) => (
                      <div key={step.id} style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '0.25rem' }}>
                        Step {step.stepOrder}: {step.approverType === 'role' ? `Role: ${step.approverRole}` : `User: ${step.approverId}`} (requires {step.requiredCount})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {rules.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>No approval rules configured.</div>}
        </div>
      )}
    </div>
  );
}
