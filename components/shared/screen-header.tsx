import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showDivider?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  right,
  showDivider = false,
}: ScreenHeaderProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing[4],
            paddingHorizontal: spacing[6],
            paddingBottom: spacing[4],
          },
        ]}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text variant="title" weight="bold" serif>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="footnote" color="secondary" style={{ marginTop: 2 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      </View>
      {showDivider && <Divider />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  right: {
    marginLeft: 16,
  },
});
