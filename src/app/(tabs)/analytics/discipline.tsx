import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Polyline, Stop } from 'react-native-svg';

import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import { useAnalytics } from '@/features/analytics/hooks';
import { useTheme } from '@/hooks/use-theme';
import { CategoryTrend, TrendPoint } from '@/services/analytics';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function DisciplineAnalyticsScreen() {
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

  if (!data) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Header />
        <View style={styles.center}>
          <Text variant="body" color="tertiary">No trade data yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Header />

      <ScrollView
        contentContainerStyle={{ padding: spacing[4], gap: spacing[6], paddingBottom: spacing[8] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Score trend */}
        <TrendSection
          points={data.trendPoints}
          overallAvg={data.overallAvg}
          consistency={data.consistencyRate}
        />

        <Divider subtle />

        {/* Category trends */}
        <CategoryTrendsSection trends={data.categoryTrends} />
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
      <View style={styles.headerTitle}>
        <MaterialIcons name="show-chart" size={18} color={colors.tint} />
        <Text variant="h4" weight="medium">Discipline Analytics</Text>
      </View>
      <View style={{ width: 22 }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Score trend section
// ---------------------------------------------------------------------------

function TrendSection({
  points,
  overallAvg,
  consistency,
}: {
  points: TrendPoint[];
  overallAvg: number;
  consistency: number;
}) {
  const { colors, spacing, radius } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth  = screenWidth - spacing[4] * 2;
  const chartHeight = 120;

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text variant="caption" weight="semibold" color="tertiary">SCORE TREND</Text>
        <Text variant="dataSm" color="tertiary">{points.length} trades</Text>
      </View>

      {/* Stats row */}
      <View style={[styles.row, { gap: spacing[4] }]}>
        <StatBox label="Average" value={String(overallAvg)} color={colors.tint} />
        <StatBox label="Consistency" value={`${consistency}%`} color={colors.positive} />
        {points.length > 1 && (
          <StatBox
            label="Latest"
            value={String(points[points.length - 1].score)}
            color={colors.textSecondary}
          />
        )}
      </View>

      {/* Line chart */}
      {points.length >= 2 ? (
        <View
          style={[
            {
              backgroundColor: colors.surface,
              borderRadius:    radius.lg,
              borderWidth:     StyleSheet.hairlineWidth,
              borderColor:     colors.border,
              padding:         spacing[4],
              paddingBottom:   spacing[6],
              gap:             spacing[4],
            },
          ]}
        >
          <LineChart
            data={points.map((p) => p.score)}
            width={chartWidth - spacing[4] * 2}
            height={chartHeight}
            color={colors.tint}
          />

          {/* X-axis labels — every 5th point */}
          <View style={styles.xAxis}>
            {points.map((p, i) => {
              const showLabel = i === 0 || i === points.length - 1 ||
                (points.length > 10 && i % Math.floor(points.length / 4) === 0);
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  {showLabel && (
                    <Text variant="dataSm" color="tertiary" style={{ fontSize: 10 }} numberOfLines={1}>
                      {p.label}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={[styles.center, { paddingVertical: spacing[8] }]}>
          <Text variant="bodySm" color="tertiary">Log more trades to see the trend.</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SVG Line chart
// ---------------------------------------------------------------------------

function LineChart({
  data,
  width,
  height,
  color,
}: {
  data: number[];
  width: number;
  height: number;
  color: string;
}) {
  if (data.length < 2) return null;

  const PAD  = 8;
  const min  = Math.min(...data);
  const max  = Math.max(...data);
  const range = max - min || 10;

  const pts = data.map((v, i) => ({
    x: PAD + (i / (data.length - 1)) * (width - PAD * 2),
    y: PAD + ((max - v) / range) * (height - PAD * 2),
  }));

  const polyStr  = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath =
    `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} ` +
    pts.slice(1).map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ` L ${pts[pts.length - 1].x.toFixed(1)},${height} L ${pts[0].x.toFixed(1)},${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.18" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#lineGrad)" />
      <Polyline
        points={polyStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Category trends section
// ---------------------------------------------------------------------------

function CategoryTrendsSection({ trends }: { trends: CategoryTrend[] }) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing[4] }}>
      <Text variant="caption" weight="semibold" color="tertiary">CATEGORY TRENDS</Text>
      {trends.map((trend) => (
        <CategoryTrendRow key={trend.key} trend={trend} />
      ))}
    </View>
  );
}

function CategoryTrendRow({ trend }: { trend: CategoryTrend }) {
  const { colors, spacing, radius } = useTheme();

  const barColor =
    trend.avg >= 80 ? colors.positive :
    trend.avg >= 60 ? colors.tint     :
    trend.avg >= 40 ? colors.warning  : colors.negative;

  const trendIcon: keyof typeof MaterialIcons.glyphMap =
    trend.direction === 'improving' ? 'trending-up'   :
    trend.direction === 'declining' ? 'trending-down' : 'trending-flat';

  const trendColor =
    trend.direction === 'improving' ? colors.positive :
    trend.direction === 'declining' ? colors.negative : colors.textTertiary;

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
      <View style={styles.row}>
        <Text variant="bodySm" weight="medium" style={{ flex: 1 }}>{trend.label}</Text>
        <View style={[styles.row, { gap: 6 }]}>
          <MaterialIcons name={trendIcon} size={14} color={trendColor} />
          <Text variant="dataSm" weight="semibold" style={{ color: barColor }}>
            {trend.avg}
          </Text>
        </View>
      </View>

      {/* Bar */}
      <View style={[styles.barTrack, { backgroundColor: colors.borderSubtle }]}>
        <View
          style={[
            styles.barFill,
            { width: `${trend.avg}%` as `${number}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      {/* Comparison */}
      {trend.recentAvg !== trend.olderAvg && (
        <Text variant="dataSm" color="tertiary">
          Recent {trend.recentAvg}  ·  Earlier {trend.olderAvg}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stat box
// ---------------------------------------------------------------------------

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
      <Text variant="dataSm" color="tertiary">{label}</Text>
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
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row:         { flexDirection: 'row', alignItems: 'center' },
  barTrack:    { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill:     { height: 5, borderRadius: 3 },
  xAxis:       { flexDirection: 'row', alignItems: 'flex-start' },
});
