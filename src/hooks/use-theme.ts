import { Colors, ColorScheme, Radius, Shadows, Spacing, Typography } from '@/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface Theme {
  scheme:     ColorScheme;
  isDark:     boolean;
  colors:     (typeof Colors)[ColorScheme];
  spacing:    typeof Spacing;
  radius:     typeof Radius;
  shadows:    typeof Shadows;
  typography: typeof Typography;
}

export function useTheme(): Theme {
  const scheme = (useColorScheme() ?? 'dark') as ColorScheme;
  return {
    scheme,
    isDark:     scheme === 'dark',
    colors:     Colors[scheme],
    spacing:    Spacing,
    radius:     Radius,
    shadows:    Shadows,
    typography: Typography,
  };
}
