import { StyleSheet } from 'react-native';

// ---------------------------------------------------------------------------
// COLOR PALETTE
//
// Dark mode is the primary design target.
// Light mode mirrors the same brand values with inverted luminosity.
// ---------------------------------------------------------------------------

export const Colors = {
  dark: {
    // Surfaces
    background:       '#0F1115',
    surface:          '#1C1F24',
    surfaceElevated:  '#242830',

    // Borders
    border:           '#2A2E38',
    borderSubtle:     '#1E2128',

    // Typography
    text:             '#F4F2ED',   // Pure Light — primary reading
    textSecondary:    '#DAD7CE',   // Sand — supporting text
    textTertiary:     '#8A8E8A',   // Muted — labels, timestamps

    // Brand
    tint:             '#B89B5E',   // Gold / Brass — restrained accent
    accent:           '#7A9E8A',   // Derived sage-green — calm accent
    sage:             '#5C615B',   // Muted Sage — structural color

    // Semantic
    positive:         '#6B9E7A',   // Calm muted green
    negative:         '#C27070',   // Calm muted red
    warning:          '#C2A055',   // Muted amber
    neutral:          '#8A8E8A',

    // Navigation
    icon:             '#DAD7CE',
    tabIconDefault:   '#5C615B',
    tabIconSelected:  '#B89B5E',
  },
  light: {
    // Surfaces
    background:       '#F4F2ED',   // Pure Light — warm paper white
    surface:          '#FFFFFF',
    surfaceElevated:  '#FFFFFF',

    // Borders
    border:           '#E2DFDA',
    borderSubtle:     '#EDE9E4',

    // Typography
    text:             '#0F1115',   // Dark — primary reading
    textSecondary:    '#3A3E46',
    textTertiary:     '#6B6F6A',

    // Brand (same gold across modes)
    tint:             '#B89B5E',
    accent:           '#5C615B',   // Sage as accent in light
    sage:             '#5C615B',

    // Semantic
    positive:         '#4A7A5A',
    negative:         '#A05555',
    warning:          '#A08040',
    neutral:          '#8A8E8A',

    // Navigation
    icon:             '#5C615B',
    tabIconDefault:   '#9A9E9A',
    tabIconSelected:  '#B89B5E',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColor = keyof typeof Colors.dark;

// ---------------------------------------------------------------------------
// TYPOGRAPHY — semantic token layer
//
// Each token encodes: font group, size, default weight, line-height factor.
// The actual fontFamily strings live in constants/fonts.ts.
// ---------------------------------------------------------------------------

export type TypeGroup = 'brand' | 'heading' | 'body' | 'mono';
export type TypeWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

export type TypeRole =
  // ── Brand (Boogaloo) — metrics, key numbers, welcome ──────────────────
  | 'hero'       // 64  — major P/L, welcome screen number
  | 'display'    // 48  — prominent metric value
  | 'metric'     // 36  — card-level key metric
  // ── Heading (Cause Variable) — structure, navigation ──────────────────
  | 'h1'         // 32  bold    — screen title
  | 'h2'         // 24  semibold — section heading
  | 'h3'         // 20  medium  — card heading, tab label
  | 'h4'         // 17  medium  — sub-label
  // ── Body (Urbanist) — readable content, forms, descriptions ───────────
  | 'bodyLg'     // 17  regular — callout text
  | 'body'       // 15  regular — primary body
  | 'bodySm'     // 13  regular — secondary / supporting
  | 'caption'    // 11  regular — labels, footnotes
  // ── Mono (JetBrains Mono) — statistics, timestamps, R:R ───────────────
  | 'data'       // 14  regular — stats, values, analytics
  | 'dataSm';    // 12  regular — timestamps, micro-data

export interface TypeToken {
  group:         TypeGroup;
  size:          number;
  lhFactor:      number;
  defaultWeight: TypeWeight;
}

export const Typography: Record<TypeRole, TypeToken> = {
  // Brand
  hero:    { group: 'brand',   size: 64, lhFactor: 0.95, defaultWeight: 'regular' },
  display: { group: 'brand',   size: 48, lhFactor: 1.0,  defaultWeight: 'regular' },
  metric:  { group: 'brand',   size: 36, lhFactor: 1.1,  defaultWeight: 'regular' },
  // Heading
  h1:      { group: 'heading', size: 32, lhFactor: 1.2,  defaultWeight: 'bold'    },
  h2:      { group: 'heading', size: 24, lhFactor: 1.25, defaultWeight: 'semibold' },
  h3:      { group: 'heading', size: 20, lhFactor: 1.3,  defaultWeight: 'medium'  },
  h4:      { group: 'heading', size: 17, lhFactor: 1.35, defaultWeight: 'medium'  },
  // Body
  bodyLg:  { group: 'body',    size: 17, lhFactor: 1.55, defaultWeight: 'regular' },
  body:    { group: 'body',    size: 15, lhFactor: 1.55, defaultWeight: 'regular' },
  bodySm:  { group: 'body',    size: 13, lhFactor: 1.5,  defaultWeight: 'regular' },
  caption: { group: 'body',    size: 11, lhFactor: 1.45, defaultWeight: 'regular' },
  // Mono
  data:    { group: 'mono',    size: 14, lhFactor: 1.4,  defaultWeight: 'regular' },
  dataSm:  { group: 'mono',    size: 12, lhFactor: 1.4,  defaultWeight: 'regular' },
} as const;

// ---------------------------------------------------------------------------
// SPACING — generous layout spacing on a 4px grid
// ---------------------------------------------------------------------------

export const Spacing = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ---------------------------------------------------------------------------
// RADIUS — 16–20px primary range per spec
// ---------------------------------------------------------------------------

export const Radius = {
  none: 0,
  sm:   8,
  md:   12,
  lg:   16,    // primary card radius
  xl:   20,    // primary modal / sheet radius
  '2xl':28,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// BORDERS — soft, minimal
// ---------------------------------------------------------------------------

export const Borders = {
  thin:     1,
  hairline: StyleSheet.hairlineWidth,
} as const;

// ---------------------------------------------------------------------------
// SHADOWS — minimal, used only on elevated surfaces
//
// Dark mode: border provides depth; shadows are near-invisible.
// Light mode: subtle warmth shadows.
// ---------------------------------------------------------------------------

export const Shadows = {
  none: {},
  sm: {
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  float: {
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
