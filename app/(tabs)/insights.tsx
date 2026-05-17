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
import { EmotionLabel, TradeEntry } from '@/types';

export default function InsightsScreen() {
  const { colors, spacing } = useTheme();
  const entries = useJournalStore((s) => s.entries);
  const closed = entries.filter((e) => e.status === 'closed' && e.outcome);

  const hasTrades = closed.length >= 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
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

// ---------------------------------------------------------------------------
// Sub-cards — each surfaces one behavioral insight
// ---------------------------------------------------------------------------

function WinRateCard({ entries, spacing }: { entries: TradeEntry[]; spacing: any }) {
  const wins = entries.filter((e) => e.outcome === 'win').length;
  const winRate = Math.round((wins / entries.length) * 100);

  return (
    <Card variant="default">
      <Text variant="footnote" weight="semibold" color="secondary" style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
        Win Rate
      </Text>
      <View style={[styles.row, { marginTop: spacing[2] }]}>
        <Text variant="headline" weight="bold" color={winRate >= 50 ? 'positive' : 'negative'}>
          {winRate}%
        </Text>
        <Text variant="footnote" color="tertiary">
          {wins} wins / {entries.length} trades
        </Text>
      </View>
    </Card>
  );
}

function EmotionImpactCard({ entries, spacing }: { entries: TradeEntry[]; spacing: any }) {
  const disruptiveAndLost = entries.filter(
    (e) => e.emotionBefore && isDisruptiveEmotion(e.emotionBefore.label) && e.outcome === 'loss'
  ).length;
  const disruptiveTotal = entries.filter(
    (e) => e.emotionBefore && isDisruptiveEmotion(e.emotionBefore.label)
  ).length;

  const calmWins = entries.filter(
    (e) => e.emotionBefore && !isDisruptiveEmotion(e.emotionBefore.label) && e.outcome === 'win'
  ).length;
  const calmTotal = entries.filter(
    (e) => e.emotionBefore && !isDisruptiveEmotion(e.emotionBefore.label)
  ).length;

  return (
    <Card variant="default">
      <Text variant="footnote" weight="semibold" color="secondary" style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
        Emotional State vs. Outcome
      </Text>
      <View style={{ gap: spacing[3], marginTop: spacing[3] }}>
        {calmTotal > 0 && (
          <View style={styles.row}>
            <Text variant="body" color="secondary">Win rate when calm</Text>
            <Badge label={`${Math.round((calmWins / calmTotal) * 100)}%`} tone="positive" />
          </View>
        )}
        {disruptiveTotal > 0 && (
          <View style={styles.row}>
            <Text variant="body" color="secondary">Loss rate when disrupted</Text>
            <Badge label={`${Math.round((disruptiveAndLost / disruptiveTotal) * 100)}%`} tone="negative" />
          </View>
        )}
        {calmTotal === 0 && disruptiveTotal === 0 && (
          <Text variant="body" color="tertiary">No emotional data recorded yet.</Text>
        )}
      </View>
    </Card>
  );
}

function RuleAdherenceCard({ entries, spacing }: { entries: TradeEntry[]; spacing: any }) {
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

  const totalFollowed = withRules.reduce((a, e) => a + e.rulesFollowed.length, 0);
  const totalAll = withRules.reduce((a, e) => a + e.rulesFollowed.length + e.rulesBroken.length, 0);
  const adherenceRate = Math.round((totalFollowed / totalAll) * 100);

  return (
    <Card variant="default">
      <Text variant="footnote" weight="semibold" color="secondary" style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
        Rule Adherence
      </Text>
      <View style={[styles.row, { marginTop: spacing[2] }]}>
        <Text variant="headline" weight="bold" color={adherenceRate >= 75 ? 'positive' : adherenceRate >= 50 ? 'warning' : 'negative'}>
          {adherenceRate}%
        </Text>
        <Text variant="footnote" color="tertiary">
          {totalFollowed} of {totalAll} rules followed
        </Text>
      </View>
    </Card>
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
