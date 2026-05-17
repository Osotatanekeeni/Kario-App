import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/shared/empty-state';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Text, TextColor } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { computeMetrics, scoreColor, isDisruptiveEmotion } from '@/utils';
import { useJournalStore } from '@/store/journal-store';
import { TradeEntry } from '@/types';

export default function AnalyticsScreen() {
  const { colors, spacing } = useTheme();
  const entries = useJournalStore((s) => s.entries);
  const closed = entries.filter((e) => e.status === 'closed' && e.outcome);
  const allClosed = entries.filter((e) => e.status === 'closed');
  const metrics = computeMetrics(allClosed, 'all');
  const hasTrades = allClosed.length > 0;
  const hasInsights = closed.length >= 3;

  const tone = hasTrades ? scoreColor(metrics.overallScore) : 'neutral';
  const scoreTextColor = (tone === 'neutral' ? 'secondary' : tone) as TextColor;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScreenHeader
        title="Analytics"
        subtitle="Behavioral pattern analysis"
        showDivider
      />

      {!hasTrades ? (
        <EmptyState
          heading="No closed trades yet"
          body="Close your first trade to begin tracking your discipline score and behavioral patterns."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing[6], gap: spacing[5] }}
          showsVerticalScrollIndicator={false}
        >
          {/* Discipline score */}
          <Card
            variant="elevated"
            style={{ alignItems: 'center', paddingVertical: spacing[10] }}
          >
            <Text variant="caption" color="tertiary" weight="semibold" caps>
              Discipline Score
            </Text>
            <Text
              variant="hero"
              color={scoreTextColor}
              style={{ marginTop: spacing[3] }}
            >
              {metrics.overallScore}
            </Text>
            <Text variant="dataSm" color="tertiary" style={{ marginTop: spacing[2] }}>
              {metrics.totalTrades} closed {metrics.totalTrades === 1 ? 'trade' : 'trades'}
            </Text>
          </Card>

          {/* Discipline breakdown */}
          <View style={{ gap: spacing[2] }}>
            <Text variant="caption" color="tertiary" weight="semibold" caps>
              Discipline Breakdown
            </Text>
            <MetricRow
              label="Rules followed"
              value={`${Math.round(metrics.rulesFollowedRate * 100)}%`}
              tone={metrics.rulesFollowedRate >= 0.75 ? 'positive' : metrics.rulesFollowedRate >= 0.5 ? 'warning' : 'negative'}
            />
            <MetricRow
              label="Emotional consistency"
              value={`${metrics.emotionalConsistency}%`}
              tone={metrics.emotionalConsistency >= 70 ? 'positive' : metrics.emotionalConsistency >= 40 ? 'warning' : 'negative'}
            />
            <MetricRow
              label="Entry quality"
              value={`${metrics.entryQuality}%`}
              tone={metrics.entryQuality >= 70 ? 'positive' : metrics.entryQuality >= 40 ? 'warning' : 'negative'}
            />
            <MetricRow
              label="Exit quality"
              value={`${metrics.exitQuality}%`}
              tone={metrics.exitQuality >= 70 ? 'positive' : metrics.exitQuality >= 40 ? 'warning' : 'negative'}
            />
          </View>

          {/* Behavioral patterns — needs 3+ closed trades */}
          {hasInsights && (
            <>
              <Divider subtle />
              <WinRateCard entries={closed} spacing={spacing} />
              <EmotionImpactCard entries={closed} spacing={spacing} />
              <RuleAdherenceCard entries={closed} spacing={spacing} />
            </>
          )}

          {!hasInsights && allClosed.length > 0 && (
            <Card variant="outlined">
              <Text variant="body" color="tertiary">
                Close {3 - closed.length} more trade{3 - closed.length !== 1 ? 's' : ''} to unlock
                behavioral pattern analysis.
              </Text>
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function MetricRow({ label, value, tone }: { label: string; value: string; tone: BadgeTone }) {
  const { spacing } = useTheme();
  return (
    <Card variant="outlined" padding={spacing[4]}>
      <View style={styles.row}>
        <Text variant="body" color="secondary">{label}</Text>
        <Badge label={value} tone={tone} size="md" />
      </View>
    </Card>
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
  const calmEntries = entries.filter((e) => e.emotionBefore && !isDisruptiveEmotion(e.emotionBefore.label));
  const disruptiveEntries = entries.filter((e) => e.emotionBefore && isDisruptiveEmotion(e.emotionBefore.label));

  const calmWinRate = calmEntries.length > 0
    ? Math.round((calmEntries.filter((e) => e.outcome === 'win').length / calmEntries.length) * 100)
    : null;
  const disruptedLossRate = disruptiveEntries.length > 0
    ? Math.round((disruptiveEntries.filter((e) => e.outcome === 'loss').length / disruptiveEntries.length) * 100)
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
          <Text variant="body" color="tertiary">No emotional data recorded yet.</Text>
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
  const withRules = entries.filter((e) => e.rulesFollowed.length + e.rulesBroken.length > 0);

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
  const total = withRules.reduce((a, e) => a + e.rulesFollowed.length + e.rulesBroken.length, 0);
  const rate = Math.round((followed / total) * 100);

  return (
    <Card>
      <Text variant="caption" color="tertiary" weight="semibold" caps>Rule Adherence</Text>
      <View style={[styles.row, { marginTop: spacing[3] }]}>
        <Text variant="metric" color={rate >= 75 ? 'positive' : rate >= 50 ? 'warning' : 'negative'}>
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
