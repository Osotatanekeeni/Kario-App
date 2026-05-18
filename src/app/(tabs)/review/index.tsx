import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import { useSession } from '@/features/auth/hooks';
import { useTheme } from '@/hooks/use-theme';
import {
  computePatterns,
  fetchDetailedTrades,
  generateReflection,
  ReflectionResult,
  TradePatterns,
} from '@/services/reflection';

export default function ReviewScreen() {
  const { colors, spacing, radius } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const [reflection, setReflection] = useState<ReflectionResult | null>(null);
  const [reflecting, setReflecting] = useState(false);

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['detailed-trades', userId],
    queryFn: () => fetchDetailedTrades(userId, 10),
    enabled: !!userId,
  });

  const patterns: TradePatterns = computePatterns(trades);
  const hasEnoughData = patterns.totalTrades >= 2;

  const handleGenerateReflection = async () => {
    setReflecting(true);
    try {
      const result = await generateReflection(patterns);
      setReflection(result);
    } finally {
      setReflecting(false);
    }
  };

  const openSession = () => {
    router.push({
      pathname: '/review/session',
      params: { hasReflection: reflection ? '1' : '0' },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScreenHeader title="Review" showDivider />
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScreenHeader
        title="Review"
        subtitle="AI trading psychology"
        showDivider
      />

      {!hasEnoughData ? (
        <EmptyState
          heading="Nothing to reflect on yet"
          body="Log at least two trades to unlock your AI psychology mentor."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing[4], gap: spacing[5] }}
          showsVerticalScrollIndicator={false}
        >
          {/* Pattern summary */}
          <PatternSummary patterns={patterns} />

          <Divider subtle />

          {/* Reflection section */}
          {reflection ? (
            <ReflectionCard
              reflection={reflection}
              onContinue={openSession}
              onRegenerate={handleGenerateReflection}
              loading={reflecting}
            />
          ) : (
            <AnalyzeBlock
              loading={reflecting}
              onPress={handleGenerateReflection}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Pattern summary row
// ---------------------------------------------------------------------------

function PatternSummary({ patterns }: { patterns: TradePatterns }) {
  const { colors, spacing, radius } = useTheme();

  const trendIcon = (trend: 'improving' | 'stable' | 'declining') =>
    trend === 'improving' ? 'trending-up' : trend === 'declining' ? 'trending-down' : 'trending-flat';

  const trendColor = (trend: 'improving' | 'stable' | 'declining') =>
    trend === 'improving' ? colors.positive : trend === 'declining' ? colors.negative : colors.textTertiary;

  const disruptiveLabel =
    patterns.disruptiveEntryRate >= 0.5
      ? 'High'
      : patterns.disruptiveEntryRate >= 0.25
      ? 'Elevated'
      : 'Low';

  const disruptiveColor =
    patterns.disruptiveEntryRate >= 0.5
      ? colors.negative
      : patterns.disruptiveEntryRate >= 0.25
      ? colors.warning
      : colors.positive;

  return (
    <View style={{ gap: spacing[3] }}>
      <Text variant="caption" weight="semibold" color="tertiary">
        RECENT PATTERNS — {patterns.totalTrades} TRADES
      </Text>

      <View style={styles.statRow}>
        {/* Discipline */}
        <StatCard
          label="Discipline"
          value={patterns.disciplineTrend.charAt(0).toUpperCase() + patterns.disciplineTrend.slice(1)}
          icon={trendIcon(patterns.disciplineTrend)}
          iconColor={trendColor(patterns.disciplineTrend)}
        />

        {/* Emotional state */}
        <StatCard
          label="Entry state"
          value={disruptiveLabel}
          valueColor={disruptiveColor}
          icon="psychology"
          iconColor={disruptiveColor}
        />

        {/* Win rate */}
        {patterns.winRate !== null && (
          <StatCard
            label="Win rate"
            value={`${Math.round(patterns.winRate * 100)}%`}
            icon="bar-chart"
            iconColor={colors.tint}
          />
        )}
      </View>

      {/* Top mistake chip */}
      {patterns.topMistakes.length > 0 && (
        <View style={styles.flagRow}>
          <MaterialIcons name="repeat" size={14} color={colors.warning} />
          <Text variant="bodySm" color="tertiary">
            Most frequent: {' '}
            <Text variant="bodySm" weight="medium" style={{ color: colors.warning }}>
              {patterns.topMistakes[0].label}
            </Text>
            {patterns.topMistakes[0].count > 1 ? ` ×${patterns.topMistakes[0].count}` : ''}
          </Text>
        </View>
      )}

      {/* Behavioral flags */}
      {patterns.behavioralFlags.length > 0 && (
        <View style={styles.flagsWrap}>
          {patterns.behavioralFlags.slice(0, 2).map((flag) => (
            <View
              key={flag}
              style={[
                styles.flagChip,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: radius.sm,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text variant="dataSm" color="secondary">
                {flag}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function StatCard({
  label,
  value,
  valueColor,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing[3],
          flex: 1,
        },
      ]}
    >
      <MaterialIcons name={icon} size={18} color={iconColor} />
      <Text variant="dataSm" color="tertiary" style={{ marginTop: 6 }}>
        {label}
      </Text>
      <Text variant="data" weight="semibold" style={{ color: valueColor ?? colors.text, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Analyze CTA
// ---------------------------------------------------------------------------

function AnalyzeBlock({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={[
        styles.analyzeBlock,
        {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.tint + '40',
          backgroundColor: colors.tint + '08',
          padding: spacing[5],
          gap: spacing[3],
        },
      ]}
    >
      <View style={styles.analyzeHeader}>
        <MaterialIcons name="psychology" size={22} color={colors.tint} />
        <Text variant="h4" weight="medium" style={{ color: colors.text }}>
          Kario AI
        </Text>
      </View>
      <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
        Your mentor analyzes behavioral patterns, emotional tendencies, and discipline trends — then reflects them back to you honestly.
      </Text>
      <Button
        label={loading ? 'Analysing…' : 'Analyze my recent trading'}
        variant="primary"
        fullWidth
        disabled={loading}
        icon={loading ? <ActivityIndicator size="small" color="#0F1115" /> : undefined}
        onPress={onPress}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Reflection card
// ---------------------------------------------------------------------------

function ReflectionCard({
  reflection,
  onContinue,
  onRegenerate,
  loading,
}: {
  reflection: ReflectionResult;
  onContinue: () => void;
  onRegenerate: () => void;
  loading: boolean;
}) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={styles.reflectionHeader}>
        <View style={styles.analyzeHeader}>
          <MaterialIcons name="psychology" size={18} color={colors.tint} />
          <Text variant="caption" weight="semibold" style={{ color: colors.tint }}>
            KARIO AI — LATEST REFLECTION
          </Text>
        </View>
        <Pressable onPress={onRegenerate} disabled={loading} hitSlop={8}>
          {loading
            ? <ActivityIndicator size="small" color={colors.textTertiary} />
            : <MaterialIcons name="refresh" size={18} color={colors.textTertiary} />
          }
        </Pressable>
      </View>

      {/* Observation */}
      <ReflectionBlock
        label="OBSERVATION"
        content={reflection.observation}
        accentColor={colors.accent}
      />

      {/* Insight */}
      <ReflectionBlock
        label="DISCIPLINE"
        content={reflection.insight}
        accentColor={colors.tint}
      />

      {/* Question — highlighted */}
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
          REFLECT ON THIS
        </Text>
        <Text variant="bodyLg" style={{ lineHeight: 28, color: colors.text, fontStyle: 'italic' }}>
          {reflection.question}
        </Text>
      </View>

      <Divider subtle />

      <Button
        label="Continue the conversation"
        variant="secondary"
        fullWidth
        icon={<MaterialIcons name="chat-bubble-outline" size={18} color={colors.tint} />}
        onPress={onContinue}
      />
    </View>
  );
}

function ReflectionBlock({
  label,
  content,
  accentColor,
}: {
  label: string;
  content: string;
  accentColor: string;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={[
        styles.reflectionBlock,
        {
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          borderLeftWidth: 3,
          borderLeftColor: accentColor,
          padding: spacing[4],
          gap: spacing[2],
        },
      ]}
    >
      <Text variant="caption" weight="semibold" style={{ color: accentColor }}>
        {label}
      </Text>
      <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
        {content}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container:  { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statRow:    { flexDirection: 'row', gap: 8 },
  statCard:   { alignItems: 'flex-start' },
  flagRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flagsWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  flagChip:   { paddingHorizontal: 10, paddingVertical: 5 },
  analyzeBlock:  {},
  analyzeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reflectionBlock: {},
});
