import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/shared/empty-state';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/utils';
import { useJournalStore } from '@/store/journal-store';

export default function ReflectScreen() {
  const { colors, spacing } = useTheme();
  const entries = useJournalStore((s) => s.entries);
  const recentEntries = entries.slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScreenHeader
        title="Reflect"
        subtitle="Trading psychology coaching"
        showDivider
      />

      {entries.length === 0 ? (
        <EmptyState
          heading="Ready to reflect?"
          body="Log your first trade, then return here to review it with your AI mentor."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing[6], gap: spacing[4] }}
          showsVerticalScrollIndicator={false}
        >
          <Card variant="outlined">
            <Text variant="footnote" color="secondary" weight="semibold" style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Recent insight
            </Text>
            <Text variant="body" style={{ marginTop: spacing[2], lineHeight: 22 }}>
              You had {recentEntries.length} recent {recentEntries.length === 1 ? 'entry' : 'entries'}. Start a reflection session to uncover behavioral patterns.
            </Text>
          </Card>

          <Divider spacing={spacing[2]} />

          <View style={{ gap: spacing[3] }}>
            <Text variant="footnote" weight="semibold" color="secondary" style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Recent trades to review
            </Text>
            {recentEntries.map((entry) => (
              <Card key={entry.id} onPress={() => {}} variant="default">
                <View style={styles.row}>
                  <View>
                    <Text variant="callout" weight="semibold">{entry.symbol}</Text>
                    <Text variant="caption" color="tertiary">{formatDate(entry.createdAt)}</Text>
                  </View>
                  <Text variant="footnote" color="secondary" style={{ textTransform: 'capitalize' }}>
                    {entry.outcome ?? entry.status}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
