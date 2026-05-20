import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useSession } from '@/features/auth/hooks';
import { useInvalidatePlaybook, usePlaybookPrinciples } from '@/features/playbook/hooks';
import { useTheme } from '@/hooks/use-theme';
import { deletePrinciple, savePrinciple, updatePrinciple } from '@/services/playbook';

export default function PlaybookPrincipleModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, spacing, radius } = useTheme();
  const { session } = useSession();
  const { principles } = usePlaybookPrinciples();
  const invalidate = useInvalidatePlaybook();

  const existing = id ? principles.find((p) => p.id === id) ?? null : null;
  const isEdit   = !!existing;

  const [text,     setText]     = useState(existing?.text     ?? '');
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (existing) {
      setText(existing.text);
      setIsActive(existing.isActive);
    }
  }, [existing?.id]);

  // Auto-focus on open
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const canSave = text.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave || !session?.user.id) return;
    setSaving(true);
    try {
      if (isEdit && id) {
        await updatePrinciple(id, { text, isActive });
      } else {
        await savePrinciple(session.user.id, text);
      }
      invalidate('principles');
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save principle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete Principle',
      'Remove this principle from your playbook?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Delete',
          style:   'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePrinciple(id);
              invalidate('principles');
              router.back();
            } catch {
              Alert.alert('Error', 'Could not delete principle.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Header */}
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
          <MaterialIcons name="close" size={22} color={colors.textTertiary} />
        </Pressable>
        <Text variant="h4" weight="medium">
          {isEdit ? 'Edit Principle' : 'New Principle'}
        </Text>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={8}>
          {saving
            ? <ActivityIndicator size="small" color={colors.tint} />
            : (
              <Text
                variant="body"
                weight="semibold"
                style={{ color: canSave ? colors.tint : colors.textTertiary }}
              >
                Save
              </Text>
            )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Big editorial text input */}
        <View style={{ flex: 1, padding: spacing[6], gap: spacing[6] }}>
          <View
            style={[
              {
                flex:            1,
                backgroundColor: colors.surface,
                borderRadius:    radius.xl,
                borderWidth:     1,
                borderColor:     colors.tint + '30',
                padding:         spacing[6],
              },
            ]}
          >
            <Text variant="caption" weight="semibold" color="tertiary" style={{ marginBottom: spacing[4] }}>
              PRINCIPLE
            </Text>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder="Write something you need to remember when things get hard…"
              placeholderTextColor={colors.textTertiary}
              style={[
                {
                  flex:      1,
                  color:     colors.text,
                  fontSize:  20,
                  lineHeight: 30,
                  fontStyle: 'italic',
                },
              ]}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <Pressable
              onPress={() => setIsActive((v) => !v)}
              style={[
                styles.row,
                {
                  backgroundColor: colors.surface,
                  borderRadius:    radius.md,
                  borderWidth:     StyleSheet.hairlineWidth,
                  borderColor:     colors.border,
                  padding:         spacing[4],
                  justifyContent:  'space-between',
                },
              ]}
            >
              <View style={{ gap: 2 }}>
                <Text variant="body" weight="medium">Principle active</Text>
                <Text variant="dataSm" color="tertiary">
                  {isActive ? 'Shown as a daily reminder' : 'Currently paused'}
                </Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  { backgroundColor: isActive ? colors.positive : colors.borderSubtle },
                ]}
              >
                <View style={[styles.toggleThumb, { transform: [{ translateX: isActive ? 20 : 2 }] }]} />
              </View>
            </Pressable>
          )}

          {/* Delete */}
          {isEdit && (
            <Pressable
              onPress={handleDelete}
              disabled={deleting}
              style={[styles.row, { justifyContent: 'center', gap: spacing[2] }]}
            >
              {deleting
                ? <ActivityIndicator size="small" color={colors.negative} />
                : <MaterialIcons name="delete-outline" size={18} color={colors.negative} />}
              <Text
                variant="bodySm"
                style={{ color: deleting ? colors.textTertiary : colors.negative }}
              >
                {deleting ? 'Deleting…' : 'Delete this principle'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row:         { flexDirection: 'row', alignItems: 'center' },
  toggle:      { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
});
