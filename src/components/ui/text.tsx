import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

import { FontFamily } from '@/theme/fonts';
import { TypeGroup, TypeRole, TypeWeight, Typography } from '@/theme';
import { useTheme } from '@/hooks/use-theme';

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

export interface TextProps extends RNTextProps {
  variant?: TypeRole;
  weight?: TypeWeight;
  color?: TextColor;
  caps?: boolean;
}

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
