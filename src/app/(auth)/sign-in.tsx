import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { signInWithEmail } from '@/services/auth';

export default function SignInScreen() {
  const { colors, spacing } = useTheme();
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    try {
      // Wire email/password fields when building this screen out
      await signInWithEmail('', '');
      router.replace('/(tabs)/home');
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inner, { padding: spacing[6] }]}
      >
        <View style={{ gap: spacing[2] }}>
          <Text variant="display">Kario</Text>
          <Text variant="body" color="secondary">
            Sign in to continue your trading psychology practice.
          </Text>
        </View>

        <View style={{ gap: spacing[4], marginTop: spacing[12] }}>
          <Button
            label="Sign In"
            variant="primary"
            fullWidth
            loading={loading}
            onPress={handleSignIn}
          />
          <Button
            label="Create account"
            variant="ghost"
            fullWidth
            onPress={() => router.push('/(auth)/sign-up')}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center' },
});
