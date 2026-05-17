import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

import { FontFamily } from '@/constants/fonts';
import { TypeGroup, TypeRole, TypeWeight, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ---------------------------------------------------------------------------
// Color roles
// ---------------------------------------------------------------------------

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'tint'
  | 'accent'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'neutral'
  | 'sage';

// ---------------------------------------------------------------------------
// Props
//
// We use `variant` (not `role`) to avoid conflicting with React Native's
// built-in TextProps.role which is reserved for accessibility purposes.
// ---------------------------------------------------------------------------

export interface TextProps extends RNTextProps {
  /** Semantic typography variant — determines font family, size, default weight. */
  variant?: TypeRole;
  /**
   * Weight override within the variant's font family.
   * Ignored for 'brand' (Boogaloo only ships Regular).
   */
  weight?: TypeWeight;
  /** Semantic color token. */
  color?: TextColor;
  /** Uppercase with tracking — for overline labels and caps headers. */
  caps?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Text({
  variant = 'body',
  weight,
  color = 'primary',
  caps = false,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();

  const token = Typography[variant];
  const resolvedWeight = weight ?? token.defaultWeight;
  const fontFamily = resolveFontFamily(token.group, resolvedWeight);
  const fontSize = token.size;
  const lineHeight = Math.round(fontSize * token.lhFactor);
  const resolvedColor = resolveColor(color, colors);

  return (
    <RNText
      style={[
        {
          fontFamily,
          fontSize,
          lineHeight,
          color: resolvedColor,
          letterSpacing: caps ? 0.7 : undefined,
          textTransform: caps ? 'uppercase' : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveFontFamily(group: TypeGroup, weight: TypeWeight): string {
  switch (group) {
    case 'brand':
      return FontFamily.brand;

    case 'heading': {
      const map: Record<TypeWeight, string> = {
        light:    FontFamily.heading.light,
        regular:  FontFamily.heading.regular,
        medium:   FontFamily.heading.medium,
        semibold: FontFamily.heading.semibold,
        bold:     FontFamily.heading.bold,
      };
      return map[weight] ?? FontFamily.heading.regular;
    }

    case 'body': {
      const map: Record<TypeWeight, string> = {
        light:    FontFamily.body.light,
        regular:  FontFamily.body.regular,
        medium:   FontFamily.body.medium,
        semibold: FontFamily.body.semibold,
        bold:     FontFamily.body.bold,
      };
      return map[weight] ?? FontFamily.body.regular;
    }

    case 'mono':
      return weight === 'medium'
        ? FontFamily.mono.medium
        : FontFamily.mono.regular;
  }
}

function resolveColor(
  color: TextColor,
  colors: ReturnType<typeof useTheme>['colors']
): string {
  switch (color) {
    case 'primary':   return colors.text;
    case 'secondary': return colors.textSecondary;
    case 'tertiary':  return colors.textTertiary;
    case 'tint':      return colors.tint;
    case 'accent':    return colors.accent;
    case 'positive':  return colors.positive;
    case 'negative':  return colors.negative;
    case 'warning':   return colors.warning;
    case 'neutral':   return colors.neutral;
    case 'sage':      return colors.sage;
  }
}
