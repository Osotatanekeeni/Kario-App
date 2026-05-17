import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

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
  const { paddingH, paddingV } = resolveSize(size, spacing);

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
          borderRadius: radius.lg,
          borderWidth: borderColor ? 1 : 0,
          borderColor: borderColor ?? 'transparent',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.4 : pressed ? 0.78 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            variant={size === 'sm' ? 'bodySm' : 'body'}
            weight="semibold"
            style={{ color: fg, fontSize: size !== 'sm' ? 16 : undefined }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function resolveVariant(
  variant: ButtonVariant,
  colors: ReturnType<typeof useTheme>['colors']
): { bg: string; fg: string; borderColor?: string } {
  switch (variant) {
    case 'primary':
      return { bg: colors.tint, fg: DARK_BG };
    case 'secondary':
      return { bg: colors.surface, fg: colors.tint, borderColor: colors.border };
    case 'ghost':
      return { bg: 'transparent', fg: colors.tint };
    case 'destructive':
      return { bg: colors.negative, fg: '#F4F2ED' };
  }
}

// Gold button always uses dark text for contrast
const DARK_BG = '#0F1115';

function resolveSize(
  size: ButtonSize,
  spacing: ReturnType<typeof useTheme>['spacing']
): { paddingH: number; paddingV: number } {
  switch (size) {
    case 'sm': return { paddingH: spacing[3], paddingV: spacing[2] };
    case 'lg': return { paddingH: spacing[8], paddingV: spacing[4] };
    default:   return { paddingH: spacing[6], paddingV: spacing[3] };
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
