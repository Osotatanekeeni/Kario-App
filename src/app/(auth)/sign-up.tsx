import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { signUpWithEmail } from '@/services/auth';

export default function SignUpScreen() {
  const { colors, spacing } = useTheme();
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    try {
      await signUpWithEmail('', '');
      router.replace('/(onboarding)');
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
          <Text variant="h1">Create account</Text>
          <Text variant="body" color="secondary">
            Begin your trading psychology practice.
          </Text>
        </View>

        <View style={{ gap: spacing[4], marginTop: spacing[12] }}>
          <Button
            label="Create Account"
            variant="primary"
            fullWidth
            loading={loading}
            onPress={handleSignUp}
          />
          <Button
            label="Already have an account"
            variant="ghost"
            fullWidth
            onPress={() => router.back()}
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
