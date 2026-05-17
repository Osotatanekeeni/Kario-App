import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type TextVariant =
  | 'display'   // 36 — hero numbers, large headings
  | 'title'     // 30 — screen titles
  | 'headline'  // 24 — section headings
  | 'subhead'   // 20 — sub-sections
  | 'body'      // 15 — primary reading text
  | 'callout'   // 17 — emphasized inline text
  | 'footnote'  // 13 — secondary/supporting text
  | 'caption';  // 11 — labels, timestamps

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'tint'
  | 'accent'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'neutral';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  serif?: boolean;
}

export function Text({
  variant = 'body',
  weight,
  color = 'primary',
  serif = false,
  style,
  ...rest
}: TextProps) {
  const { colors, fontSize, fonts } = useTheme();

  const resolvedWeight = weight ?? defaultWeightFor(variant);
  const resolvedColor = colorFor(color, colors);
  const size = sizeFor(variant);
  const lh = lineHeightFor(variant);
  const fontFamily = serif ? fonts.serif : fonts.sans;

  return (
    <RNText
      style={[
        {
          fontSize: size,
          lineHeight: Math.round(size * lh),
          fontWeight: resolvedWeight,
          color: resolvedColor,
          fontFamily,
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

function sizeFor(variant: TextVariant): number {
  switch (variant) {
    case 'display':  return 36;
    case 'title':    return 30;
    case 'headline': return 24;
    case 'subhead':  return 20;
    case 'callout':  return 17;
    case 'body':     return 15;
    case 'footnote': return 13;
    case 'caption':  return 11;
  }
}

function lineHeightFor(variant: TextVariant): number {
  switch (variant) {
    case 'display':
    case 'title':    return 1.2;
    case 'headline':
    case 'subhead':  return 1.3;
    default:         return 1.5;
  }
}

function defaultWeightFor(variant: TextVariant): TextWeight {
  switch (variant) {
    case 'display':
    case 'title':    return 'bold';
    case 'headline': return 'semibold';
    case 'subhead':  return 'semibold';
    case 'callout':  return 'medium';
    default:         return 'regular';
  }
}

function colorFor(color: TextColor, colors: ReturnType<typeof useTheme>['colors']): string {
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
  }
}

const styles = StyleSheet.create({});
