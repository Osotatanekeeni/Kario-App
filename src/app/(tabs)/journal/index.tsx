import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/shared/empty-state';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import { useSession } from '@/features/auth/hooks';
import { useTheme } from '@/hooks/use-theme';
import { fetchTrades, TradeSummary } from '@/services/trades';
import { formatRelative } from '@/utils';

export default function JournalScreen() {
  const { colors, spacing } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const { data: trades = [], isLoading, refetch } = useQuery({
    queryKey: ['trades', userId],
    queryFn: () => fetchTrades(userId),
    enabled: !!userId,
  });

  const openModal = () => router.push('/modals/log-trade');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScreenHeader
        title="Journal"
        subtitle={
          trades.length > 0
            ? `${trades.length} ${trades.length === 1 ? 'entry' : 'entries'}`
            : undefined
        }
        showDivider
        right={
          <Pressable onPress={openModal} hitSlop={8}>
            <MaterialIcons name="add" size={26} color={colors.tint} />
          </Pressable>
        }
      />

      {isLoading ? (
        <View style={styles.center}>
          <Text variant="body" color="tertiary">Loading…</Text>
        </View>
      ) : trades.length === 0 ? (
        <EmptyState
          heading="No entries yet"
          body="Begin by recording your first trade. Honest reflection is the edge."
          action={{ label: 'Log a Trade', onPress: openModal }}
        />
      ) : (
        <FlatList
          data={trades}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          renderItem={({ item }) => <TradeCard trade={item} />}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Trade card
// ---------------------------------------------------------------------------

function TradeCard({ trade }: { trade: TradeSummary }) {
  const { colors, spacing } = useTheme();

  const outcomeTone =
    trade.outcome === 'win'
      ? 'positive'
      : trade.outcome === 'loss'
      ? 'negative'
      : trade.outcome === 'breakeven'
      ? 'warning'
      : 'neutral';

  const outcomLabel =
    trade.outcome
      ? trade.outcome.charAt(0).toUpperCase() + trade.outcome.slice(1)
      : 'Open';

  return (
    <Card style={{ gap: 0 }}>
      {/* Top row: pair + badges */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text variant="h4" weight="semibold">{trade.pair}</Text>
          <Text variant="dataSm" color="tertiary" style={{ marginTop: 3 }}>
            {formatRelative(trade.createdAt)}
          </Text>
        </View>
        <View style={styles.badges}>
          <Badge label={outcomLabel} tone={outcomeTone as any} />
          <Badge
            label={trade.direction === 'long' ? 'Long' : 'Short'}
            tone={trade.direction === 'long' ? 'tint' : 'neutral'}
          />
          {trade.session ? (
            <Badge label={trade.session} tone="neutral" />
          ) : null}
        </View>
      </View>

      {/* Emotions row */}
      {(trade.preEmotion || trade.postEmotion) && (
        <>
          <Divider subtle style={{ marginVertical: spacing[3] }} />
          <View style={styles.emotionRow}>
            {trade.preEmotion ? (
              <EmotionChip label={trade.preEmotion} prefix="Before" />
            ) : null}
            {trade.preEmotion && trade.postEmotion ? (
              <MaterialIcons name="arrow-forward" size={14} color={colors.textTertiary} />
            ) : null}
            {trade.postEmotion ? (
              <EmotionChip label={trade.postEmotion} prefix="After" />
            ) : null}
          </View>
        </>
      )}
    </Card>
  );
}

function EmotionChip({ label, prefix }: { label: string; prefix: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.emotionChip}>
      <Text variant="dataSm" color="tertiary">{prefix}: </Text>
      <Text variant="dataSm" weight="medium" style={{ color: colors.textSecondary }}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
