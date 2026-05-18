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
import { useDiscipline } from '@/features/discipline/hooks';
import { useCurrentWeekReport, useInvalidateReports } from '@/features/reports/hooks';
import { useTheme } from '@/hooks/use-theme';
import {
  CategoryScore,
  DisciplineInsight,
  TradeScore,
  WeeklyDiscipline,
  generateDisciplineInsight,
} from '@/services/discipline';
import { buildAndSaveWeeklyReport, WeeklyReport } from '@/services/weekly-report';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ThemeColors = ReturnType<typeof useTheme>['colors'];

function scoreColor(
  score: number,
  colors: ThemeColors,
): string {
  if (score >= 80) return colors.positive;
  if (score >= 60) return colors.tint;
  if (score >= 40) return colors.warning;
  return colors.negative;
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Developing';
  return 'Needs work';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Root screen
// ---------------------------------------------------------------------------

export default function AnalyticsScreen() {
  const { colors, spacing } = useTheme();
  const { data, isLoading } = useDiscipline();
  const { session } = useSession();

  const [insight, setInsight] = useState<DisciplineInsight | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const { report: currentReport, isLoading: reportLoading } = useCurrentWeekReport();
  const invalidateReports = useInvalidateReports();

  const handleAnalyze = async () => {
    if (!data) return;
    setAnalyzing(true);
    try {
      const result = await generateDisciplineInsight(data.weekly);
      setInsight(result);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!session?.user.id) return;
    setGeneratingReport(true);
    try {
      const report = await buildAndSaveWeeklyReport(session.user.id);
      invalidateReports();
      router.push({ pathname: '/analytics/report', params: { id: report.id } });
    } finally {
      setGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScreenHeader title="Analytics" subtitle="Discipline scoring" showDivider />
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data || data.scores.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScreenHeader title="Analytics" subtitle="Discipline scoring" showDivider />
        <EmptyState
          heading="No trades scored yet"
          body="Log your first trade to start tracking your discipline score across five behavioral categories."
        />
      </SafeAreaView>
    );
  }

  const { weekly } = data;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScreenHeader title="Analytics" subtitle="Discipline scoring" showDivider />
      <ScrollView
        contentContainerStyle={{ padding: spacing[4], gap: spacing[6], paddingBottom: spacing[8] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Discipline score */}
        <ScoreCard weekly={weekly} />

        <Divider subtle />

        {/* Category breakdown */}
        <CategoryBreakdown categories={weekly.categoryAverages} />

        {/* Strongest / Weakest */}
        <StrengthRow strongest={weekly.strongest} weakest={weekly.weakest} />

        <Divider subtle />

        {/* AI Insight */}
        <InsightSection
          weekly={weekly}
          insight={insight}
          analyzing={analyzing}
          onAnalyze={handleAnalyze}
        />

        {/* Recent trades */}
        {weekly.recentTradeScores.length > 0 && (
          <>
            <Divider subtle />
            <RecentTradesSection scores={weekly.recentTradeScores} />
          </>
        )}

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
// Score card
// ---------------------------------------------------------------------------

function ScoreCard({ weekly }: { weekly: WeeklyDiscipline }) {
  const { colors, spacing, radius } = useTheme();
  const color = scoreColor(weekly.weekScore, colors);

  const trendIcon =
    weekly.trend === 'improving' ? 'trending-up' :
    weekly.trend === 'declining' ? 'trending-down' : 'trending-flat';
  const trendColor =
    weekly.trend === 'improving' ? colors.positive :
    weekly.trend === 'declining' ? colors.negative : colors.textTertiary;

  return (
    <View
      style={[
        styles.scoreCard,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing[6],
          gap: spacing[2],
        },
      ]}
    >
      <Text variant="caption" weight="semibold" color="tertiary">DISCIPLINE SCORE</Text>

      <Text variant="hero" style={{ color, marginTop: spacing[2] }}>
        {weekly.weekScore}
      </Text>

      <Text variant="bodySm" color="tertiary">{scoreLabel(weekly.weekScore)}</Text>

      <View style={[styles.trendRow, { marginTop: spacing[2] }]}>
        <MaterialIcons name={trendIcon} size={16} color={trendColor} />
        <Text variant="bodySm" style={{ color: trendColor }}>
          {weekly.trend.charAt(0).toUpperCase() + weekly.trend.slice(1)}
          {weekly.delta !== null
            ? `  ·  ${weekly.delta >= 0 ? '+' : ''}${weekly.delta} pts from last week`
            : ''}
        </Text>
      </View>

      <Text variant="dataSm" color="tertiary" style={{ marginTop: spacing[2] }}>
        Based on {weekly.tradeCount} {weekly.tradeCount === 1 ? 'trade' : 'trades'}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Category breakdown
// ---------------------------------------------------------------------------

function CategoryBreakdown({ categories }: { categories: CategoryScore[] }) {
  const { colors, spacing } = useTheme();

  return (
    <View style={{ gap: spacing[4] }}>
      <Text variant="caption" weight="semibold" color="tertiary">BREAKDOWN</Text>

      {categories.map((cat) => {
        const color = scoreColor(cat.score, colors);
        return (
          <View key={cat.key} style={{ gap: spacing[2] }}>
            <View style={styles.barHeader}>
              <Text variant="bodySm" color="secondary">{cat.label}</Text>
              <Text variant="dataSm" weight="semibold" style={{ color }}>
                {cat.score}
              </Text>
            </View>
            <View
              style={[
                styles.barTrack,
                { backgroundColor: colors.borderSubtle },
              ]}
            >
              <View
                style={[
                  styles.barFill,
                  { width: `${cat.score}%` as `${number}%`, backgroundColor: color },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Strongest / Weakest row
// ---------------------------------------------------------------------------

function StrengthRow({
  strongest,
  weakest,
}: {
  strongest: CategoryScore;
  weakest: CategoryScore;
}) {
  const { spacing } = useTheme();
  return (
    <View style={[styles.trendRow, { gap: spacing[4] }]}>
      <StrengthCard label="STRONGEST" category={strongest} />
      <StrengthCard label="WEAKEST"   category={weakest}   />
    </View>
  );
}

function StrengthCard({
  label,
  category,
}: {
  label: string;
  category: CategoryScore;
}) {
  const { colors, spacing, radius } = useTheme();
  const color = scoreColor(category.score, colors);

  return (
    <View
      style={[
        styles.strengthCard,
        {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing[4],
          overflow: 'hidden',
        },
      ]}
    >
      {/* Accent top bar */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: color },
        ]}
      />
      <Text variant="caption" weight="semibold" style={{ color, marginTop: spacing[2] }}>
        {label}
      </Text>
      <Text variant="metric" weight="semibold" style={{ color, marginTop: spacing[2] }}>
        {category.score}
      </Text>
      <Text variant="bodySm" color="secondary" style={{ marginTop: spacing[1] }}>
        {category.label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// AI Insight section
// ---------------------------------------------------------------------------

function InsightSection({
  weekly,
  insight,
  analyzing,
  onAnalyze,
}: {
  weekly: WeeklyDiscipline;
  insight: DisciplineInsight | null;
  analyzing: boolean;
  onAnalyze: () => void;
}) {
  const { colors, spacing, radius } = useTheme();

  if (!insight) {
    return (
      <View
        style={[
          {
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.tint + '40',
            backgroundColor: colors.tint + '08',
            padding: spacing[6],
            gap: spacing[4],
          },
        ]}
      >
        <View style={styles.aiHeader}>
          <MaterialIcons name="psychology" size={22} color={colors.tint} />
          <Text variant="h4" weight="medium">Kario AI</Text>
        </View>
        <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
          Get an honest, process-focused analysis of what your discipline score reveals about your trading behavior.
        </Text>
        <Button
          label={analyzing ? 'Analyzing…' : 'Analyze my discipline'}
          variant="primary"
          fullWidth
          disabled={analyzing}
          icon={analyzing ? <ActivityIndicator size="small" color="#0F1115" /> : undefined}
          onPress={onAnalyze}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: spacing[4] }}>
      {/* Header row */}
      <View style={styles.aiInsightHeader}>
        <View style={styles.aiHeader}>
          <MaterialIcons name="psychology" size={18} color={colors.tint} />
          <Text variant="caption" weight="semibold" style={{ color: colors.tint }}>
            KARIO AI — DISCIPLINE INSIGHT
          </Text>
        </View>
        <Pressable onPress={onAnalyze} disabled={analyzing} hitSlop={8}>
          {analyzing
            ? <ActivityIndicator size="small" color={colors.textTertiary} />
            : <MaterialIcons name="refresh" size={18} color={colors.textTertiary} />}
        </Pressable>
      </View>

      {/* Observation */}
      <View
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderLeftWidth: 3,
            borderLeftColor: colors.tint,
            padding: spacing[4],
            gap: spacing[2],
          },
        ]}
      >
        <Text variant="caption" weight="semibold" style={{ color: colors.tint }}>
          OBSERVATION
        </Text>
        <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
          {insight.summary}
        </Text>
      </View>

      {/* Focus */}
      <View
        style={[
          {
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.tint + '50',
            backgroundColor: colors.tint + '0A',
            padding: spacing[4],
            gap: spacing[2],
          },
        ]}
      >
        <Text variant="caption" weight="semibold" style={{ color: colors.tint }}>
          FOCUS
        </Text>
        <Text variant="bodyLg" style={{ lineHeight: 28, color: colors.text, fontStyle: 'italic' }}>
          {insight.focus}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Recent trades
// ---------------------------------------------------------------------------

function RecentTradesSection({ scores }: { scores: TradeScore[] }) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ gap: spacing[4] }}>
      <Text variant="caption" weight="semibold" color="tertiary">RECENT TRADES</Text>

      {scores.map((s) => {
        const color = scoreColor(s.overall, colors);
        const outcomeColor =
          s.outcome === 'win'       ? colors.positive :
          s.outcome === 'loss'      ? colors.negative :
          s.outcome === 'breakeven' ? colors.textTertiary :
          colors.textTertiary;

        return (
          <View
            key={s.tradeId}
            style={[
              styles.tradeRow,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                padding: spacing[4],
                gap: spacing[4],
              },
            ]}
          >
            {/* Score box */}
            <View
              style={[
                styles.scoreBox,
                {
                  borderRadius: radius.sm,
                  backgroundColor: color + '18',
                  borderWidth: 1,
                  borderColor: color + '40',
                },
              ]}
            >
              <Text variant="data" weight="semibold" style={{ color }}>
                {s.overall}
              </Text>
            </View>

            {/* Symbol + date */}
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="body" weight="medium">{s.symbol}</Text>
              <Text variant="dataSm" color="tertiary">{fmtDate(s.createdAt)}</Text>
            </View>

            {/* Outcome chip */}
            {s.outcome ? (
              <View
                style={[
                  styles.outcomeChip,
                  {
                    borderRadius: radius.sm,
                    backgroundColor: outcomeColor + '18',
                    borderWidth: 1,
                    borderColor: outcomeColor + '40',
                  },
                ]}
              >
                <Text variant="dataSm" weight="medium" style={{ color: outcomeColor }}>
                  {s.outcome.charAt(0).toUpperCase() + s.outcome.slice(1)}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
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
    const deltaStr = report.delta !== null
      ? `${report.delta >= 0 ? '+' : ''}${report.delta} pts`
      : null;
    const scoreCol = scoreColor(report.score, colors);

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
          {/* Accent bar */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: scoreCol }} />

          <View style={[styles.trendRow, { justifyContent: 'space-between', marginTop: spacing[2] }]}>
            <View style={{ gap: 4 }}>
              <Text variant="caption" weight="semibold" color="tertiary">
                {new Date(report.weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' – '}
                {new Date(report.weekEnd + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <View style={[styles.trendRow, { gap: 8 }]}>
                <Text variant="metric" weight="semibold" style={{ color: scoreCol }}>
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
          style={[styles.trendRow, { gap: spacing[2], justifyContent: 'center', paddingVertical: spacing[2] }]}
        >
          {generating
            ? <ActivityIndicator size="small" color={colors.textTertiary} />
            : <MaterialIcons name="refresh" size={16} color={colors.textTertiary} />}
          <Text variant="bodySm" color="tertiary">
            {generating ? 'Regenerating…' : 'Regenerate this week\'s report'}
          </Text>
        </Pressable>
      </View>
    );
  }

  // No report yet for this week
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
        <View style={styles.aiHeader}>
          <MaterialIcons name="insights" size={22} color={colors.tint} />
          <Text variant="h4" weight="medium">Weekly Psychology Report</Text>
        </View>
        <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
          A full mentor-style analysis of your discipline trends, emotional patterns, and behavioral evolution this week.
        </Text>
        <Button
          label={generating ? 'Generating report…' : 'Generate this week\'s report'}
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
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scoreCard: { alignItems: 'center' },
  trendRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barTrack:  { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill:   { height: 6, borderRadius: 3 },
  strengthCard: {},
  accentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  aiHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tradeRow:  { flexDirection: 'row', alignItems: 'center' },
  scoreBox:  { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  outcomeChip: { paddingHorizontal: 10, paddingVertical: 6 },
});
