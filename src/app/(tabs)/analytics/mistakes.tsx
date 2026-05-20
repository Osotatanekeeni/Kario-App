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
import { MistakeStat } from '@/services/analytics';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MistakeAnalyticsScreen() {
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

  if (!data || data.mistakes.length === 0) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Header />
        <View style={styles.center}>
          <Text variant="body" color="tertiary">No mistake data yet.</Text>
          <Text variant="bodySm" color="tertiary" style={{ marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
            Log mistakes when recording trades to track behavioral patterns here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { mistakes } = data;
  const ruleViolations   = mistakes.filter((m) => m.isRuleViolation);
  const executionMistakes = mistakes.filter((m) => !m.isRuleViolation);
  const totalMistakes    = mistakes.reduce((s, m) => s + m.count, 0);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Header />

      <ScrollView
        contentContainerStyle={{ padding: spacing[4], gap: spacing[6], paddingBottom: spacing[8] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <SummarySection
          total={totalMistakes}
          tradeCount={data.trades.length}
          ruleViolationCount={ruleViolations.reduce((s, m) => s + m.count, 0)}
        />

        <Divider subtle />

        {/* Rule violations */}
        {ruleViolations.length > 0 && (
          <>
            <MistakeGroup
              title="RULE VIOLATIONS"
              subtitle="Mistakes that indicate a direct break from your trading rules"
              mistakes={ruleViolations}
              accentKey="warning"
            />
            <Divider subtle />
          </>
        )}

        {/* Execution mistakes */}
        {executionMistakes.length > 0 && (
          <MistakeGroup
            title="EXECUTION PATTERNS"
            subtitle="Timing and execution mistakes that affect trade quality"
            mistakes={executionMistakes}
            accentKey="neutral"
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
        <MaterialIcons name="warning-amber" size={18} color={colors.tint} />
        <Text variant="h4" weight="medium" style={{ marginLeft: 8 }}>Mistake Analytics</Text>
      </View>
      <View style={{ width: 22 }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function SummarySection({
  total,
  tradeCount,
  ruleViolationCount,
}: {
  total: number;
  tradeCount: number;
  ruleViolationCount: number;
}) {
  const { colors, spacing, radius } = useTheme();
  const avgPerTrade = tradeCount > 0 ? (total / tradeCount).toFixed(1) : '0';
  const ruleViolationRate = tradeCount > 0
    ? Math.round((ruleViolationCount / tradeCount) * 100)
    : 0;

  return (
    <View style={{ gap: spacing[4] }}>
      <Text variant="caption" weight="semibold" color="tertiary">OVERVIEW</Text>
      <View style={[styles.row, { gap: spacing[4] }]}>
        <StatBox
          label="Total logged"
          value={String(total)}
          color={colors.textSecondary}
        />
        <StatBox
          label="Per trade avg"
          value={avgPerTrade}
          color={colors.textSecondary}
        />
        <StatBox
          label="Rule violations"
          value={`${ruleViolationRate}%`}
          color={ruleViolationRate >= 30 ? colors.warning : colors.textSecondary}
        />
      </View>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
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
          padding:         spacing[4],
          alignItems:      'center',
          gap:             4,
        },
      ]}
    >
      <Text variant="data" weight="semibold" style={{ color }}>{value}</Text>
      <Text variant="dataSm" color="tertiary" style={{ textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mistake group
// ---------------------------------------------------------------------------

function MistakeGroup({
  title,
  subtitle,
  mistakes,
  accentKey,
}: {
  title: string;
  subtitle: string;
  mistakes: MistakeStat[];
  accentKey: 'warning' | 'neutral';
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ gap: 4 }}>
        <Text variant="caption" weight="semibold" color="tertiary">{title}</Text>
        <Text variant="dataSm" color="tertiary">{subtitle}</Text>
      </View>
      {mistakes.map((m) => (
        <MistakeRow key={m.key} mistake={m} accentKey={accentKey} />
      ))}
    </View>
  );
}

function MistakeRow({
  mistake,
  accentKey,
}: {
  mistake: MistakeStat;
  accentKey: 'warning' | 'neutral';
}) {
  const { colors, spacing, radius } = useTheme();
  const accent   = accentKey === 'warning' ? colors.warning : colors.textTertiary;
  const barColor = accentKey === 'warning' ? colors.warning : colors.tint;

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
      {/* Header row */}
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text variant="body" weight="medium" style={{ flex: 1 }}>{mistake.label}</Text>
        <View style={[styles.row, { gap: spacing[2] }]}>
          <Text variant="dataSm" color="tertiary">{mistake.pct}% of trades</Text>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: accent + '18',
                borderRadius:    radius.sm,
                borderWidth:     1,
                borderColor:     accent + '40',
              },
            ]}
          >
            <Text variant="dataSm" weight="semibold" style={{ color: accent }}>
              ×{mistake.count}
            </Text>
          </View>
        </View>
      </View>

      {/* Frequency bar */}
      <View style={[styles.barTrack, { backgroundColor: colors.borderSubtle }]}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.min(100, mistake.pct * 2)}%` as `${number}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      {/* Emotional trigger */}
      {mistake.topTrigger && (
        <View style={[styles.row, { gap: 6 }]}>
          <MaterialIcons name="arrow-forward" size={13} color={colors.textTertiary} />
          <Text variant="dataSm" color="tertiary">
            Most common pre-trade state:{' '}
            <Text variant="dataSm" weight="medium" color="secondary">
              {mistake.topTrigger}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root:       { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row:        { flexDirection: 'row', alignItems: 'center' },
  barTrack:   { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill:    { height: 5, borderRadius: 3 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3 },
});
