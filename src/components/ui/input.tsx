import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Pressable,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  View,
} from 'react-native';

import { FontFamily } from '@/theme/fonts';
import { useTheme } from '@/hooks/use-theme';
import { Text } from './text';

interface InputProps extends RNTextInputProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, style, secureTextEntry, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const { colors, spacing, radius } = useTheme();

  const isPassword = secureTextEntry === true;

  const borderColor = error
    ? colors.negative
    : focused
    ? colors.tint
    : colors.border;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="caption" color="tertiary" weight="medium" style={{ marginBottom: 8, fontSize: 14 }}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor,
            paddingHorizontal: spacing[4],
            minHeight: 50,
          },
        ]}
      >
        <RNTextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: FontFamily.body.regular,
              fontSize: 16,
              lineHeight: 24,
            },
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={colors.tint}
          secureTextEntry={isPassword ? hidden : false}
          {...rest}
        />

        {isPassword && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            style={styles.eyeBtn}
          >
            <MaterialIcons
              name={hidden ? 'visibility-off' : 'visibility'}
              size={20}
              color={colors.textTertiary}
            />
          </Pressable>
        )}
      </View>

      {error ? (
        <Text variant="caption" color="negative" style={{ marginTop: 8 }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="tertiary" style={{ marginTop: 8 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:  { gap: 0 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input:    { flex: 1, paddingVertical: 12 },
  eyeBtn:   { paddingLeft: 8 },
});
