import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/ui/google-icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import {
  isAppleAuthAvailable,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/services/auth';

type Mode = 'sign_in' | 'sign_up';

export default function SignInScreen() {
  const { colors, spacing } = useTheme();

  const [mode, setMode] = useState<Mode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'email' | 'apple' | 'google' | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAvailable);
  }, []);

  function clearError() { setError(''); }

  async function handleEmail() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading('email');
    setError('');
    try {
      if (mode === 'sign_in') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  async function handleApple() {
    setLoading('apple');
    setError('');
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        setError(e.message ?? 'Apple Sign In failed.');
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setLoading('google');
    setError('');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message ?? 'Google Sign In failed.');
    } finally {
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { padding: spacing[6] }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={[styles.brand, { marginBottom: spacing[10] }]}>
            <Text variant="display">Kario</Text>
            <Text variant="body" color="secondary" style={{ marginTop: spacing[2] }}>
              A performance OS for disciplined traders.
            </Text>
          </View>

          {/* Email form */}
          <View style={{ gap: spacing[4] }}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => { setEmail(t); clearError(); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
            />
            <Input
              label="Password"
              placeholder={mode === 'sign_up' ? 'Create a password' : 'Your password'}
              value={password}
              onChangeText={(t) => { setPassword(t); clearError(); }}
              secureTextEntry
              autoComplete={mode === 'sign_up' ? 'new-password' : 'current-password'}
              returnKeyType="done"
              onSubmitEditing={handleEmail}
            />

            {error ? (
              <Text variant="bodySm" color="negative">{error}</Text>
            ) : null}

            <Button
              label={mode === 'sign_in' ? 'Sign In' : 'Create Account'}
              variant="primary"
              fullWidth
              loading={loading === 'email'}
              disabled={isLoading}
              onPress={handleEmail}
            />
          </View>

          {/* Divider */}
          <View style={[styles.dividerRow, { marginVertical: spacing[6] }]}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={{ fontSize: 14, color: colors.textTertiary, marginHorizontal: spacing[3] }}>
              or
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social auth — unified style, Google then Apple */}
          <View style={{ gap: spacing[3] }}>
            <SocialButton
              label="Continue with Google"
              icon={<GoogleIcon size={24} />}
              loading={loading === 'google'}
              disabled={isLoading}
              onPress={handleGoogle}
              colors={colors}
              spacing={spacing}
            />

            {appleAvailable && (
              <SocialButton
                label="Continue with Apple"
                icon={<FontAwesome name="apple" size={24} color={colors.text} />}
                loading={loading === 'apple'}
                disabled={isLoading}
                onPress={handleApple}
                colors={colors}
                spacing={spacing}
              />
            )}
          </View>

          {/* Mode toggle */}
          <Pressable
            style={[styles.toggle, { marginTop: spacing[8] }]}
            onPress={() => { setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in'); setError(''); }}
          >
            <Text style={{ fontSize: 16, color: colors.textTertiary }}>
              {mode === 'sign_in' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={{ fontSize: 16, color: colors.tint, fontWeight: '500' }}>
                {mode === 'sign_in' ? 'Sign up' : 'Sign in'}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// SocialButton — unified style for all social providers
// ---------------------------------------------------------------------------

function SocialButton({
  label,
  icon,
  loading,
  disabled,
  onPress,
  colors,
  spacing,
}: {
  label: string;
  icon: React.ReactNode;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  colors: any;
  spacing: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.socialBtn,
        {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingVertical: spacing[3] + 1,
          paddingHorizontal: spacing[4],
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.tint} />
      ) : (
        <>
          <View style={styles.iconSlot}>{icon}</View>
          <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  flex:        { flex: 1 },
  content:     { flexGrow: 1, justifyContent: 'center' },
  brand:       { alignItems: 'flex-start' },
  socialBtn:   {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
  },
  iconSlot:    { width: 24, alignItems: 'center', justifyContent: 'center' },
  dividerRow:  { flexDirection: 'row', alignItems: 'center' },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  toggle:      { alignItems: 'center' },
});
