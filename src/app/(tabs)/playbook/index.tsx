import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/shared/empty-state';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';

const RULE_CATEGORIES = ['entry', 'exit', 'risk', 'psychology', 'process'] as const;
type RuleCategory = typeof RULE_CATEGORIES[number];

const CATEGORY_TONE: Record<RuleCategory, 'tint' | 'positive' | 'negative' | 'accent' | 'sage'> = {
  entry:      'tint',
  exit:       'positive',
  risk:       'negative',
  psychology: 'accent',
  process:    'sage',
};

export default function PlaybookScreen() {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScreenHeader
        title="Playbook"
        subtitle="Your trading rules"
        showDivider
        right={
          <IconSymbol name="plus" color={colors.tint} size={22} />
        }
      />

      <EmptyState
        heading="Define your edge"
        body="Your playbook is a living document of rules that keep you disciplined. Start by adding your first trading rule."
        action={{ label: 'Add First Rule', onPress: () => {} }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
