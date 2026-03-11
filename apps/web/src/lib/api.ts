const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(name + '='))
    ?.split('=')[1];
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getCookie('bs_token');
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  vendors: {
    list: () => apiFetch<any[]>('/vendors'),
    get: (id: string) => apiFetch<any>(`/vendors/${id}`),
    create: (data: unknown) => apiFetch<any>('/vendors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch<any>(`/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  users: {
    list: () => apiFetch<any[]>('/users'),
    get: (id: string) => apiFetch<any>(`/users/${id}`),
    update: (id: string, data: unknown) => apiFetch<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    addRole: (id: string, data: unknown) => apiFetch<any>(`/users/${id}/roles`, { method: 'POST', body: JSON.stringify(data) }),
    removeRole: (id: string, roleId: string) => apiFetch<void>(`/users/${id}/roles/${roleId}`, { method: 'DELETE' }),
    activate: (id: string) => apiFetch<any>(`/users/${id}/activate`, { method: 'PATCH' }),
    deactivate: (id: string) => apiFetch<any>(`/users/${id}/deactivate`, { method: 'PATCH' }),
  },
  departments: {
    list: () => apiFetch<any[]>('/departments'),
    get: (id: string) => apiFetch<any>(`/departments/${id}`),
    create: (data: unknown) => apiFetch<any>('/departments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch<any>(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch<void>(`/departments/${id}`, { method: 'DELETE' }),
  },
  projects: {
    list: () => apiFetch<any[]>('/projects'),
    get: (id: string) => apiFetch<any>(`/projects/${id}`),
    create: (data: unknown) => apiFetch<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch<any>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch<void>(`/projects/${id}`, { method: 'DELETE' }),
  },
  webhooks: {
    list: () => apiFetch<any[]>('/webhooks'),
    get: (id: string) => apiFetch<any>(`/webhooks/${id}`),
    create: (data: unknown) => apiFetch<any>('/webhooks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch<any>(`/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch<void>(`/webhooks/${id}`, { method: 'DELETE' }),
    deliveries: (id: string) => apiFetch<any[]>(`/webhooks/${id}/deliveries`),
  },
  approvalRules: {
    list: () => apiFetch<any[]>('/approval-rules'),
    get: (id: string) => apiFetch<any>(`/approval-rules/${id}`),
    create: (data: unknown) => apiFetch<any>('/approval-rules', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch<any>(`/approval-rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch<any>(`/approval-rules/${id}`, { method: 'DELETE' }),
  },
  catalog: {
    list: (params?: { vendorId?: string; category?: string; activeOnly?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.vendorId) q.set('vendorId', params.vendorId);
      if (params?.category) q.set('category', params.category);
      if (params?.activeOnly) q.set('activeOnly', 'true');
      return apiFetch<any[]>(`/catalog-items${q.toString() ? '?' + q : ''}`);
    },
    search: (q: string) => apiFetch<any[]>(`/catalog-items/search?q=${encodeURIComponent(q)}`),
    categories: () => apiFetch<string[]>('/catalog-items/categories'),
    get: (id: string) => apiFetch<any>(`/catalog-items/${id}`),
    create: (data: unknown) => apiFetch<any>('/catalog-items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch<any>(`/catalog-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch<void>(`/catalog-items/${id}`, { method: 'DELETE' }),
  },
  glMappings: {
    list: (targetSystem?: string) => apiFetch<any[]>(`/gl/mappings${targetSystem ? '?targetSystem=' + targetSystem : ''}`),
    create: (data: unknown) => apiFetch<any>('/gl/mappings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch<any>(`/gl/mappings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch<void>(`/gl/mappings/${id}`, { method: 'DELETE' }),
  },
  glExportJobs: {
    list: () => apiFetch<any[]>('/gl/export-jobs'),
    trigger: (invoiceId: string, targetSystem: string) =>
      apiFetch<any>(`/gl/export-jobs/trigger/${invoiceId}?targetSystem=${targetSystem}`, { method: 'POST' }),
  },
  requisitions: {
    list: () => apiFetch<any[]>('/requisitions'),
    get: (id: string) => apiFetch<any>(`/requisitions/${id}`),
    create: (data: unknown) => apiFetch<any>('/requisitions', { method: 'POST', body: JSON.stringify(data) }),
    submit: (id: string) => apiFetch<any>(`/requisitions/${id}/submit`, { method: 'POST' }),
    cancel: (id: string) => apiFetch<any>(`/requisitions/${id}/cancel`, { method: 'POST' }),
  },
  purchaseOrders: {
    list: () => apiFetch<any[]>('/purchase-orders'),
    get: (id: string) => apiFetch<any>(`/purchase-orders/${id}`),
    create: (data: unknown) => apiFetch<any>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    issue: (id: string) => apiFetch<any>(`/purchase-orders/${id}/issue`, { method: 'POST' }),
    changeOrder: (id: string, data: unknown) => apiFetch<any>(`/purchase-orders/${id}/change-order`, { method: 'POST', body: JSON.stringify(data) }),
  },
  invoices: {
    list: () => apiFetch<any[]>('/invoices'),
    get: (id: string) => apiFetch<any>(`/invoices/${id}`),
    create: (data: unknown) => apiFetch<any>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id: string) => apiFetch<any>(`/invoices/${id}/approve`, { method: 'POST' }),
    rerunMatch: (id: string) => apiFetch<any>(`/invoices/${id}/match`, { method: 'POST' }),
  },
  approvals: {
    list: () => apiFetch<any[]>('/approvals'),
    get: (id: string) => apiFetch<any>(`/approvals/${id}`),
    approve: (id: string, data: unknown) => apiFetch<any>(`/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
    reject: (id: string, data: unknown) => apiFetch<any>(`/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  },
  receiving: {
    list: () => apiFetch<any[]>('/receiving'),
    get: (id: string) => apiFetch<any>(`/receiving/${id}`),
    create: (data: unknown) => apiFetch<any>('/receiving', { method: 'POST', body: JSON.stringify(data) }),
    confirm: (id: string) => apiFetch<any>(`/receiving/${id}/confirm`, { method: 'POST' }),
  },
  budgets: {
    list: () => apiFetch<any[]>('/budgets'),
    get: (id: string) => apiFetch<any>(`/budgets/${id}`),
    create: (data: unknown) => apiFetch<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch<any>(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  audit: {
    list: (params?: { entityType?: string; entityId?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.entityType) q.set('entityType', params.entityType);
      if (params?.entityId) q.set('entityId', params.entityId);
      if (params?.limit) q.set('limit', String(params.limit));
      return apiFetch<any[]>(`/audit${q.toString() ? '?' + q : ''}`);
    },
  },
  reports: {
    download: (type: string, params?: Record<string, string>) => {
      const q = new URLSearchParams(params ?? {});
      const token = getCookie('bs_token');
      const url = `${API_BASE}/api/v1/reports/${type}${q.toString() ? '?' + q : ''}`;
      return fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    },
  },
  ocr: {
    createJob: (data: unknown) => apiFetch<any>('/ocr/jobs', { method: 'POST', body: JSON.stringify(data) }),
    getJob: (id: string) => apiFetch<any>(`/ocr/jobs/${id}`),
  },
  analytics: {
    kpis: () => apiFetch<any>('/analytics/kpis'),
    spendByVendor: () => apiFetch<any[]>('/analytics/spend/by-vendor'),
    spendByDepartment: () => apiFetch<any[]>('/analytics/spend/by-department'),
    monthlySpend: () => apiFetch<any[]>('/analytics/spend/monthly'),
    invoiceAging: () => apiFetch<any[]>('/analytics/invoice-aging'),
    poCycleTime: () => apiFetch<any>('/analytics/po-cycle-time'),
  },
};
