import { StyleSheet } from 'react-native';

export const Colors = {
  dark: {
    background:       '#0F1115',
    surface:          '#1C1F24',
    surfaceElevated:  '#242830',
    border:           '#2A2E38',
    borderSubtle:     '#1E2128',
    text:             '#F4F2ED',
    textSecondary:    '#DAD7CE',
    textTertiary:     '#8A8E8A',
    tint:             '#B89B5E',
    accent:           '#7A9E8A',
    sage:             '#5C615B',
    positive:         '#6B9E7A',
    negative:         '#C27070',
    warning:          '#C2A055',
    neutral:          '#8A8E8A',
    icon:             '#DAD7CE',
    tabIconDefault:   '#5C615B',
    tabIconSelected:  '#B89B5E',
  },
  light: {
    background:       '#F4F2ED',
    surface:          '#FFFFFF',
    surfaceElevated:  '#FFFFFF',
    border:           '#E2DFDA',
    borderSubtle:     '#EDE9E4',
    text:             '#0F1115',
    textSecondary:    '#3A3E46',
    textTertiary:     '#6B6F6A',
    tint:             '#B89B5E',
    accent:           '#5C615B',
    sage:             '#5C615B',
    positive:         '#4A7A5A',
    negative:         '#A05555',
    warning:          '#A08040',
    neutral:          '#8A8E8A',
    icon:             '#5C615B',
    tabIconDefault:   '#9A9E9A',
    tabIconSelected:  '#B89B5E',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColor = keyof typeof Colors.dark;

export type TypeGroup = 'brand' | 'heading' | 'body' | 'mono';
export type TypeWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

export type TypeRole =
  | 'hero'
  | 'display'
  | 'metric'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'data'
  | 'dataSm';

export interface TypeToken {
  group:         TypeGroup;
  size:          number;
  lhFactor:      number;
  defaultWeight: TypeWeight;
}

export const Typography: Record<TypeRole, TypeToken> = {
  hero:    { group: 'brand',   size: 64, lhFactor: 0.95, defaultWeight: 'regular' },
  display: { group: 'brand',   size: 48, lhFactor: 1.0,  defaultWeight: 'regular' },
  metric:  { group: 'brand',   size: 36, lhFactor: 1.1,  defaultWeight: 'regular' },
  h1:      { group: 'heading', size: 32, lhFactor: 1.2,  defaultWeight: 'bold'    },
  h2:      { group: 'heading', size: 24, lhFactor: 1.25, defaultWeight: 'semibold' },
  h3:      { group: 'heading', size: 20, lhFactor: 1.3,  defaultWeight: 'medium'  },
  h4:      { group: 'heading', size: 17, lhFactor: 1.35, defaultWeight: 'medium'  },
  bodyLg:  { group: 'body',    size: 17, lhFactor: 1.55, defaultWeight: 'regular' },
  body:    { group: 'body',    size: 15, lhFactor: 1.55, defaultWeight: 'regular' },
  bodySm:  { group: 'body',    size: 14, lhFactor: 1.5,  defaultWeight: 'regular' },
  caption: { group: 'body',    size: 14, lhFactor: 1.45, defaultWeight: 'regular' },
  data:    { group: 'mono',    size: 14, lhFactor: 1.4,  defaultWeight: 'regular' },
  dataSm:  { group: 'mono',    size: 14, lhFactor: 1.4,  defaultWeight: 'regular' },
} as const;

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

export const Radius = {
  none: 0,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 28,
  full: 9999,
} as const;

export const Borders = {
  thin:     1,
  hairline: StyleSheet.hairlineWidth,
} as const;

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
