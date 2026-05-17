import React from 'react';
import { Pressable, StyleSheet, View, ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';

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
  const { colors, spacing, radius, shadows } = useTheme();

  const resolvedPadding = padding ?? spacing[4];

  const base = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: resolvedPadding,
  };

  const variantStyle = (() => {
    switch (variant) {
      case 'elevated':
        return { ...base, ...shadows.md };
      case 'outlined':
        return { ...base, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent', padding: 0 };
      default:
        return { ...base, ...shadows.sm };
    }
  })();

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [variantStyle, pressed && styles.pressed, style]}
        {...rest}
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
  pressed: {
    opacity: 0.85,
  },
});
