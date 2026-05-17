import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Text } from './text';

export type BadgeTone = 'neutral' | 'positive' | 'negative' | 'warning' | 'tint' | 'accent' | 'sage';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

export function Badge({ label, tone = 'neutral', size = 'sm' }: BadgeProps) {
  const { colors, radius } = useTheme();
  const { bg, fg } = resolveTone(tone, colors);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: radius.sm,
          paddingHorizontal: size === 'md' ? 10 : 7,
          paddingVertical: size === 'md' ? 4 : 3,
        },
      ]}
    >
      <Text variant="dataSm" weight="medium" style={{ color: fg }}>
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
    case 'positive': return { bg: colors.positive + '28', fg: colors.positive };
    case 'negative': return { bg: colors.negative + '28', fg: colors.negative };
    case 'warning':  return { bg: colors.warning  + '28', fg: colors.warning  };
    case 'tint':     return { bg: colors.tint     + '22', fg: colors.tint     };
    case 'accent':   return { bg: colors.accent   + '28', fg: colors.accent   };
    case 'sage':     return { bg: colors.sage     + '28', fg: colors.sage     };
    default:         return { bg: colors.border,           fg: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
});
