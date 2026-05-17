import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface DividerProps extends ViewProps {
  subtle?: boolean;
  spacing?: number;
}

export function Divider({ subtle = false, spacing, style, ...rest }: DividerProps) {
  const { colors } = useTheme();

  const margin = spacing ?? 0;

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: subtle ? colors.borderSubtle : colors.border,
          marginVertical: margin,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
