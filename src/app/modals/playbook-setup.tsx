import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
import { useInvalidatePlaybook, usePlaybookSetups } from '@/features/playbook/hooks';
import { useTheme } from '@/hooks/use-theme';
import { deleteSetup, saveSetup, updateSetup } from '@/services/playbook';

export default function PlaybookSetupModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, spacing, radius } = useTheme();
  const { session } = useSession();
  const { setups } = usePlaybookSetups();
  const invalidate = useInvalidatePlaybook();

  const existing = id ? setups.find((s) => s.id === id) ?? null : null;
  const isEdit   = !!existing;

  const [name,                     setName]                     = useState(existing?.name                     ?? '');
  const [entryCriteria,            setEntryCriteria]            = useState(existing?.entryCriteria            ?? '');
  const [invalidationRules,        setInvalidationRules]        = useState(existing?.invalidationRules        ?? '');
  const [confirmationRequirements, setConfirmationRequirements] = useState(existing?.confirmationRequirements ?? '');
  const [notes,                    setNotes]                    = useState(existing?.notes                    ?? '');
  const [localImageUri,            setLocalImageUri]            = useState<string | null>(null);
  const [saving,                   setSaving]                   = useState(false);
  const [deleting,                 setDeleting]                 = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setEntryCriteria(existing.entryCriteria ?? '');
      setInvalidationRules(existing.invalidationRules ?? '');
      setConfirmationRequirements(existing.confirmationRequirements ?? '');
      setNotes(existing.notes ?? '');
    }
  }, [existing?.id]);

  const currentImageUri = localImageUri ?? existing?.screenshotUrl ?? null;
  const canSave = name.trim().length > 0 && !saving;

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!canSave || !session?.user.id) return;
    setSaving(true);
    try {
      if (isEdit && id) {
        await updateSetup(session.user.id, id, {
          name,
          localScreenshotUri:       localImageUri,
          existingScreenshotUrl:    existing?.screenshotUrl ?? null,
          entryCriteria:            entryCriteria            || null,
          invalidationRules:        invalidationRules        || null,
          confirmationRequirements: confirmationRequirements || null,
          notes:                    notes                    || null,
        });
      } else {
        await saveSetup(session.user.id, {
          name,
          localScreenshotUri:       localImageUri,
          entryCriteria:            entryCriteria            || null,
          invalidationRules:        invalidationRules        || null,
          confirmationRequirements: confirmationRequirements || null,
          notes:                    notes                    || null,
        });
      }
      invalidate('setups');
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete Setup',
      `Remove "${name}" from your playbook?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Delete',
          style:   'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteSetup(id);
              invalidate('setups');
              router.back();
            } catch {
              Alert.alert('Error', 'Could not delete setup.');
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
          {isEdit ? 'Edit Setup' : 'New Setup'}
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
        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing[8] }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Screenshot picker */}
          <Pressable onPress={handlePickImage}>
            {currentImageUri ? (
              <View>
                <Image
                  source={{ uri: currentImageUri }}
                  style={styles.screenshot}
                  contentFit="cover"
                />
                <View style={[styles.screenshotOverlay]}>
                  <MaterialIcons name="edit" size={18} color="#fff" />
                  <Text variant="bodySm" style={{ color: '#fff', marginLeft: 6 }}>
                    Change screenshot
                  </Text>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.screenshotPlaceholder,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <MaterialIcons name="add-photo-alternate" size={28} color={colors.textTertiary} />
                <Text variant="bodySm" color="tertiary" style={{ marginTop: 8 }}>
                  Add screenshot (optional)
                </Text>
              </View>
            )}
          </Pressable>

          {/* Form fields */}
          <View style={{ padding: spacing[4], gap: spacing[6] }}>
            <Field label="SETUP NAME">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. MSB Liquidity Grab"
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
              />
            </Field>

            <Field label="ENTRY CRITERIA">
              <TextInput
                value={entryCriteria}
                onChangeText={setEntryCriteria}
                placeholder="What must be true to enter this trade?"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.textArea,
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
                textAlignVertical="top"
              />
            </Field>

            <Field label="INVALIDATION RULES">
              <TextInput
                value={invalidationRules}
                onChangeText={setInvalidationRules}
                placeholder="When does this setup become invalid?"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.textArea,
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
                textAlignVertical="top"
              />
            </Field>

            <Field label="CONFIRMATION REQUIREMENTS">
              <TextInput
                value={confirmationRequirements}
                onChangeText={setConfirmationRequirements}
                placeholder="What confirms the setup before entry?"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.textArea,
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
                textAlignVertical="top"
              />
            </Field>

            <Field label="NOTES & OBSERVATIONS">
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Context, edge cases, lessons learned…"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.textArea,
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
                textAlignVertical="top"
              />
            </Field>

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
                  {deleting ? 'Deleting…' : 'Delete this setup'}
                </Text>
              </Pressable>
            )}
          </View>
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
  root:                { flex: 1 },
  header:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row:                 { flexDirection: 'row', alignItems: 'center' },
  screenshot:          { width: '100%', height: 180 },
  screenshotPlaceholder: {
    width:           '100%',
    height:          120,
    alignItems:      'center',
    justifyContent:  'center',
  },
  screenshotOverlay: {
    position:         'absolute',
    bottom:           0,
    left:             0,
    right:            0,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    paddingVertical:  10,
    backgroundColor:  'rgba(0,0,0,0.45)',
  },
  input:    { borderWidth: StyleSheet.hairlineWidth },
  textArea: { borderWidth: StyleSheet.hairlineWidth, minHeight: 88 },
});
