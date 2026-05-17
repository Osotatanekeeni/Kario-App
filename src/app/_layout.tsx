import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { queryClient } from '@/lib/query-client';
import { useSession } from '@/features/auth/hooks';
import { useUserStore } from '@/store/user-store';
import { saveOnboarding } from '@/services/onboarding';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

const KarioDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background:   Colors.dark.background,
    card:         Colors.dark.surface,
    text:         Colors.dark.text,
    border:       Colors.dark.border,
    primary:      Colors.dark.tint,
    notification: Colors.dark.negative,
  },
};

const KarioLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background:   Colors.light.background,
    card:         Colors.light.surface,
    text:         Colors.light.text,
    border:       Colors.light.border,
    primary:      Colors.light.tint,
    notification: Colors.light.negative,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { loaded, error } = useAppFonts();
  const { session, loading: sessionLoading } = useSession();

  const hasSeenOnboarding = useUserStore((s) => s.hasSeenOnboarding);
  const profile            = useUserStore((s) => s.profile);
  const pendingOnboarding  = useUserStore((s) => s.pendingOnboarding);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const setPendingOnboarding = useUserStore((s) => s.setPendingOnboarding);

  const ready = (loaded || !!error) && !sessionLoading;
  const pendingSaveAttempted = useRef(false);

  // Save pending onboarding data once a session is established
  useEffect(() => {
    if (!session || profile?.onboardingCompleted || !pendingOnboarding || pendingSaveAttempted.current) return;
    pendingSaveAttempted.current = true;

    saveOnboarding({
      years_trading:     pendingOnboarding.yearsTrading,
      markets:           pendingOnboarding.markets,
      trading_session:   pendingOnboarding.tradingSession,
      trading_style:     pendingOnboarding.tradingStyle,
      main_challenge:    pendingOnboarding.mainChallenge,
      dominant_emotion:  pendingOnboarding.dominantEmotion,
      recurring_mistake: pendingOnboarding.recurringMistake,
      rules:             pendingOnboarding.rules,
      goals:             pendingOnboarding.goals,
      trader_identity:   pendingOnboarding.traderIdentity,
    })
      .catch(() => {})
      .finally(() => {
        setPendingOnboarding(null);
        completeOnboarding();
      });
  }, [session]);

  // Routing guard
  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();

    if (!session) {
      if (!hasSeenOnboarding) {
        router.replace('/(onboarding)');
      } else {
        router.replace('/(auth)/sign-in');
      }
    } else {
      router.replace('/(tabs)/home');
    }
  }, [ready, session, hasSeenOnboarding]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? KarioDarkTheme : KarioLightTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modals" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
