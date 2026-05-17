import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ScreenHeader } from '@/components/shared/screen-header';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/hooks/use-theme';
import { useJournalStore } from '@/store/journal-store';
import { useUserStore } from '@/store/user-store';
import { computeMetrics, scoreColor, formatRelative } from '@/utils';
import { ROUTES } from '@/constants/routes';

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  const entries = useJournalStore((s) => s.entries);
  const profile = useUserStore((s) => s.profile);

  const closed = entries.filter((e) => e.status === 'closed');
  const metrics = computeMetrics(closed, 'all');
  const recentEntries = entries.slice(0, 3);

  const greeting = getGreeting();
  const displayName = profile?.displayName ?? 'Trader';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScreenHeader
        title={greeting}
        subtitle={displayName}
        showDivider
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing[6], gap: spacing[5] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Discipline score */}
        {closed.length > 0 && (
          <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: spacing[8] }}>
            <Text variant="caption" color="tertiary" weight="semibold" caps>
              Discipline Score
            </Text>
            <Text
              variant="display"
              color={scoreColor(metrics.overallScore) as any}
              style={{ marginTop: spacing[2] }}
            >
              {metrics.overallScore}
            </Text>
            <Text variant="dataSm" color="tertiary" style={{ marginTop: spacing[1] }}>
              {metrics.totalTrades} closed {metrics.totalTrades === 1 ? 'trade' : 'trades'}
            </Text>
          </Card>
        )}

        {/* Quick action */}
        <Card variant="outlined" style={{ gap: spacing[3] }}>
          <Text variant="h4">Ready to trade?</Text>
          <Text variant="bodySm" color="secondary">
            Log your emotional state before entering a position.
          </Text>
          <Button
            label="Log a Trade"
            variant="primary"
            onPress={() => router.push(ROUTES.LOG_TRADE as any)}
          />
        </Card>

        {/* Recent entries */}
        {recentEntries.length > 0 && (
          <View style={{ gap: spacing[3] }}>
            <View style={styles.row}>
              <Text variant="caption" color="tertiary" weight="semibold" caps>
                Recent Trades
              </Text>
              <Text
                variant="caption"
                color="tint"
                weight="medium"
                onPress={() => router.push(ROUTES.JOURNAL as any)}
              >
                See all
              </Text>
            </View>
            {recentEntries.map((entry) => (
              <Card key={entry.id} onPress={() => {}}>
                <View style={styles.row}>
                  <View>
                    <Text variant="h4">{entry.symbol}</Text>
                    <Text variant="dataSm" color="tertiary" style={{ marginTop: 3 }}>
                      {formatRelative(entry.createdAt)}
                    </Text>
                  </View>
                  <View style={{ gap: 4, alignItems: 'flex-end' }}>
                    {entry.outcome && (
                      <Badge
                        label={entry.outcome.charAt(0).toUpperCase() + entry.outcome.slice(1)}
                        tone={entry.outcome === 'win' ? 'positive' : entry.outcome === 'loss' ? 'negative' : 'neutral'}
                      />
                    )}
                    <Badge
                      label={entry.direction === 'long' ? 'Long' : 'Short'}
                      tone={entry.direction === 'long' ? 'tint' : 'sage'}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {recentEntries.length === 0 && (
          <Card variant="outlined">
            <Text variant="body" color="secondary" style={{ textAlign: 'center', lineHeight: 22 }}>
              No trades yet. Your first entry is the start of your edge.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
