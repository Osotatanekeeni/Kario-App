import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppFonts } from '@/hooks/use-app-fonts';

// Keep the splash screen visible until fonts are loaded.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

const KarioDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background:    Colors.dark.background,
    card:          Colors.dark.surface,
    text:          Colors.dark.text,
    border:        Colors.dark.border,
    primary:       Colors.dark.tint,
    notification:  Colors.dark.negative,
  },
};

const KarioLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background:    Colors.light.background,
    card:          Colors.light.surface,
    text:          Colors.light.text,
    border:        Colors.light.border,
    primary:       Colors.light.tint,
    notification:  Colors.light.negative,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { loaded, error } = useAppFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? KarioDarkTheme : KarioLightTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
