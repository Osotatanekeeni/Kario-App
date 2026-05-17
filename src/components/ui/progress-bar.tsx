import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface ProgressBarProps {
  current: number;
  total: number;
  variant?: 'bar' | 'segmented';
}

export function ProgressBar({ current, total, variant = 'bar' }: ProgressBarProps) {
  const { colors, radius } = useTheme();

  if (variant === 'segmented') {
    return (
      <View style={styles.segmentedTrack}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                borderRadius: radius.full,
                backgroundColor: i < current ? colors.tint : colors.border,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  const progress = Math.min(current / total, 1);
  return (
    <View style={[styles.track, { backgroundColor: colors.border, borderRadius: radius.full }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${progress * 100}%`,
            backgroundColor: colors.tint,
            borderRadius: radius.full,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track:          { height: 3, overflow: 'hidden' },
  fill:           { height: '100%' },
  segmentedTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  segment: {
    flex: 1,
    height: 4,
  },
});
