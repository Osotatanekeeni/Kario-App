import { useFonts } from 'expo-font';
import { FONT_MAP } from '@/theme/fonts';

export function useAppFonts(): { loaded: boolean; error: Error | null } {
  const [loaded, error] = useFonts(FONT_MAP);
  return { loaded, error: error ?? null };
}
