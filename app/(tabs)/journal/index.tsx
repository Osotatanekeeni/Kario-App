import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/shared/empty-state';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatRelative, emotionDisplayLabel } from '@/lib/utils';
import { useJournalStore } from '@/store/journal-store';
import { TradeEntry } from '@/types';

export default function JournalScreen() {
  const { colors, spacing } = useTheme();
  const entries = useJournalStore((s) => s.entries);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScreenHeader
        title="Journal"
        subtitle={entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : undefined}
        showDivider
        right={
          <IconSymbol name="square.and.pencil" color={colors.tint} size={22} />
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          heading="No entries yet"
          body="Begin by recording your first trade. Honest reflection is the edge."
          action={{ label: 'Log a Trade', onPress: () => {} }}
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing[6], gap: spacing[3] }}
          ItemSeparatorComponent={() => null}
          renderItem={({ item }) => <EntryCard entry={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function EntryCard({ entry }: { entry: TradeEntry }) {
  const { colors, spacing } = useTheme();

  const outcomeTone = entry.outcome === 'win'
    ? 'positive'
    : entry.outcome === 'loss'
    ? 'negative'
    : 'neutral';

  return (
    <Card onPress={() => {}} style={{ marginBottom: spacing[3] }}>
      <View style={styles.entryRow}>
        <View style={styles.entryMeta}>
          <Text variant="callout" weight="semibold">{entry.symbol}</Text>
          <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
            {formatRelative(entry.createdAt)}
          </Text>
        </View>
        <View style={styles.entryBadges}>
          {entry.outcome && (
            <Badge
              label={entry.outcome.charAt(0).toUpperCase() + entry.outcome.slice(1)}
              tone={outcomeTone as any}
            />
          )}
          <Badge
            label={entry.direction === 'long' ? 'Long' : 'Short'}
            tone={entry.direction === 'long' ? 'tint' : 'accent'}
          />
        </View>
      </View>

      {entry.disciplineScore !== undefined && (
        <>
          <Divider subtle spacing={spacing[3]} />
          <View style={styles.scoreRow}>
            <Text variant="caption" color="secondary">Discipline score</Text>
            <Text variant="footnote" weight="semibold" color={entry.disciplineScore >= 70 ? 'positive' : entry.disciplineScore >= 40 ? 'warning' : 'negative'}>
              {entry.disciplineScore}
            </Text>
          </View>
        </>
      )}

      {entry.emotionBefore && (
        <Text variant="caption" color="tertiary" style={{ marginTop: spacing[2] }}>
          Entered feeling {emotionDisplayLabel(entry.emotionBefore.label).toLowerCase()}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  entryMeta: {
    flex: 1,
  },
  entryBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
