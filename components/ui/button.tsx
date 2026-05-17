import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Text } from './text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const { colors, spacing, radius } = useTheme();

  const isDisabled = disabled || loading;

  const { bg, fg, borderColor } = resolveVariant(variant, colors);
  const { paddingH, paddingV, textSize } = resolveSize(size, spacing);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          borderRadius: radius.md,
          borderWidth: borderColor ? 1 : 0,
          borderColor: borderColor ?? 'transparent',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.45 : pressed ? 0.82 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            variant={textSize}
            weight="semibold"
            style={{ color: fg }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveVariant(
  variant: ButtonVariant,
  colors: ReturnType<typeof useTheme>['colors']
): { bg: string; fg: string; borderColor?: string } {
  switch (variant) {
    case 'primary':
      return { bg: colors.tint, fg: '#FFFFFF' };
    case 'secondary':
      return { bg: colors.surface, fg: colors.tint, borderColor: colors.border };
    case 'ghost':
      return { bg: 'transparent', fg: colors.tint };
    case 'destructive':
      return { bg: colors.negative, fg: '#FFFFFF' };
  }
}

function resolveSize(
  size: ButtonSize,
  spacing: ReturnType<typeof useTheme>['spacing']
): { paddingH: number; paddingV: number; textSize: 'footnote' | 'body' | 'callout' } {
  switch (size) {
    case 'sm': return { paddingH: spacing[3], paddingV: spacing[2], textSize: 'footnote' };
    case 'lg': return { paddingH: spacing[8], paddingV: spacing[4], textSize: 'callout' };
    default:   return { paddingH: spacing[5], paddingV: spacing[3], textSize: 'body' };
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
