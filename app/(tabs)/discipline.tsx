import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/shared/empty-state';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { computeMetrics, scoreColor } from '@/lib/utils';
import { useJournalStore } from '@/store/journal-store';

export default function DisciplineScreen() {
  const { colors, spacing } = useTheme();
  const entries = useJournalStore((s) => s.entries);
  const closedEntries = entries.filter((e) => e.status === 'closed');
  const metrics = computeMetrics(closedEntries, 'all');

  const hasTrades = closedEntries.length > 0;
  const tone = hasTrades ? scoreColor(metrics.overallScore) : 'neutral';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
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
          contentContainerStyle={{ padding: spacing[6], gap: spacing[4] }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main score card */}
          <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: spacing[8] }}>
            <Text variant="caption" weight="semibold" color="secondary" style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Overall Score
            </Text>
            <Text
              variant="display"
              weight="bold"
              color={tone}
              serif
              style={{ marginTop: spacing[2], fontSize: 64 }}
            >
              {metrics.overallScore}
            </Text>
            <Text variant="caption" color="tertiary" style={{ marginTop: spacing[1] }}>
              Based on {metrics.totalTrades} closed {metrics.totalTrades === 1 ? 'trade' : 'trades'}
            </Text>
          </Card>

          <Divider spacing={spacing[2]} />

          {/* Sub-metrics */}
          <View style={{ gap: spacing[3] }}>
            <Text variant="footnote" weight="semibold" color="secondary" style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
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

function MetricRow({ label, value, tone }: { label: string; value: string; tone: 'positive' | 'negative' | 'warning' | 'neutral' }) {
  return (
    <Card variant="outlined" padding={12}>
      <View style={styles.metricRow}>
        <Text variant="body" color="secondary">{label}</Text>
        <Badge label={value} tone={tone} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
