import { Colors, Fonts, FontSize, FontWeight, LineHeight, Spacing, Radius, Shadows, ColorScheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface Theme {
  scheme: ColorScheme;
  colors: (typeof Colors)[ColorScheme];
  fonts: typeof Fonts;
  fontSize: typeof FontSize;
  fontWeight: typeof FontWeight;
  lineHeight: typeof LineHeight;
  spacing: typeof Spacing;
  radius: typeof Radius;
  shadows: typeof Shadows;
  isDark: boolean;
}

export function useTheme(): Theme {
  const scheme = (useColorScheme() ?? 'light') as ColorScheme;
  return {
    scheme,
    colors: Colors[scheme],
    fonts: Fonts,
    fontSize: FontSize,
    fontWeight: FontWeight,
    lineHeight: LineHeight,
    spacing: Spacing,
    radius: Radius,
    shadows: Shadows,
    isDark: scheme === 'dark',
  };
}
