import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/shared/empty-state';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Text, TextColor } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { computeMetrics, scoreColor } from '@/lib/utils';
import { useJournalStore } from '@/store/journal-store';

export default function DisciplineScreen() {
  const { colors, spacing } = useTheme();
  const entries = useJournalStore((s) => s.entries);
  const closed = entries.filter((e) => e.status === 'closed');
  const metrics = computeMetrics(closed, 'all');
  const hasTrades = closed.length > 0;

  const tone = hasTrades ? scoreColor(metrics.overallScore) : 'neutral';
  const scoreTextColor = (tone === 'neutral' ? 'secondary' : tone) as TextColor;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScreenHeader
        title="Discipline"
        subtitle="Your behavioral score"
        showDivider
      />

      {!hasTrades ? (
        <EmptyState
          heading="No closed trades yet"
          body="Close your first trade to begin tracking your discipline score."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing[6], gap: spacing[5] }}
          showsVerticalScrollIndicator={false}
        >
          {/* Primary score card */}
          <Card
            variant="elevated"
            style={{ alignItems: 'center', paddingVertical: spacing[10] }}
          >
            <Text variant="caption" color="tertiary" weight="semibold" caps>
              Overall Score
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

          {/* Sub-metric breakdown */}
          <View style={{ gap: spacing[2] }}>
            <Text variant="caption" color="tertiary" weight="semibold" caps>
              Breakdown
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
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function MetricRow({ label, value, tone }: { label: string; value: string; tone: BadgeTone }) {
  const { spacing } = useTheme();

  return (
    <Card variant="outlined" padding={spacing[4]}>
      <View style={styles.metricRow}>
        <Text variant="body" color="secondary">{label}</Text>
        <Badge label={value} tone={tone} size="md" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
