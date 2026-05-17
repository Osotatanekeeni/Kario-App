import React from 'react';
import { Pressable, StyleSheet, View, ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: number;
  onPress?: () => void;
}

export function Card({
  variant = 'default',
  padding,
  onPress,
  style,
  children,
  ...rest
}: CardProps) {
  const { colors, spacing, radius, shadows, isDark } = useTheme();

  const p = padding ?? spacing[5];

  const base = {
    borderRadius: radius.lg,
    padding: p,
  };

  const variantStyle = (() => {
    switch (variant) {
      case 'elevated':
        return {
          ...base,
          backgroundColor: colors.surfaceElevated,
          ...(isDark
            ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }
            : shadows.md),
        };
      case 'outlined':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      default:
        return {
          ...base,
          backgroundColor: colors.surface,
          ...(isDark
            ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }
            : shadows.sm),
        };
    }
  })();

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [variantStyle, pressed && styles.pressed, style]}
        {...(rest as any)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[variantStyle, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.80 },
});
