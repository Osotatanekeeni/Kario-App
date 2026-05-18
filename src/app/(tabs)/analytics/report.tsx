import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { CategoryScore } from '@/services/discipline';
import {
  EmotionalBreakdownItem,
  fetchReportById,
  ReportAISections,
  shareReport,
  WeeklyReport,
  WeeklyReportData,
} from '@/services/weekly-report';

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

function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
  });
}

function trendIcon(
  trend: 'improving' | 'stable' | 'declining',
): keyof typeof MaterialIcons.glyphMap {
  return trend === 'improving' ? 'trending-up' :
         trend === 'declining' ? 'trending-down' : 'trending-flat';
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function WeeklyReportScreen() {
  const { colors, spacing } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetchReportById(id)
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!report || sharing) return;
    setSharing(true);
    try { await shareReport(report); }
    finally { setSharing(false); }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Header onBack={router.back} onShare={undefined} sharing={false} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Header onBack={router.back} onShare={undefined} sharing={false} />
        <View style={styles.center}>
          <Text variant="body" color="tertiary">Report not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Header onBack={router.back} onShare={handleShare} sharing={sharing} />

      <ScrollView
        contentContainerStyle={{ padding: spacing[4], gap: spacing[6], paddingBottom: spacing[8] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Date range label */}
        <View style={{ alignItems: 'center', gap: spacing[2] }}>
          <Text variant="caption" weight="semibold" color="tertiary">
            WEEKLY REPORT
          </Text>
          <Text variant="h4" weight="medium" color="secondary">
            {fmtDate(report.weekStart)} – {fmtDate(report.weekEnd)}
          </Text>
        </View>

        {/* Score hero */}
        <ScoreHero report={report} />

        <Divider subtle />

        {/* Category breakdown */}
        <CategoryBreakdown categories={report.data.categoryScores} />

        <Divider subtle />

        {/* Emotional pattern */}
        {report.data.emotionalBreakdown.length > 0 && (
          <>
            <EmotionalPattern breakdown={report.data.emotionalBreakdown} />
            <Divider subtle />
          </>
        )}

        {/* AI sections */}
        <AINarrative sections={report.sections} data={report.data} />

        {/* Reflective closing */}
        <ReflectiveClosing text={report.sections.reflectiveClosing} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({
  onBack,
  onShare,
  sharing,
}: {
  onBack: () => void;
  onShare: (() => void) | undefined;
  sharing: boolean;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={[
        styles.header,
        {
          paddingHorizontal: spacing[4],
          paddingVertical:   spacing[4],
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      <Pressable onPress={onBack} hitSlop={8}>
        <MaterialIcons name="arrow-back" size={22} color={colors.textTertiary} />
      </Pressable>

      <View style={styles.headerTitle}>
        <MaterialIcons name="insights" size={18} color={colors.tint} />
        <Text variant="h4" weight="medium">Psychology Report</Text>
      </View>

      {onShare ? (
        <Pressable onPress={onShare} disabled={sharing} hitSlop={8}>
          {sharing
            ? <ActivityIndicator size="small" color={colors.textTertiary} />
            : <MaterialIcons name="share" size={22} color={colors.textTertiary} />}
        </Pressable>
      ) : (
        <View style={{ width: 22 }} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Score hero
// ---------------------------------------------------------------------------

function ScoreHero({ report }: { report: WeeklyReport }) {
  const { colors, spacing, radius } = useTheme();
  const d     = report.data;
  const color = scoreColor(report.score, colors);
  const trend = d.disciplineTrend;
  const trendColor =
    trend === 'improving' ? colors.positive :
    trend === 'declining' ? colors.negative : colors.textTertiary;

  return (
    <View
      style={[
        styles.scoreHero,
        {
          backgroundColor: colors.surface,
          borderRadius:    radius.lg,
          borderWidth:     StyleSheet.hairlineWidth,
          borderColor:     colors.border,
          padding:         spacing[6],
          gap:             spacing[2],
        },
      ]}
    >
      <Text variant="caption" weight="semibold" color="tertiary">DISCIPLINE SCORE</Text>
      <Text variant="hero" style={{ color, marginTop: spacing[2] }}>{report.score}</Text>

      {report.delta !== null && (
        <View style={[styles.row, { gap: 8 }]}>
          <MaterialIcons name={trendIcon(trend)} size={16} color={trendColor} />
          <Text variant="bodySm" style={{ color: trendColor }}>
            {trend.charAt(0).toUpperCase() + trend.slice(1)}
            {'  ·  '}
            {report.delta >= 0 ? '+' : ''}{report.delta} pts from last week
          </Text>
        </View>
      )}

      <View style={[styles.row, { gap: spacing[6], marginTop: spacing[2] }]}>
        <StatPill label="Trades" value={String(d.tradeCount)} />
        {d.winCount + d.lossCount > 0 && (
          <StatPill
            label="Win rate"
            value={`${Math.round((d.winCount / (d.winCount + d.lossCount)) * 100)}%`}
          />
        )}
        <StatPill label="Emotional" value={d.emotionalTrend} />
      </View>
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing[1] }}>
      <Text variant="dataSm" color="tertiary">{label}</Text>
      <Text variant="data" weight="semibold" color="secondary">{value}</Text>
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
      <Text variant="caption" weight="semibold" color="tertiary">CATEGORY BREAKDOWN</Text>
      {categories.map((cat) => {
        const color = scoreColor(cat.score, colors);
        return (
          <View key={cat.key} style={{ gap: spacing[2] }}>
            <View style={styles.barHeader}>
              <Text variant="bodySm" color="secondary">{cat.label}</Text>
              <Text variant="dataSm" weight="semibold" style={{ color }}>{cat.score}</Text>
            </View>
            <View style={[styles.barTrack, { backgroundColor: colors.borderSubtle }]}>
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
// Emotional pattern
// ---------------------------------------------------------------------------

function EmotionalPattern({ breakdown }: { breakdown: EmotionalBreakdownItem[] }) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ gap: spacing[4] }}>
      <Text variant="caption" weight="semibold" color="tertiary">EMOTIONAL ENTRY PATTERNS</Text>
      {breakdown.slice(0, 5).map((item) => {
        const closed   = item.wins + item.losses;
        const winRate  = closed > 0 ? Math.round((item.wins / closed) * 100) : null;
        const isCalm   = !['anxious', 'fearful', 'impulsive', 'frustrated', 'overwhelmed'].includes(item.emotion);
        const barColor = isCalm ? colors.positive : colors.warning;

        return (
          <View
            key={item.emotion}
            style={[
              styles.emotionRow,
              {
                backgroundColor: colors.surface,
                borderRadius:    radius.md,
                borderWidth:     StyleSheet.hairlineWidth,
                borderColor:     colors.border,
                padding:         spacing[4],
                gap:             spacing[2],
              },
            ]}
          >
            <View style={styles.barHeader}>
              <Text variant="bodySm" weight="medium" style={{ textTransform: 'capitalize' }}>
                {item.emotion}
              </Text>
              <View style={[styles.row, { gap: spacing[4] }]}>
                <Text variant="dataSm" color="tertiary">{item.count}×</Text>
                {winRate !== null && (
                  <Text
                    variant="dataSm"
                    weight="semibold"
                    style={{ color: winRate >= 50 ? colors.positive : colors.negative }}
                  >
                    {winRate}% win
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// AI narrative sections
// ---------------------------------------------------------------------------

function AINarrative({
  sections,
  data,
}: {
  sections: ReportAISections;
  data: WeeklyReportData;
}) {
  const { colors, spacing, radius } = useTheme();

  const blocks: Array<{ label: string; content: string; accent: string }> = [
    { label: 'WEEKLY SUMMARY',    content: sections.summary,                   accent: colors.tint    },
    { label: 'STRONGEST TRAIT',   content: sections.strongestTrait,             accent: colors.positive },
    { label: 'AREA FOR GROWTH',   content: sections.weakestPattern,             accent: colors.warning  },
    { label: 'EMOTIONAL PATTERN', content: sections.emotionalTrendObservation,  accent: colors.accent   },
    { label: 'DISCIPLINE EVOLUTION', content: sections.disciplineEvolution,     accent: colors.tint    },
  ];

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={[styles.row, { gap: 8 }]}>
        <MaterialIcons name="psychology" size={18} color={colors.tint} />
        <Text variant="caption" weight="semibold" style={{ color: colors.tint }}>
          KARIO AI — MENTOR ANALYSIS
        </Text>
      </View>

      {blocks.map(({ label, content, accent }) => (
        <View
          key={label}
          style={[
            {
              backgroundColor: colors.surface,
              borderRadius:    radius.md,
              borderWidth:     StyleSheet.hairlineWidth,
              borderColor:     colors.border,
              borderLeftWidth: 3,
              borderLeftColor: accent,
              padding:         spacing[4],
              gap:             spacing[2],
            },
          ]}
        >
          <Text variant="caption" weight="semibold" style={{ color: accent }}>
            {label}
          </Text>
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            {content}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Reflective closing
// ---------------------------------------------------------------------------

function ReflectiveClosing({ text }: { text: string }) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        {
          borderRadius:    radius.lg,
          borderWidth:     1,
          borderColor:     colors.tint + '50',
          backgroundColor: colors.tint + '0A',
          padding:         spacing[6],
          gap:             spacing[2],
        },
      ]}
    >
      <Text variant="caption" weight="semibold" style={{ color: colors.tint }}>
        REFLECT ON THIS
      </Text>
      <Text variant="bodyLg" style={{ lineHeight: 28, color: colors.text, fontStyle: 'italic' }}>
        {text}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  row:        { flexDirection: 'row', alignItems: 'center' },
  scoreHero:  { alignItems: 'center' },
  barHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barTrack:   { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill:    { height: 6, borderRadius: 3 },
  emotionRow: {},
});
