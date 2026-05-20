import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
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
import { useAnalytics } from '@/features/analytics/hooks';
import { useTheme } from '@/hooks/use-theme';
import { EmotionStat } from '@/services/analytics';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function EmotionalAnalyticsScreen() {
  const { colors, spacing } = useTheme();
  const { data, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Header />
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data || data.emotions.length === 0) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Header />
        <View style={styles.center}>
          <Text variant="body" color="tertiary">No emotional data yet.</Text>
          <Text variant="bodySm" color="tertiary" style={{ marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
            Log pre-trade emotional states when recording trades to see patterns here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { emotions, disruptiveRate, calmAvgDiscipline, disruptiveAvgDiscipline } = data;
  const calmEmotions     = emotions.filter((e) => !e.isDisruptive);
  const disruptiveEmotions = emotions.filter((e) => e.isDisruptive);
  const stateDiff        = calmAvgDiscipline - disruptiveAvgDiscipline;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Header />

      <ScrollView
        contentContainerStyle={{ padding: spacing[4], gap: spacing[6], paddingBottom: spacing[8] }}
        showsVerticalScrollIndicator={false}
      >
        {/* State-execution overview */}
        <StateExecutionOverview
          disruptiveRate={disruptiveRate}
          calmAvg={calmAvgDiscipline}
          disruptiveAvg={disruptiveAvgDiscipline}
          diff={stateDiff}
        />

        <Divider subtle />

        {/* Calm states */}
        {calmEmotions.length > 0 && (
          <>
            <EmotionGroup
              title="CALM ENTRY STATES"
              subtitle="These states are associated with lower emotional interference"
              emotions={calmEmotions}
              accentKey="positive"
            />
            <Divider subtle />
          </>
        )}

        {/* Disruptive states */}
        {disruptiveEmotions.length > 0 && (
          <EmotionGroup
            title="DISRUPTIVE ENTRY STATES"
            subtitle="Anxious, fearful, and impulsive states tend to compress decision quality"
            emotions={disruptiveEmotions}
            accentKey="warning"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
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
      <Pressable onPress={router.back} hitSlop={8}>
        <MaterialIcons name="arrow-back" size={22} color={colors.textTertiary} />
      </Pressable>
      <View style={styles.row}>
        <MaterialIcons name="self-improvement" size={18} color={colors.tint} />
        <Text variant="h4" weight="medium" style={{ marginLeft: 8 }}>Emotional Analytics</Text>
      </View>
      <View style={{ width: 22 }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// State-execution overview
// ---------------------------------------------------------------------------

function StateExecutionOverview({
  disruptiveRate,
  calmAvg,
  disruptiveAvg,
  diff,
}: {
  disruptiveRate: number;
  calmAvg: number;
  disruptiveAvg: number;
  diff: number;
}) {
  const { colors, spacing, radius } = useTheme();

  const rateColor =
    disruptiveRate <= 20 ? colors.positive :
    disruptiveRate <= 40 ? colors.warning  : colors.negative;

  return (
    <View style={{ gap: spacing[4] }}>
      <Text variant="caption" weight="semibold" color="tertiary">STATE — EXECUTION OVERVIEW</Text>

      {/* Disruptive rate stat */}
      <View
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius:    radius.lg,
            borderWidth:     StyleSheet.hairlineWidth,
            borderColor:     colors.border,
            padding:         spacing[6],
            gap:             spacing[2],
            alignItems:      'center',
            overflow:        'hidden',
          },
        ]}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: rateColor }} />
        <Text variant="caption" weight="semibold" color="tertiary" style={{ marginTop: spacing[2] }}>
          DISRUPTIVE ENTRY RATE
        </Text>
        <Text variant="metric" weight="semibold" style={{ color: rateColor }}>
          {disruptiveRate}%
        </Text>
        <Text variant="bodySm" color="tertiary">
          of trades entered in a disruptive emotional state
        </Text>
      </View>

      {/* Calm vs disruptive comparison */}
      {calmAvg > 0 && disruptiveAvg > 0 && (
        <View style={[styles.row, { gap: spacing[4] }]}>
          <ComparisonCard label="Calm entry" avg={calmAvg} accent={colors.positive} />
          <ComparisonCard label="Disruptive entry" avg={disruptiveAvg} accent={colors.warning} />
        </View>
      )}

      {/* Delta observation */}
      {calmAvg > 0 && disruptiveAvg > 0 && (
        <View
          style={[
            {
              backgroundColor: Math.abs(diff) >= 8 ? colors.tint + '0A' : colors.surface,
              borderRadius:    radius.md,
              borderWidth:     StyleSheet.hairlineWidth,
              borderColor:     colors.border,
              padding:         spacing[4],
              gap:             spacing[2],
            },
          ]}
        >
          <Text variant="caption" weight="semibold" color="tertiary">OBSERVATION</Text>
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            {diff >= 8
              ? `Discipline is ${diff} pts higher when entering in a calm state. Pre-trade awareness has a measurable impact on your process quality.`
              : diff <= -5
              ? `Discipline does not drop in disruptive states — suggesting pre-trade awareness is already moderating their impact.`
              : `Emotional entry state has a modest impact on discipline (${Math.abs(diff)} pt difference). The consistency of your rules matters more than your mood.`}
          </Text>
        </View>
      )}
    </View>
  );
}

function ComparisonCard({ label, avg, accent }: { label: string; avg: number; accent: string }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={[
        {
          flex:            1,
          backgroundColor: colors.surface,
          borderRadius:    radius.md,
          borderWidth:     StyleSheet.hairlineWidth,
          borderColor:     colors.border,
          borderTopWidth:  3,
          borderTopColor:  accent,
          padding:         spacing[4],
          gap:             4,
          alignItems:      'center',
        },
      ]}
    >
      <Text variant="data" weight="semibold" style={{ color: accent }}>{avg}</Text>
      <Text variant="dataSm" color="tertiary" style={{ textAlign: 'center' }}>{label}</Text>
      <Text variant="dataSm" color="tertiary">avg discipline</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Emotion group
// ---------------------------------------------------------------------------

function EmotionGroup({
  title,
  subtitle,
  emotions,
  accentKey,
}: {
  title: string;
  subtitle: string;
  emotions: EmotionStat[];
  accentKey: 'positive' | 'warning';
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ gap: 4 }}>
        <Text variant="caption" weight="semibold" color="tertiary">{title}</Text>
        <Text variant="dataSm" color="tertiary">{subtitle}</Text>
      </View>
      {emotions.map((e) => (
        <EmotionRow key={e.emotion} stat={e} accentKey={accentKey} />
      ))}
    </View>
  );
}

function EmotionRow({
  stat,
  accentKey,
}: {
  stat: EmotionStat;
  accentKey: 'positive' | 'warning';
}) {
  const { colors, spacing, radius } = useTheme();
  const accent     = colors[accentKey];
  const scoreColor =
    stat.avgDiscipline >= 80 ? colors.positive :
    stat.avgDiscipline >= 60 ? colors.tint     :
    stat.avgDiscipline >= 40 ? colors.warning  : colors.negative;

  return (
    <View
      style={[
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
      {/* Top row */}
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View style={[styles.row, { gap: spacing[2] }]}>
          <View
            style={[
              styles.emotionDot,
              { backgroundColor: accent + '30', borderColor: accent + '60', borderWidth: 1 },
            ]}
          />
          <Text variant="body" weight="medium" style={{ textTransform: 'capitalize' }}>
            {stat.emotion}
          </Text>
        </View>
        <View style={[styles.row, { gap: spacing[4] }]}>
          <Text variant="dataSm" color="tertiary">{stat.count}×  ·  {stat.pct}%</Text>
          <Text variant="data" weight="semibold" style={{ color: scoreColor }}>
            {stat.avgDiscipline}
          </Text>
        </View>
      </View>

      {/* Discipline bar */}
      <View style={[styles.barTrack, { backgroundColor: colors.borderSubtle }]}>
        <View
          style={[
            styles.barFill,
            { width: `${stat.avgDiscipline}%` as `${number}%`, backgroundColor: scoreColor },
          ]}
        />
      </View>

      {/* Win rate */}
      {stat.winRate !== null && (
        <Text variant="dataSm" color="tertiary">
          {stat.winRate}% win rate on closed trades
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root:        { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row:         { flexDirection: 'row', alignItems: 'center' },
  emotionDot:  { width: 10, height: 10, borderRadius: 5 },
  barTrack:    { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill:     { height: 5, borderRadius: 3 },
});
