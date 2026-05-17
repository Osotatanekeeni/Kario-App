import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';

export default function LogTradeModal() {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing[6], paddingVertical: spacing[4] }]}>
        <Text variant="h3">Log a Trade</Text>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <IconSymbol name="xmark" color={colors.textTertiary} size={20} />
        </Pressable>
      </View>
      <Divider />

      <ScrollView
        contentContainerStyle={{ padding: spacing[6], gap: spacing[5] }}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="outlined">
          <Text variant="bodySm" color="tertiary" style={{ lineHeight: 20 }}>
            How are you feeling right now? Honest pre-trade awareness is the foundation
            of disciplined execution.
          </Text>
        </Card>

        {/* Form fields are built out here */}
        <View style={{ gap: spacing[4] }}>
          <Text variant="caption" color="tertiary" weight="semibold" caps>
            Trade details
          </Text>
          <Card variant="outlined" style={{ minHeight: 56, justifyContent: 'center' }}>
            <Text variant="body" color="tertiary">Symbol — e.g. BTCUSD, AAPL</Text>
          </Card>
        </View>

        <View style={{ gap: spacing[4] }}>
          <Text variant="caption" color="tertiary" weight="semibold" caps>
            Pre-trade emotion
          </Text>
          <Card variant="outlined" style={{ minHeight: 56, justifyContent: 'center' }}>
            <Text variant="body" color="tertiary">How are you feeling?</Text>
          </Card>
        </View>

        <Button
          label="Save Entry"
          variant="primary"
          fullWidth
          onPress={() => router.back()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
