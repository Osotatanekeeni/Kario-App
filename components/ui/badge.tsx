import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Text } from './text';

type BadgeTone = 'neutral' | 'positive' | 'negative' | 'warning' | 'tint' | 'accent';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { colors, radius } = useTheme();

  const { bg, fg } = resolveTone(tone, colors);

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: radius.full }]}>
      <Text variant="caption" weight="semibold" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}

function resolveTone(
  tone: BadgeTone,
  colors: ReturnType<typeof useTheme>['colors']
): { bg: string; fg: string } {
  switch (tone) {
    case 'positive':  return { bg: colors.positive + '22', fg: colors.positive };
    case 'negative':  return { bg: colors.negative + '22', fg: colors.negative };
    case 'warning':   return { bg: colors.warning  + '22', fg: colors.warning };
    case 'tint':      return { bg: colors.tint     + '18', fg: colors.tint };
    case 'accent':    return { bg: colors.accent   + '22', fg: colors.accent };
    default:          return { bg: colors.border,          fg: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
});
