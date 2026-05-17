import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/shared/screen-header';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user-store';

export default function ProfileScreen() {
  const { colors, spacing, radius } = useTheme();
  const profile = useUserStore((s) => s.profile);
  const preferences = useUserStore((s) => s.preferences);

  const displayName = profile?.displayName ?? 'Trader';
  const tradingStyle = profile?.tradingStyle
    ? profile.tradingStyle
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'Not set';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScreenHeader title="Profile" showDivider />

      <ScrollView
        contentContainerStyle={{ padding: spacing[6], gap: spacing[6] }}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: spacing[10], gap: spacing[3] }}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: colors.tint + '1A',
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: colors.tint + '30',
              },
            ]}
          >
            <Text variant="h2" color="tint">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text variant="h3">{displayName}</Text>
            <Text variant="bodySm" color="tertiary">{tradingStyle}</Text>
          </View>
        </Card>

        <View style={{ gap: spacing[3] }}>
          <Text variant="caption" color="tertiary" weight="semibold" caps>
            Preferences
          </Text>
          <Card padding={0}>
            <SettingRow
              label="Theme"
              value={preferences.theme.charAt(0).toUpperCase() + preferences.theme.slice(1)}
              icon="gear"
            />
            <Divider subtle />
            <SettingRow label="Currency" value={preferences.defaultCurrency} icon="tag.fill" />
            <Divider subtle />
            <SettingRow
              label="Reminders"
              value={preferences.reminderEnabled ? 'On' : 'Off'}
              icon="bell.fill"
            />
          </Card>
        </View>

        <View style={{ gap: spacing[3] }}>
          <Text variant="caption" color="tertiary" weight="semibold" caps>
            About
          </Text>
          <Card variant="outlined" padding={0}>
            <SettingRow label="Version" value="1.0.0" icon="info.circle" />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, value, icon }: { label: string; value: string; icon: any }) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.settingRow,
        { paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
      ]}
    >
      <View style={styles.settingLeft}>
        <IconSymbol name={icon} color={colors.textTertiary} size={16} />
        <Text variant="body" style={{ marginLeft: spacing[3] }}>
          {label}
        </Text>
      </View>
      <Text variant="body" color="secondary">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
