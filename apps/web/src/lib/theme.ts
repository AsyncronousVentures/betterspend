// Centralized design tokens for BetterSpend UI
// All components import from here instead of hardcoding hex values

export const COLORS = {
  // Sidebar
  sidebarBg: '#0f172a',
  sidebarHover: '#1e293b',
  sidebarBorder: '#1e293b',
  sidebarText: '#94a3b8',
  sidebarTextActive: '#f8fafc',
  sidebarAccent: '#3b82f6',
  sidebarGroupLabel: '#64748b',

  // Topbar
  topbarBg: '#ffffff',
  topbarBorder: '#e2e8f0',

  // Content area
  contentBg: '#f8fafc',

  // Cards
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',

  // Text
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',

  // Borders
  border: '#e2e8f0',

  // Status / accents
  badgeRed: '#ef4444',
  accentBlue: '#3b82f6',
  accentBlueDark: '#2563eb',
  accentBlueLight: '#eff6ff',
  accentGreen: '#10b981',
  accentGreenDark: '#065f46',
  accentGreenLight: '#ecfdf5',
  accentAmber: '#f59e0b',
  accentAmberDark: '#92400e',
  accentAmberLight: '#fffbeb',
  accentPurple: '#8b5cf6',
  accentPurpleDark: '#5b21b6',
  accentPurpleLight: '#f5f3ff',
  accentRed: '#ef4444',
  accentRedDark: '#991b1b',
  accentRedLight: '#fef2f2',

  // Misc
  white: '#ffffff',
  inputBorder: '#d1d5db',
  inputBorderFocus: '#3b82f6',
  hoverBg: '#f9fafb',
  tableBorder: '#e5e7eb',
  tableHeaderBg: '#f9fafb',
} as const;

export const SHADOWS = {
  card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  cardHover: '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
  dropdown: '0 4px 20px rgba(0,0,0,0.12)',
  overlay: 'rgba(0,0,0,0.4)',
  focusRing: '0 0 0 3px rgba(59,130,246,0.15)',
  auth: '0 4px 24px rgba(0,0,0,0.06)',
} as const;

export const FONT = {
  xs: '0.75rem',
  sm: '0.8125rem',
  base: '0.875rem',
  md: '0.9375rem',
  lg: '1.125rem',
  xl: '1.5rem',
  xxl: '1.75rem',
} as const;
