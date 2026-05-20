import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useSession } from '@/features/auth/hooks';
import { useInvalidatePlaybook, usePlaybookRules } from '@/features/playbook/hooks';
import { useTheme } from '@/hooks/use-theme';
import {
  deleteRule,
  PlaybookRule,
  RULE_CATEGORIES,
  RULE_CATEGORY_LABELS,
  RuleCategory,
  saveRule,
  updateRule,
} from '@/services/playbook';

type ThemeColors = ReturnType<typeof useTheme>['colors'];

function categoryColor(cat: RuleCategory, colors: ThemeColors): string {
  switch (cat) {
    case 'entry':      return colors.tint;
    case 'exit':       return colors.positive;
    case 'risk':       return colors.negative;
    case 'psychology': return colors.accent;
    case 'process':    return colors.textTertiary;
  }
}

export default function PlaybookRuleModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, spacing, radius } = useTheme();
  const { session } = useSession();
  const { rules } = usePlaybookRules();
  const invalidate = useInvalidatePlaybook();

  const existing = id ? rules.find((r) => r.id === id) ?? null : null;
  const isEdit   = !!existing;

  const [title,       setTitle]       = useState(existing?.title       ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category,    setCategory]    = useState<RuleCategory>(existing?.category ?? 'process');
  const [isActive,    setIsActive]    = useState(existing?.isActive    ?? true);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  // Keep form in sync when rules load (edit mode)
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? '');
      setCategory(existing.category);
      setIsActive(existing.isActive);
    }
  }, [existing?.id]);

  const canSave = title.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave || !session?.user.id) return;
    setSaving(true);
    try {
      if (isEdit && id) {
        await updateRule(id, { title, description: description || null, category, isActive });
      } else {
        await saveRule(session.user.id, { title, description: description || null, category });
      }
      invalidate('rules');
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save rule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete Rule',
      `Remove "${title}" from your playbook?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Delete',
          style:   'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteRule(id);
              invalidate('rules');
              router.back();
            } catch {
              Alert.alert('Error', 'Could not delete rule.');
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
          {isEdit ? 'Edit Rule' : 'New Rule'}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={8}
        >
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
        <ScrollView
          contentContainerStyle={{ padding: spacing[4], gap: spacing[6], paddingBottom: spacing[8] }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Field label="RULE">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. No trades after 2 consecutive losses"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor:     colors.border,
                  borderRadius:    radius.md,
                  color:           colors.text,
                  padding:         spacing[4],
                  fontSize:        15,
                },
              ]}
              multiline
              returnKeyType="done"
            />
          </Field>

          {/* Description */}
          <Field label="DETAIL (OPTIONAL)">
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Why this rule matters to you, or how to apply it"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor:     colors.border,
                  borderRadius:    radius.md,
                  color:           colors.text,
                  padding:         spacing[4],
                  fontSize:        15,
                  minHeight:       80,
                },
              ]}
              multiline
              textAlignVertical="top"
            />
          </Field>

          {/* Category picker */}
          <Field label="CATEGORY">
            <View style={styles.categoryGrid}>
              {RULE_CATEGORIES.map((cat) => {
                const selected = category === cat;
                const color    = categoryColor(cat, colors);
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selected ? color + '18' : colors.surface,
                        borderRadius:    radius.md,
                        borderWidth:     1,
                        borderColor:     selected ? color : colors.border,
                        paddingVertical: spacing[2],
                        paddingHorizontal: spacing[4],
                      },
                    ]}
                  >
                    <Text
                      variant="bodySm"
                      weight={selected ? 'semibold' : 'regular'}
                      style={{ color: selected ? color : colors.textTertiary }}
                    >
                      {RULE_CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

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
                <Text variant="body" weight="medium">Rule active</Text>
                <Text variant="dataSm" color="tertiary">
                  {isActive ? 'This rule is enforced in discipline scoring' : 'This rule is paused'}
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

          {/* Delete (edit only) */}
          {isEdit && (
            <Pressable
              onPress={handleDelete}
              disabled={deleting}
              style={[
                styles.row,
                {
                  justifyContent:  'center',
                  gap:             spacing[2],
                  paddingVertical: spacing[4],
                },
              ]}
            >
              {deleting
                ? <ActivityIndicator size="small" color={colors.negative} />
                : <MaterialIcons name="delete-outline" size={18} color={colors.negative} />}
              <Text
                variant="bodySm"
                style={{ color: deleting ? colors.textTertiary : colors.negative }}
              >
                {deleting ? 'Deleting…' : 'Delete this rule'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing[2] }}>
      <Text variant="caption" weight="semibold" color="tertiary">{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row:           { flexDirection: 'row', alignItems: 'center' },
  input:         { borderWidth: StyleSheet.hairlineWidth },
  categoryGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip:  {},
  toggle:        { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb:   { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
});
