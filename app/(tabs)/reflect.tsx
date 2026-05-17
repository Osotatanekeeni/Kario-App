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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
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
          contentContainerStyle={{ padding: spacing[6], gap: spacing[5] }}
          showsVerticalScrollIndicator={false}
        >
          <Card variant="outlined">
            <Text variant="bodySm" color="sage" weight="medium" caps>
              Recent insight
            </Text>
            <Text variant="body" color="secondary" style={{ marginTop: spacing[3], lineHeight: 24 }}>
              You have {recentEntries.length} recent{' '}
              {recentEntries.length === 1 ? 'entry' : 'entries'}. Start a reflection
              session to uncover behavioral patterns.
            </Text>
          </Card>

          <Divider spacing={spacing[1]} />

          <View style={{ gap: spacing[3] }}>
            <Text variant="caption" color="tertiary" weight="semibold" caps>
              Recent trades to review
            </Text>
            {recentEntries.map((entry) => (
              <Card key={entry.id} onPress={() => {}}>
                <View style={styles.row}>
                  <View>
                    <Text variant="h4">{entry.symbol}</Text>
                    <Text variant="dataSm" color="tertiary" style={{ marginTop: 3 }}>
                      {formatDate(entry.createdAt)}
                    </Text>
                  </View>
                  <Text variant="bodySm" color="secondary" style={{ textTransform: 'capitalize' }}>
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
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
