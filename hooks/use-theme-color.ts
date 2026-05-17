import { Colors, ThemeColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColor
): string {
  const scheme = (useColorScheme() ?? 'dark') as keyof typeof Colors;
  const fromProps = props[scheme as 'light' | 'dark'];
  if (fromProps) return fromProps;
  return Colors[scheme][colorName];
}
