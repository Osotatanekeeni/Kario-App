import { useFonts } from 'expo-font';
import { FONT_MAP } from '@/constants/fonts';

/**
 * Loads all Kario typefaces (Boogaloo, Cause, Urbanist, JetBrains Mono).
 * Call this once in the root layout. Hide the splash screen only after
 * this returns { loaded: true } or { error: ... }.
 */
export function useAppFonts(): { loaded: boolean; error: Error | null } {
  const [loaded, error] = useFonts(FONT_MAP);
  return { loaded, error: error ?? null };
}
