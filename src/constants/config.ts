export const APP_NAME = 'Kario';
export const APP_VERSION = '1.0.0';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const MIN_TRADES_FOR_INSIGHTS = 3;
export const DISCIPLINE_SCORE_THRESHOLDS = {
  good: 75,
  ok: 50,
  low: 25,
} as const;
