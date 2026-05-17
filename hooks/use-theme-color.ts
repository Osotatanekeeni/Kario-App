import { Colors, ThemeColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColor
): string {
  const scheme = useColorScheme() ?? 'light';
  const colorFromProps = props[scheme];
  if (colorFromProps) return colorFromProps;
  return Colors[scheme][colorName];
}
