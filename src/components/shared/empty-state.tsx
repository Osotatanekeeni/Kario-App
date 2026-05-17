import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';

interface EmptyStateProps {
  heading: string;
  body: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ heading, body, action }: EmptyStateProps) {
  const { spacing } = useTheme();

  return (
    <View style={[styles.container, { paddingHorizontal: spacing[8] }]}>
      <View style={styles.content}>
        <Text variant="h2" style={styles.heading}>
          {heading}
        </Text>
        <Text variant="body" color="secondary" style={styles.body}>
          {body}
        </Text>
        {action && (
          <View style={{ marginTop: spacing[6] }}>
            <Button label={action.label} onPress={action.onPress} variant="primary" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 10,
    maxWidth: 300,
  },
  heading: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
