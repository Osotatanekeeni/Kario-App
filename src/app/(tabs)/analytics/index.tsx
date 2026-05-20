import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/shared/empty-state';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import { useSession } from '@/features/auth/hooks';
import { useAnalytics } from '@/features/analytics/hooks';
import { useCurrentWeekReport, useInvalidateReports } from '@/features/reports/hooks';
import { useDiscipline } from '@/features/discipline/hooks';
import { useTheme } from '@/hooks/use-theme';
import { PatternCard } from '@/services/analytics';
import { DisciplineInsight, generateDisciplineInsight } from '@/services/discipline';
import { buildAndSaveWeeklyReport, WeeklyReport } from '@/services/weekly-report';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ThemeColors = ReturnType<typeof useTheme>['colors'];

function scoreColor(score: number, colors: ThemeColors): string {
  if (score >= 80) return colors.positive;
  if (score >= 60) return colors.tint;
  if (score >= 40) return colors.warning;
  return colors.negative;
}

// ---------------------------------------------------------------------------
// Root screen
// ---------------------------------------------------------------------------

export default function AnalyticsScreen() {
  const { colors, spacing } = useTheme();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: discipline, isLoading: disciplineLoading } = useDiscipline();
  const { session } = useSession();

  const [insight, setInsight]             = useState<DisciplineInsight | null>(null);
  const [analyzing, setAnalyzing]         = useState(false);
  const [generatingReport, setGenerating] = useState(false);

  const { report: currentReport, isLoading: reportLoading } = useCurrentWeekReport();
  const invalidateReports = useInvalidateReports();

  const isLoading = analyticsLoading || disciplineLoading;

  const handleAnalyze = async () => {
    if (!discipline?.weekly) return;
    setAnalyzing(true);
    try {
      const result = await generateDisciplineInsight(discipline.weekly);
      setInsight(result);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!session?.user.id) return;
    setGenerating(true);
    try {
      const report = await buildAndSaveWeeklyReport(session.user.id);
      invalidateReports();
      router.push({ pathname: '/analytics/report', params: { id: report.id } });
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScreenHeader title="Analytics" subtitle="Discipline intelligence" showDivider />
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScreenHeader title="Analytics" subtitle="Discipline intelligence" showDivider />
        <EmptyState
          heading="No trades scored yet"
          body="Log your first trade to start tracking discipline, emotional patterns, session performance, and behavioral trends."
        />
      </SafeAreaView>
    );
  }

  const weekly = discipline?.weekly ?? null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScreenHeader title="Analytics" subtitle="Discipline intelligence" showDivider />

      <ScrollView
        contentContainerStyle={{ padding: spacing[4], gap: spacing[6], paddingBottom: spacing[8] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Score overview */}
        {weekly && <ScoreOverview weekly={weekly} analytics={analytics} />}

        <Divider subtle />

        {/* Category nav cards */}
        <View style={{ gap: spacing[2] }}>
          <Text variant="caption" weight="semibold" color="tertiary">ANALYTICS</Text>
          <NavCard
            icon="show-chart"
            title="Discipline"
            subtitle="Score trend · category history"
            stat={weekly ? String(weekly.weekScore) : undefined}
            statLabel="score"
            onPress={() => router.push('/analytics/discipline')}
          />
          <NavCard
            icon="self-improvement"
            title="Emotional"
            subtitle="State-execution correlation"
            stat={analytics.disruptiveRate > 0 ? `${analytics.disruptiveRate}%` : undefined}
            statLabel="disruptive"
            onPress={() => router.push('/analytics/emotional')}
          />
          <NavCard
            icon="access-time"
            title="Sessions"
            subtitle="London · New York · Asia"
            stat={analytics.sessions.length > 0 ? String(analytics.sessions.length) : undefined}
            statLabel="sessions"
            onPress={() => router.push('/analytics/sessions')}
          />
          <NavCard
            icon="warning-amber"
            title="Mistakes"
            subtitle="Recurring behavioral patterns"
            stat={analytics.mistakes.length > 0 ? String(analytics.mistakes.reduce((s, m) => s + m.count, 0)) : undefined}
            statLabel="logged"
            onPress={() => router.push('/analytics/mistakes')}
          />
        </View>

        <Divider subtle />

        {/* AI Pattern detection */}
        <PatternSection
          patterns={analytics.patterns}
          insight={insight}
          analyzing={analyzing}
          hasWeekly={!!weekly}
          onAnalyze={handleAnalyze}
        />

        <Divider subtle />

        {/* Weekly report */}
        <WeeklyReportSection
          report={currentReport}
          loading={reportLoading}
          generating={generatingReport}
          onGenerate={handleGenerateReport}
          onView={(id) => router.push({ pathname: '/analytics/report', params: { id } })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Score overview — compact, not hero
// ---------------------------------------------------------------------------

function ScoreOverview({
  weekly,
  analytics,
}: {
  weekly: NonNullable<ReturnType<typeof useDiscipline>['data']>['weekly'];
  analytics: NonNullable<ReturnType<typeof useAnalytics>['data']>;
}) {
  const { colors, spacing, radius } = useTheme();
  const color = scoreColor(weekly.weekScore, colors);
  const trendIcon =
    weekly.trend === 'improving' ? 'trending-up' :
    weekly.trend === 'declining' ? 'trending-down' : 'trending-flat';
  const trendColor =
    weekly.trend === 'improving' ? colors.positive :
    weekly.trend === 'declining' ? colors.negative : colors.textTertiary;

  return (
    <View style={{ gap: spacing[4] }}>
      <View
        style={[
          styles.overviewCard,
          {
            backgroundColor: colors.surface,
            borderRadius:    radius.lg,
            borderWidth:     StyleSheet.hairlineWidth,
            borderColor:     colors.border,
            padding:         spacing[4],
          },
        ]}
      >
        {/* Accent bar */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, backgroundColor: color }} />

        <View style={[styles.row, { justifyContent: 'space-between', marginTop: spacing[2] }]}>
          <View style={{ gap: 4 }}>
            <Text variant="caption" weight="semibold" color="tertiary">DISCIPLINE SCORE</Text>
            <View style={[styles.row, { gap: spacing[2] }]}>
              <Text variant="metric" weight="semibold" style={{ color }}>
                {weekly.weekScore}
              </Text>
              <View style={[styles.row, { gap: 4 }]}>
                <MaterialIcons name={trendIcon} size={14} color={trendColor} />
                <Text variant="dataSm" style={{ color: trendColor }}>
                  {weekly.delta !== null
                    ? `${weekly.delta >= 0 ? '+' : ''}${weekly.delta} pts`
                    : weekly.trend.charAt(0).toUpperCase() + weekly.trend.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text variant="dataSm" color="tertiary">{weekly.tradeCount} trades</Text>
            <Text variant="dataSm" color="tertiary">{analytics.consistencyRate}% above 70</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Navigation card
// ---------------------------------------------------------------------------

function NavCard({
  icon,
  title,
  subtitle,
  stat,
  statLabel,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  stat?: string;
  statLabel?: string;
  onPress: () => void;
}) {
  const { colors, spacing, radius } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.navCard,
        {
          backgroundColor: colors.surface,
          borderRadius:    radius.md,
          borderWidth:     StyleSheet.hairlineWidth,
          borderColor:     colors.border,
          padding:         spacing[4],
        },
      ]}
    >
      <View
        style={[
          styles.navIcon,
          { backgroundColor: colors.tint + '18', borderRadius: radius.sm },
        ]}
      >
        <MaterialIcons name={icon} size={18} color={colors.tint} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" weight="medium">{title}</Text>
        <Text variant="dataSm" color="tertiary">{subtitle}</Text>
      </View>

      {stat && statLabel && (
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text variant="data" weight="semibold" color="secondary">{stat}</Text>
          <Text variant="dataSm" color="tertiary">{statLabel}</Text>
        </View>
      )}

      <MaterialIcons name="chevron-right" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// AI Pattern detection section
// ---------------------------------------------------------------------------

function PatternSection({
  patterns,
  insight,
  analyzing,
  hasWeekly,
  onAnalyze,
}: {
  patterns: PatternCard[];
  insight: DisciplineInsight | null;
  analyzing: boolean;
  hasWeekly: boolean;
  onAnalyze: () => void;
}) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={[styles.row, { gap: 8, justifyContent: 'space-between' }]}>
        <View style={[styles.row, { gap: 8 }]}>
          <MaterialIcons name="psychology" size={18} color={colors.tint} />
          <Text variant="caption" weight="semibold" style={{ color: colors.tint }}>
            KARIO AI — DETECTED PATTERNS
          </Text>
        </View>
        {hasWeekly && (
          <Pressable onPress={onAnalyze} disabled={analyzing} hitSlop={8}>
            {analyzing
              ? <ActivityIndicator size="small" color={colors.textTertiary} />
              : <MaterialIcons name="refresh" size={16} color={colors.textTertiary} />}
          </Pressable>
        )}
      </View>

      {/* Deterministic patterns */}
      {patterns.map((card, i) => (
        <PatternCardView key={i} card={card} />
      ))}

      {/* AI insight (on demand) */}
      {insight && (
        <View
          style={[
            {
              backgroundColor: colors.surface,
              borderRadius:    radius.md,
              borderWidth:     StyleSheet.hairlineWidth,
              borderColor:     colors.border,
              borderLeftWidth: 3,
              borderLeftColor: colors.tint,
              padding:         spacing[4],
              gap:             spacing[2],
            },
          ]}
        >
          <Text variant="caption" weight="semibold" style={{ color: colors.tint }}>
            AI OBSERVATION
          </Text>
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            {insight.summary}
          </Text>
          <Text variant="bodySm" color="tertiary" style={{ lineHeight: 20, fontStyle: 'italic' }}>
            {insight.focus}
          </Text>
        </View>
      )}

      {patterns.length === 0 && !insight && (
        <View
          style={[
            {
              borderRadius:    radius.lg,
              borderWidth:     1,
              borderColor:     colors.tint + '30',
              backgroundColor: colors.tint + '08',
              padding:         spacing[4],
              gap:             spacing[4],
            },
          ]}
        >
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            Log more trades to unlock behavioral pattern detection. Patterns become visible after 5+ scored trades.
          </Text>
          {hasWeekly && (
            <Button
              label={analyzing ? 'Analyzing…' : 'Get AI discipline insight'}
              variant="primary"
              fullWidth
              disabled={analyzing}
              icon={analyzing ? <ActivityIndicator size="small" color="#0F1115" /> : undefined}
              onPress={onAnalyze}
            />
          )}
        </View>
      )}
    </View>
  );
}

function PatternCardView({ card }: { card: PatternCard }) {
  const { colors, spacing, radius } = useTheme();
  const accentColor =
    card.type === 'warning'  ? colors.warning  :
    card.type === 'positive' ? colors.positive : colors.textTertiary;
  const iconName: keyof typeof MaterialIcons.glyphMap =
    card.type === 'warning'  ? 'info-outline' :
    card.type === 'positive' ? 'check-circle-outline' : 'remove-circle-outline';

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderRadius:    radius.md,
          borderWidth:     StyleSheet.hairlineWidth,
          borderColor:     colors.border,
          padding:         spacing[4],
          gap:             spacing[4],
          alignItems:      'flex-start',
        },
      ]}
    >
      <MaterialIcons name={iconName} size={18} color={accentColor} style={{ marginTop: 2 }} />
      <Text variant="bodySm" color="secondary" style={{ flex: 1, lineHeight: 22 }}>
        {card.text}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Weekly report section
// ---------------------------------------------------------------------------

function WeeklyReportSection({
  report,
  loading,
  generating,
  onGenerate,
  onView,
}: {
  report: WeeklyReport | null;
  loading: boolean;
  generating: boolean;
  onGenerate: () => void;
  onView: (id: string) => void;
}) {
  const { colors, spacing, radius } = useTheme();

  if (loading) {
    return (
      <View style={{ gap: spacing[4] }}>
        <Text variant="caption" weight="semibold" color="tertiary">WEEKLY REPORT</Text>
        <View style={{ alignItems: 'center', paddingVertical: spacing[4] }}>
          <ActivityIndicator color={colors.tint} />
        </View>
      </View>
    );
  }

  if (report) {
    const scoreColor_ = scoreColor(report.score, colors);
    const deltaStr    = report.delta !== null
      ? `${report.delta >= 0 ? '+' : ''}${report.delta} pts`
      : null;

    return (
      <View style={{ gap: spacing[4] }}>
        <Text variant="caption" weight="semibold" color="tertiary">WEEKLY REPORT</Text>

        <Pressable
          onPress={() => onView(report.id)}
          style={[
            {
              backgroundColor: colors.surface,
              borderRadius:    radius.lg,
              borderWidth:     StyleSheet.hairlineWidth,
              borderColor:     colors.border,
              padding:         spacing[4],
              gap:             spacing[4],
              overflow:        'hidden',
            },
          ]}
        >
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: scoreColor_ }} />

          <View style={[styles.row, { justifyContent: 'space-between', marginTop: spacing[2] }]}>
            <View style={{ gap: 4 }}>
              <Text variant="caption" weight="semibold" color="tertiary">
                {new Date(report.weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' – '}
                {new Date(report.weekEnd + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <View style={[styles.row, { gap: spacing[2] }]}>
                <Text variant="metric" weight="semibold" style={{ color: scoreColor_ }}>
                  {report.score}
                </Text>
                {deltaStr && (
                  <Text variant="bodySm" style={{
                    color: (report.delta ?? 0) >= 0 ? colors.positive : colors.negative,
                  }}>
                    {deltaStr}
                  </Text>
                )}
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
          </View>

          <Text variant="bodySm" color="secondary" style={{ lineHeight: 22 }} numberOfLines={2}>
            {report.sections.summary}
          </Text>
        </Pressable>

        <Pressable
          onPress={onGenerate}
          disabled={generating}
          style={[styles.row, { gap: spacing[2], justifyContent: 'center', paddingVertical: spacing[2] }]}
        >
          {generating
            ? <ActivityIndicator size="small" color={colors.textTertiary} />
            : <MaterialIcons name="refresh" size={16} color={colors.textTertiary} />}
          <Text variant="bodySm" color="tertiary">
            {generating ? 'Regenerating…' : "Regenerate this week's report"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing[4] }}>
      <Text variant="caption" weight="semibold" color="tertiary">WEEKLY REPORT</Text>
      <View
        style={[
          {
            borderRadius:    radius.lg,
            borderWidth:     1,
            borderColor:     colors.tint + '40',
            backgroundColor: colors.tint + '08',
            padding:         spacing[6],
            gap:             spacing[4],
          },
        ]}
      >
        <View style={[styles.row, { gap: 8 }]}>
          <MaterialIcons name="insights" size={22} color={colors.tint} />
          <Text variant="h4" weight="medium">Weekly Psychology Report</Text>
        </View>
        <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
          A mentor-style analysis of your discipline trends, emotional patterns, and behavioral evolution this week.
        </Text>
        <Button
          label={generating ? 'Generating report…' : "Generate this week's report"}
          variant="primary"
          fullWidth
          disabled={generating}
          icon={generating ? <ActivityIndicator size="small" color="#0F1115" /> : undefined}
          onPress={onGenerate}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root:        { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row:         { flexDirection: 'row', alignItems: 'center' },
  overviewCard: { overflow: 'hidden' },
  navCard:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navIcon:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
