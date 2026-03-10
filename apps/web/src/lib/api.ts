const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  vendors: {
    list: () => apiFetch('/vendors'),
    get: (id: string) => apiFetch(`/vendors/${id}`),
    create: (data: unknown) =>
      apiFetch('/vendors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      apiFetch(`/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  users: {
    list: () => apiFetch('/users'),
    get: (id: string) => apiFetch(`/users/${id}`),
  },
};
