import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user-store';

export default function OnboardingScreen() {
  const { colors, spacing } = useTheme();
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  function handleContinue() {
    completeOnboarding();
    router.replace('/(tabs)/home');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.inner, { padding: spacing[8] }]}>
        <View style={{ gap: spacing[4] }}>
          <Text variant="display" style={{ lineHeight: 52 }}>
            Trade with clarity.
          </Text>
          <Text variant="bodyLg" color="secondary" style={{ lineHeight: 28 }}>
            Kario is your emotional performance OS. Log trades, track your psychology,
            and build the discipline that creates consistent results.
          </Text>
        </View>

        <View style={{ gap: spacing[2], marginTop: spacing[16] }}>
          <Text variant="caption" color="tertiary" style={{ textAlign: 'center' }}>
            Not a trading app. Not financial advice.
          </Text>
          <Text variant="caption" color="tertiary" style={{ textAlign: 'center' }}>
            A tool to understand yourself as a trader.
          </Text>
        </View>

        <View style={{ marginTop: spacing[8] }}>
          <Button
            label="Begin"
            variant="primary"
            fullWidth
            onPress={handleContinue}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center' },
});
