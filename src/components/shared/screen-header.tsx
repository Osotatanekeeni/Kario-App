import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';

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
          styles.container,
          {
            paddingTop:        insets.top + spacing[4],
            paddingHorizontal: spacing[6],
            paddingBottom:     spacing[5],
          },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.titles}>
            <Text variant="h1">{title}</Text>
            {subtitle ? (
              <Text variant="bodySm" color="tertiary" style={{ marginTop: 3 }}>
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
  container: {},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  right: {
    marginLeft: 16,
    paddingBottom: 4,
  },
});
