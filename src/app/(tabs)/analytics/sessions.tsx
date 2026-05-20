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
import { SessionStat } from '@/services/analytics';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SessionAnalyticsScreen() {
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

  const sessions = data?.sessions.filter((s) => s.session !== 'Unspecified') ?? [];
  const unspecified = data?.sessions.find((s) => s.session === 'Unspecified') ?? null;

  if (!data || sessions.length === 0) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Header />
        <View style={styles.center}>
          <Text variant="body" color="tertiary">No session data yet.</Text>
          <Text variant="bodySm" color="tertiary" style={{ marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
            Tag trades with a session (London, New York, Asia) when logging to see performance breakdowns here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const sorted   = [...sessions].sort((a, b) => b.avgDiscipline - a.avgDiscipline);
  const best     = sorted[0];
  const worst    = sorted[sorted.length - 1];
  const showDiff = sorted.length >= 2;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Header />

      <ScrollView
        contentContainerStyle={{ padding: spacing[4], gap: spacing[6], paddingBottom: spacing[8] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Best / Worst highlight */}
        {showDiff && (
          <BestWorstRow best={best} worst={worst} />
        )}

        {showDiff && <Divider subtle />}

        {/* Session performance bars */}
        <SessionBarsSection sessions={sorted} />

        {/* Unspecified trades note */}
        {unspecified && (
          <>
            <Divider subtle />
            <View style={{ gap: 4 }}>
              <Text variant="caption" weight="semibold" color="tertiary">UNTAGGED TRADES</Text>
              <Text variant="bodySm" color="tertiary">
                {unspecified.tradeCount} trade{unspecified.tradeCount !== 1 ? 's' : ''} were logged without a session tag (avg discipline {unspecified.avgDiscipline}).
              </Text>
            </View>
          </>
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
        <MaterialIcons name="access-time" size={18} color={colors.tint} />
        <Text variant="h4" weight="medium" style={{ marginLeft: 8 }}>Session Analytics</Text>
      </View>
      <View style={{ width: 22 }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Best / worst row
// ---------------------------------------------------------------------------

function BestWorstRow({ best, worst }: { best: SessionStat; worst: SessionStat }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing[4] }}>
      <Text variant="caption" weight="semibold" color="tertiary">HIGHLIGHTS</Text>
      <View style={[styles.row, { gap: spacing[4] }]}>
        <HighlightCard session={best}  label="BEST SESSION"  accentKey="positive" />
        <HighlightCard session={worst} label="NEEDS ATTENTION" accentKey="warning" />
      </View>
    </View>
  );
}

function HighlightCard({
  session,
  label,
  accentKey,
}: {
  session: SessionStat;
  label: string;
  accentKey: 'positive' | 'warning';
}) {
  const { colors, spacing, radius } = useTheme();
  const accent = colors[accentKey];

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
          gap:             spacing[2],
        },
      ]}
    >
      <Text variant="caption" weight="semibold" style={{ color: accent }}>{label}</Text>
      <Text variant="body" weight="semibold">{session.session}</Text>
      <Text variant="data" weight="semibold" style={{ color: accent }}>
        {session.avgDiscipline}
      </Text>
      <Text variant="dataSm" color="tertiary">
        {session.tradeCount} trade{session.tradeCount !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Session performance bars
// ---------------------------------------------------------------------------

function SessionBarsSection({ sessions }: { sessions: SessionStat[] }) {
  const { colors, spacing } = useTheme();
  const maxAvg = Math.max(...sessions.map((s) => s.avgDiscipline), 1);

  return (
    <View style={{ gap: spacing[4] }}>
      <Text variant="caption" weight="semibold" color="tertiary">PERFORMANCE BY SESSION</Text>
      {sessions.map((session) => (
        <SessionBar
          key={session.session}
          session={session}
          maxAvg={maxAvg}
        />
      ))}
    </View>
  );
}

function SessionBar({
  session,
  maxAvg,
}: {
  session: SessionStat;
  maxAvg: number;
}) {
  const { colors, spacing, radius } = useTheme();

  const barColor =
    session.avgDiscipline >= 80 ? colors.positive :
    session.avgDiscipline >= 60 ? colors.tint     :
    session.avgDiscipline >= 40 ? colors.warning  : colors.negative;

  const fillPct = Math.round((session.avgDiscipline / 100) * 100);

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
      {/* Header */}
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View style={{ gap: 2 }}>
          <Text variant="body" weight="medium">{session.session}</Text>
          <Text variant="dataSm" color="tertiary">
            {session.tradeCount} trade{session.tradeCount !== 1 ? 's' : ''}
            {session.topEmotion
              ? `  ·  Top state: ${session.topEmotion}`
              : ''}
          </Text>
        </View>
        <Text variant="data" weight="semibold" style={{ color: barColor }}>
          {session.avgDiscipline}
        </Text>
      </View>

      {/* Horizontal bar */}
      <View style={[styles.barTrack, { backgroundColor: colors.borderSubtle }]}>
        <View
          style={[
            styles.barFill,
            { width: `${fillPct}%` as `${number}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      {/* Disruptive emotion note */}
      {session.isDisruptiveSessions && session.topEmotion && (
        <View style={[styles.row, { gap: 6 }]}>
          <MaterialIcons name="info-outline" size={13} color={colors.warning} />
          <Text variant="dataSm" style={{ color: colors.warning }}>
            Most common entry state in this session is {session.topEmotion}
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
  root:    { flex: 1 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row:     { flexDirection: 'row', alignItems: 'center' },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: 6, borderRadius: 3 },
});
