import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Color palette — calm, editorial, warm neutrals + restrained brand hues
// ---------------------------------------------------------------------------

export const Colors = {
  light: {
    background: '#F9F7F4',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E8E4DF',
    borderSubtle: '#F0EDE8',

    text: '#1C1917',
    textSecondary: '#6B6460',
    textTertiary: '#A09896',

    tint: '#2E4057',       // deep slate — calm authority
    accent: '#7B9E87',     // muted sage — balance, growth
    positive: '#4A7C6F',   // muted teal-green
    negative: '#A85751',   // muted terracotta
    warning: '#C2874A',    // muted amber
    neutral: '#8A8480',

    icon: '#6B6460',
    tabIconDefault: '#A09896',
    tabIconSelected: '#2E4057',
  },
  dark: {
    background: '#100F0E',
    surface: '#1C1A18',
    surfaceElevated: '#242220',
    border: '#2A2826',
    borderSubtle: '#1E1C1A',

    text: '#F5F0E8',
    textSecondary: '#9E9892',
    textTertiary: '#6B6760',

    tint: '#7BA3C8',       // muted cerulean
    accent: '#8FB99A',     // lighter sage
    positive: '#6BA891',
    negative: '#CC7B6A',
    warning: '#D4A06A',
    neutral: '#8A8480',

    icon: '#9E9892',
    tabIconDefault: '#6B6760',
    tabIconSelected: '#7BA3C8',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColor = keyof typeof Colors.light;

// ---------------------------------------------------------------------------
// Typography — editorial scale using native system fonts
// ---------------------------------------------------------------------------

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
})!;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  display: 36,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const LineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

// ---------------------------------------------------------------------------
// Spacing — 4px base grid
// ---------------------------------------------------------------------------

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Shadows — restrained; elevated surfaces only
// ---------------------------------------------------------------------------

export const Shadows = {
  sm: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
