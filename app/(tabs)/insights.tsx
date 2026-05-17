import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/shared/empty-state';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { isDisruptiveEmotion } from '@/lib/utils';
import { useJournalStore } from '@/store/journal-store';
import { TradeEntry } from '@/types';

export default function InsightsScreen() {
  const { colors, spacing } = useTheme();
  const entries = useJournalStore((s) => s.entries);
  const closed = entries.filter((e) => e.status === 'closed' && e.outcome);
  const hasTrades = closed.length >= 3;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScreenHeader
        title="Insights"
        subtitle="Behavioral pattern analysis"
        showDivider
      />

      {!hasTrades ? (
        <EmptyState
          heading="Not enough data yet"
          body="Close at least 3 trades to start seeing behavioral patterns emerge."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing[6], gap: spacing[4] }}
          showsVerticalScrollIndicator={false}
        >
          <WinRateCard entries={closed} spacing={spacing} />
          <EmotionImpactCard entries={closed} spacing={spacing} />
          <RuleAdherenceCard entries={closed} spacing={spacing} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function WinRateCard({
  entries,
  spacing,
}: {
  entries: TradeEntry[];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  const wins = entries.filter((e) => e.outcome === 'win').length;
  const rate = Math.round((wins / entries.length) * 100);

  return (
    <Card>
      <Text variant="caption" color="tertiary" weight="semibold" caps>Win Rate</Text>
      <View style={[styles.row, { marginTop: spacing[3] }]}>
        <Text variant="metric" color={rate >= 50 ? 'positive' : 'negative'}>
          {rate}%
        </Text>
        <Text variant="dataSm" color="tertiary">
          {wins} wins · {entries.length} trades
        </Text>
      </View>
    </Card>
  );
}

function EmotionImpactCard({
  entries,
  spacing,
}: {
  entries: TradeEntry[];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  const disruptiveEntries = entries.filter(
    (e) => e.emotionBefore && isDisruptiveEmotion(e.emotionBefore.label)
  );
  const calmEntries = entries.filter(
    (e) => e.emotionBefore && !isDisruptiveEmotion(e.emotionBefore.label)
  );

  const calmWinRate =
    calmEntries.length > 0
      ? Math.round(
          (calmEntries.filter((e) => e.outcome === 'win').length / calmEntries.length) * 100
        )
      : null;
  const disruptedLossRate =
    disruptiveEntries.length > 0
      ? Math.round(
          (disruptiveEntries.filter((e) => e.outcome === 'loss').length /
            disruptiveEntries.length) *
            100
        )
      : null;

  return (
    <Card>
      <Text variant="caption" color="tertiary" weight="semibold" caps>
        Emotion vs. Outcome
      </Text>
      <View style={{ gap: spacing[3], marginTop: spacing[3] }}>
        {calmWinRate !== null && (
          <View style={styles.row}>
            <Text variant="body" color="secondary">Win rate when calm</Text>
            <Badge label={`${calmWinRate}%`} tone="positive" size="md" />
          </View>
        )}
        {disruptedLossRate !== null && (
          <View style={styles.row}>
            <Text variant="body" color="secondary">Loss rate when disrupted</Text>
            <Badge label={`${disruptedLossRate}%`} tone="negative" size="md" />
          </View>
        )}
        {calmWinRate === null && disruptedLossRate === null && (
          <Text variant="body" color="tertiary">
            No emotional data recorded yet.
          </Text>
        )}
      </View>
    </Card>
  );
}

function RuleAdherenceCard({
  entries,
  spacing,
}: {
  entries: TradeEntry[];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  const withRules = entries.filter(
    (e) => e.rulesFollowed.length + e.rulesBroken.length > 0
  );

  if (withRules.length === 0) {
    return (
      <Card variant="outlined">
        <Text variant="body" color="tertiary">
          Log rule adherence on your trades to see patterns here.
        </Text>
      </Card>
    );
  }

  const followed = withRules.reduce((a, e) => a + e.rulesFollowed.length, 0);
  const total = withRules.reduce(
    (a, e) => a + e.rulesFollowed.length + e.rulesBroken.length,
    0
  );
  const rate = Math.round((followed / total) * 100);

  return (
    <Card>
      <Text variant="caption" color="tertiary" weight="semibold" caps>
        Rule Adherence
      </Text>
      <View style={[styles.row, { marginTop: spacing[3] }]}>
        <Text
          variant="metric"
          color={rate >= 75 ? 'positive' : rate >= 50 ? 'warning' : 'negative'}
        >
          {rate}%
        </Text>
        <Text variant="dataSm" color="tertiary">
          {followed} of {total} rules followed
        </Text>
      </View>
    </Card>
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
