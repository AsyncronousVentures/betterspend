'use client';

import { useState, useEffect } from 'react';

export interface BrandingSettings {
  app_name: string;
  app_logo_url: string;
  app_favicon_url: string;
  copyright_text: string;
  support_email: string;
  primary_color: string;
  accent_color: string;
  hide_powered_by: string;
}

const DEFAULTS: BrandingSettings = {
  app_name: 'BetterSpend',
  app_logo_url: '',
  app_favicon_url: '',
  copyright_text: '© 2026 BetterSpend. Open source under MIT License.',
  support_email: '',
  primary_color: '#3b82f6',
  accent_color: '#0f172a',
  hide_powered_by: 'false',
};

const CACHE_KEY = 'bs_branding';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function loadCache(): BrandingSettings | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function saveCache(data: BrandingSettings) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export function invalidateBrandingCache() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
}

export function useBranding(): BrandingSettings {
  const [branding, setBranding] = useState<BrandingSettings>(() => loadCache() ?? DEFAULTS);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    fetch(`${API_BASE}/api/v1/settings/branding`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: BrandingSettings | null) => {
        if (data) {
          const merged = { ...DEFAULTS, ...data };
          setBranding(merged);
          saveCache(merged);
        }
      })
      .catch(() => {});
  }, []);

  return branding;
}
