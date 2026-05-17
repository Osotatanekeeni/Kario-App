import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { IconSymbol } from './icon-symbol';
import { Text } from './text';

interface SelectionCardProps {
  label: string;
  description?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  selected: boolean;
  onPress: () => void;
}

export function SelectionCard({
  label,
  description,
  iconName,
  selected,
  onPress,
}: SelectionCardProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: selected ? colors.tint : colors.border,
          backgroundColor: selected ? colors.tint + '14' : colors.surface,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[4],
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {iconName ? (
        <MaterialIcons
          name={iconName}
          size={22}
          color={selected ? colors.tint : colors.textSecondary}
          style={styles.icon}
        />
      ) : null}

      <View style={styles.text}>
        <Text
          variant="body"
          weight="medium"
          style={{ color: selected ? colors.tint : colors.text }}
        >
          {label}
        </Text>
        {description ? (
          <Text variant="bodySm" color="tertiary" style={{ marginTop: 3 }}>
            {description}
          </Text>
        ) : null}
      </View>

      {selected ? (
        <IconSymbol name="checkmark.circle.fill" color={colors.tint} size={18} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: { width: 26 },
  text: { flex: 1 },
});
