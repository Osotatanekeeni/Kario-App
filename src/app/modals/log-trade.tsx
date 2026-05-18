import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/features/auth/hooks';
import { AiDebrief } from '@/services/ai';
import { fetchUserRules, saveTrade, TradeFormData } from '@/services/trades';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 5;

const SESSIONS = ['London', 'New York', 'Asia', 'London/NY', 'Pre-Market'] as const;

// Labels match the emotion_label enum in the DB (lowercased on save)
const PRE_EMOTIONS = [
  'Calm', 'Confident', 'Focused', 'Anxious', 'Fearful', 'Impulsive',
] as const;

const POST_EMOTIONS = [
  'Calm', 'Confident', 'Frustrated', 'Overwhelmed', 'Detached', 'Euphoric',
] as const;

// Labels map to mistake_type enum via MISTAKE_ENUM in trades.ts
const MISTAKES = [
  'Early entry',
  'Early exit',
  'Late entry',
  'Held too long',
  'FOMO trade',
  'Revenge trade',
  'Moved stop loss',
  'Overtraded',
  'Sized too large',
  'Sized too small',
  'Ignored the plan',
  'Missed signal',
  'Broke a rule',
] as const;

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------

const DEFAULT_FORM: TradeFormData = {
  pair: '',
  direction: 'long',
  entryPrice: '',
  exitPrice: '',
  rrRatio: '',
  session: '',
  setupType: '',
  localScreenshots: [],
  notes: '',
  preEmotion: '',
  preIntensity: 3,
  postEmotion: '',
  postIntensity: 3,
  mistakes: [],
  otherMistake: '',
  reflection: '',
};

// ---------------------------------------------------------------------------
// Root modal component
// ---------------------------------------------------------------------------

export default function LogTradeModal() {
  const { colors, spacing, radius } = useTheme();
  const { session } = useSession();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<TradeFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [debrief, setDebrief] = useState<AiDebrief | null>(null);
  const [rules, setRules] = useState<string[]>([]);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (session?.user.id) {
      fetchUserRules(session.user.id).then(setRules).catch(() => {});
    }
  }, [session?.user.id]);

  const patch = useCallback((updates: Partial<TradeFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const scrollTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const canContinue = (): boolean => {
    if (step === 1) return form.pair.trim().length > 0;
    if (step === 2) return form.preEmotion !== '' && form.postEmotion !== '';
    return true;
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep((s) => s + 1);
      scrollTop();
      return;
    }

    // Step 4 → save + generate debrief → step 5
    if (!session?.user.id) return;
    setSaving(true);
    try {
      const result = await saveTrade(form, session.user.id, rules);
      setDebrief(result.debrief);
      setStep(5);
      scrollTop();
    } catch (e) {
      // Still advance to debrief with whatever AI returned
      setDebrief({
        behavioral: 'Unable to generate full analysis. Review your trade details carefully.',
        emotional: 'Reflect on how your emotions influenced this trade.',
        discipline: 'Check whether you followed your rules on this trade.',
        question: 'What is one thing you would do differently if this setup appeared again?',
      });
      setStep(5);
      scrollTop();
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      scrollTop();
    }
  };

  const ctaLabel = step === 4 ? 'Save Trade' : step === 5 ? 'Done' : 'Continue';

  const handleCta = () => {
    if (step === 5) {
      router.back();
      return;
    }
    handleNext();
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing[4], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.closeBtn}>
          <MaterialIcons name="close" size={22} color={colors.textTertiary} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text variant="caption" style={{ fontSize: 12, color: colors.textTertiary }}>
          {step}/{TOTAL_STEPS}
        </Text>
      </View>

      {/* Scrollable content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && <StepTradeDetails form={form} patch={patch} />}
          {step === 2 && <StepEmotions form={form} patch={patch} />}
          {step === 3 && <StepMistakes form={form} patch={patch} />}
          {step === 4 && <StepReflection form={form} patch={patch} />}
          {step === 5 && <StepDebrief debrief={debrief} />}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing[4],
            paddingBottom: spacing[2],
            paddingTop: spacing[3],
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.borderSubtle,
            backgroundColor: colors.background,
          },
        ]}
      >
        {step > 1 && step < 5 && (
          <Pressable onPress={handleBack} style={[styles.backBtn, { borderColor: colors.border }]}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textTertiary} />
          </Pressable>
        )}
        <Button
          label={saving ? 'Saving…' : ctaLabel}
          variant="primary"
          size="lg"
          fullWidth
          disabled={saving || (!canContinue() && step < 5)}
          icon={saving ? <ActivityIndicator size="small" color="#0F1115" /> : undefined}
          onPress={handleCta}
        />
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Trade Details
// ---------------------------------------------------------------------------

function StepTradeDetails({
  form,
  patch,
}: {
  form: TradeFormData;
  patch: (u: Partial<TradeFormData>) => void;
}) {
  const { colors, spacing, radius } = useTheme();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      patch({ localScreenshots: [...form.localScreenshots, ...uris] });
    }
  };

  const removeImage = (uri: string) => {
    patch({ localScreenshots: form.localScreenshots.filter((u) => u !== uri) });
  };

  return (
    <View style={{ gap: spacing[5] }}>
      <StepHeading title="Trade Details" subtitle="What did you take?" />

      {/* Pair */}
      <FieldBlock label="Instrument">
        <FieldInput
          value={form.pair}
          onChangeText={(v) => patch({ pair: v.toUpperCase() })}
          placeholder="BTCUSD, EURUSD, AAPL…"
          autoCapitalize="characters"
          returnKeyType="done"
        />
      </FieldBlock>

      {/* Direction */}
      <FieldBlock label="Direction">
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          {(['long', 'short'] as const).map((dir) => {
            const selected = form.direction === dir;
            const toneColor = dir === 'long' ? colors.positive : colors.negative;
            return (
              <Pressable
                key={dir}
                onPress={() => patch({ direction: dir })}
                style={[
                  styles.dirBtn,
                  {
                    flex: 1,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: selected ? toneColor : colors.border,
                    backgroundColor: selected ? toneColor + '18' : colors.surface,
                  },
                ]}
              >
                <MaterialIcons
                  name={dir === 'long' ? 'trending-up' : 'trending-down'}
                  size={18}
                  color={selected ? toneColor : colors.textTertiary}
                />
                <Text
                  variant="body"
                  weight="medium"
                  style={{ color: selected ? toneColor : colors.textTertiary }}
                >
                  {dir === 'long' ? 'Long' : 'Short'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FieldBlock>

      {/* Entry / Exit */}
      <FieldBlock label="Entry & Exit">
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          <View style={{ flex: 1 }}>
            <FieldInput
              value={form.entryPrice}
              onChangeText={(v) => patch({ entryPrice: v })}
              placeholder="Entry"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FieldInput
              value={form.exitPrice}
              onChangeText={(v) => patch({ exitPrice: v })}
              placeholder="Exit (optional)"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </View>
      </FieldBlock>

      {/* R:R */}
      <FieldBlock label="Risk : Reward">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <View style={{ flex: 1 }}>
            <FieldInput
              value={form.rrRatio.split(':')[0] ?? ''}
              onChangeText={(v) => {
                const right = form.rrRatio.split(':')[1] ?? '';
                patch({ rrRatio: v + ':' + right });
              }}
              placeholder="1"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
          <Text variant="h3" color="tertiary" style={{ paddingBottom: 2 }}>:</Text>
          <View style={{ flex: 1 }}>
            <FieldInput
              value={form.rrRatio.split(':')[1] ?? ''}
              onChangeText={(v) => {
                const left = form.rrRatio.split(':')[0] ?? '';
                patch({ rrRatio: left + ':' + v });
              }}
              placeholder="2"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </View>
      </FieldBlock>

      {/* Session */}
      <FieldBlock label="Session">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            {SESSIONS.map((s) => {
              const selected = form.session === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => patch({ session: selected ? '' : s })}
                  style={[
                    styles.chip,
                    {
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: selected ? colors.tint : colors.border,
                      backgroundColor: selected ? colors.tint + '18' : colors.surface,
                      paddingHorizontal: spacing[4],
                      paddingVertical: spacing[2],
                    },
                  ]}
                >
                  <Text
                    variant="bodySm"
                    weight={selected ? 'semibold' : 'regular'}
                    style={{ color: selected ? colors.tint : colors.textSecondary }}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </FieldBlock>

      {/* Setup Type */}
      <FieldBlock label="Setup Type (optional)">
        <FieldInput
          value={form.setupType}
          onChangeText={(v) => patch({ setupType: v })}
          placeholder="e.g. Break & Retest, FVG, ICT…"
          returnKeyType="done"
        />
      </FieldBlock>

      {/* Screenshots */}
      <FieldBlock label="Screenshots (optional)">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'center' }}>
            {form.localScreenshots.map((uri) => (
              <Pressable key={uri} onPress={() => removeImage(uri)} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumb} />
                <View style={[styles.thumbRemove, { backgroundColor: colors.negative }]}>
                  <MaterialIcons name="close" size={10} color="#fff" />
                </View>
              </Pressable>
            ))}
            <Pressable
              onPress={pickImage}
              style={[
                styles.addPhoto,
                { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <MaterialIcons name="add-a-photo" size={20} color={colors.textTertiary} />
            </Pressable>
          </View>
        </ScrollView>
      </FieldBlock>

      {/* Notes */}
      <FieldBlock label="Notes (optional)">
        <FieldInput
          value={form.notes}
          onChangeText={(v) => patch({ notes: v })}
          placeholder="Anything else about this trade…"
          multiline
          numberOfLines={3}
          style={{ minHeight: 72 }}
          returnKeyType="done"
          blurOnSubmit
        />
      </FieldBlock>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Emotional Check-In
// ---------------------------------------------------------------------------

function StepEmotions({
  form,
  patch,
}: {
  form: TradeFormData;
  patch: (u: Partial<TradeFormData>) => void;
}) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing[6] }}>
      <StepHeading
        title="Emotional Check-In"
        subtitle="Honest awareness is your first edge."
      />

      <View style={{ gap: spacing[4] }}>
        <SectionLabel>Before the trade</SectionLabel>
        <EmotionGrid
          options={PRE_EMOTIONS}
          selected={form.preEmotion}
          onSelect={(e) => patch({ preEmotion: e })}
        />
        <IntensityPicker
          label="Intensity before"
          value={form.preIntensity}
          onChange={(v) => patch({ preIntensity: v })}
        />
      </View>

      <View style={{ gap: spacing[4] }}>
        <SectionLabel>After the trade</SectionLabel>
        <EmotionGrid
          options={POST_EMOTIONS}
          selected={form.postEmotion}
          onSelect={(e) => patch({ postEmotion: e })}
        />
        <IntensityPicker
          label="Intensity after"
          value={form.postIntensity}
          onChange={(v) => patch({ postIntensity: v })}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Mistake Selection
// ---------------------------------------------------------------------------

function StepMistakes({
  form,
  patch,
}: {
  form: TradeFormData;
  patch: (u: Partial<TradeFormData>) => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const [noneSelected, setNoneSelected] = useState(false);

  const isOtherSelected = form.mistakes.includes('Other');

  const toggle = (m: string) => {
    // Tapping any real mistake deactivates None
    if (noneSelected) setNoneSelected(false);
    const next = form.mistakes.includes(m)
      ? form.mistakes.filter((x) => x !== m)
      : [...form.mistakes, m];
    // If deselecting Other, also clear the text
    if (m === 'Other' && form.mistakes.includes('Other')) {
      patch({ mistakes: next, otherMistake: '' });
    } else {
      patch({ mistakes: next });
    }
  };

  const handleNone = () => {
    const next = !noneSelected;
    setNoneSelected(next);
    if (next) patch({ mistakes: [], otherMistake: '' });
  };

  return (
    <View style={{ gap: spacing[5] }}>
      <StepHeading
        title="Mistakes"
        subtitle="Select any that apply."
      />

      {/* Mistake chips — includes Other inline */}
      <View style={styles.mistakeGrid}>
        {MISTAKES.map((m) => {
          const selected = form.mistakes.includes(m);
          return (
            <Pressable
              key={m}
              onPress={() => toggle(m)}
              style={[
                styles.mistakeChip,
                {
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: selected ? colors.negative : colors.border,
                  backgroundColor: selected ? colors.negative + '18' : colors.surface,
                },
              ]}
            >
              {selected && (
                <MaterialIcons name="close" size={14} color={colors.negative} />
              )}
              <Text
                variant="bodySm"
                weight={selected ? 'semibold' : 'regular'}
                style={{ color: selected ? colors.negative : colors.textSecondary }}
              >
                {m}
              </Text>
            </Pressable>
          );
        })}

        {/* Other chip — inline with the rest */}
        <Pressable
          onPress={() => toggle('Other')}
          style={[
            styles.mistakeChip,
            {
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: isOtherSelected ? colors.tint : colors.border,
              backgroundColor: isOtherSelected ? colors.tint + '12' : colors.surface,
            },
          ]}
        >
          <MaterialIcons
            name={isOtherSelected ? 'edit' : 'add'}
            size={14}
            color={isOtherSelected ? colors.tint : colors.textTertiary}
          />
          <Text
            variant="bodySm"
            weight={isOtherSelected ? 'semibold' : 'regular'}
            style={{ color: isOtherSelected ? colors.tint : colors.textSecondary }}
          >
            Other
          </Text>
        </Pressable>
      </View>

      {/* Other text input — shown below grid when Other is selected */}
      {isOtherSelected && (
        <TextInput
          style={[
            {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              color: colors.text,
              fontSize: 15,
            },
          ]}
          placeholder="Describe the mistake…"
          placeholderTextColor={colors.textTertiary}
          value={form.otherMistake}
          onChangeText={(v) => patch({ otherMistake: v })}
          returnKeyType="done"
          blurOnSubmit
          selectionColor={colors.tint}
          autoFocus
        />
      )}

      {/* None of the above */}
      <Pressable
        onPress={handleNone}
        style={[
          styles.noneChip,
          {
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: noneSelected ? colors.accent : colors.border,
            backgroundColor: noneSelected ? colors.accent + '14' : 'transparent',
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
          },
        ]}
      >
        {noneSelected && (
          <MaterialIcons name="check" size={16} color={colors.accent} />
        )}
        <Text
          variant="bodySm"
          weight={noneSelected ? 'semibold' : 'regular'}
          style={{ color: noneSelected ? colors.accent : colors.textTertiary }}
        >
          None of the above
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Reflection
// ---------------------------------------------------------------------------

function StepReflection({
  form,
  patch,
}: {
  form: TradeFormData;
  patch: (u: Partial<TradeFormData>) => void;
}) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ gap: spacing[5] }}>
      <StepHeading
        title="Reflect"
        subtitle="Write freely. This is for you, not the market."
      />
      <TextInput
        style={[
          styles.reflectionInput,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            color: colors.text,
            padding: spacing[4],
            fontSize: 16,
            lineHeight: 26,
          },
        ]}
        placeholder="What happened? What would you do differently? What did you learn?"
        placeholderTextColor={colors.textTertiary}
        value={form.reflection}
        onChangeText={(v) => patch({ reflection: v })}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        returnKeyType="done"
        blurOnSubmit
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — AI Debrief
// ---------------------------------------------------------------------------

function StepDebrief({ debrief }: { debrief: AiDebrief | null }) {
  const { colors, spacing, radius } = useTheme();

  if (!debrief) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8] }}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text variant="body" color="tertiary" style={{ marginTop: spacing[4] }}>
          Generating your debrief…
        </Text>
      </View>
    );
  }

  const cards: Array<{ label: string; content: string; highlight?: boolean }> = [
    { label: 'Behaviour', content: debrief.behavioral },
    { label: 'Emotion', content: debrief.emotional },
    { label: 'Discipline', content: debrief.discipline },
    { label: 'Reflect on this', content: debrief.question, highlight: true },
  ];

  return (
    <View style={{ gap: spacing[5] }}>
      <StepHeading title="Your Debrief" subtitle="Powered by Kario AI" />

      {cards.map(({ label, content, highlight }) => (
        <View
          key={label}
          style={[
            styles.debriefCard,
            {
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: highlight ? colors.tint + '60' : colors.border,
              backgroundColor: highlight ? colors.tint + '0A' : colors.surface,
              padding: spacing[5],
            },
          ]}
        >
          <Text
            variant="caption"
            weight="semibold"
            style={{ color: highlight ? colors.tint : colors.textTertiary, marginBottom: spacing[2] }}
          >
            {label.toUpperCase()}
          </Text>
          <Text variant="body" style={{ lineHeight: 24, color: colors.text }}>
            {content}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing[1] }}>
      <Text variant="h3" weight="semibold">{title}</Text>
      <Text variant="body" color="tertiary">{subtitle}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text variant="caption" weight="semibold" style={{ color: colors.textTertiary }}>
      {children.toUpperCase()}
    </Text>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing[2] }}>
      <Text variant="caption" weight="medium" color="tertiary" style={{ fontSize: 14 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function FieldInput({
  style,
  ...props
}: React.ComponentProps<typeof TextInput>) {
  const { colors, spacing, radius } = useTheme();
  return (
    <TextInput
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          color: colors.text,
          fontSize: 16,
          lineHeight: 24,
        },
        style,
      ]}
      placeholderTextColor={colors.textTertiary}
      selectionColor={colors.tint}
      {...props}
    />
  );
}

function EmotionGrid({
  options,
  selected,
  onSelect,
}: {
  options: readonly string[];
  selected: string;
  onSelect: (e: string) => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={styles.emotionGrid}>
      {options.map((e) => {
        const active = selected === e;
        return (
          <Pressable
            key={e}
            onPress={() => onSelect(active ? '' : e)}
            style={[
              {
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: active ? colors.tint : colors.border,
                backgroundColor: active ? colors.tint + '18' : colors.surface,
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[2],
              },
            ]}
          >
            <Text
              variant="bodySm"
              weight={active ? 'semibold' : 'regular'}
              style={{ color: active ? colors.tint : colors.textSecondary }}
            >
              {e}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function IntensityPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing[2] }}>
      <Text variant="caption" color="tertiary" weight="medium">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing[2] }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= value;
          return (
            <Pressable key={n} onPress={() => onChange(n)} hitSlop={4}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: active ? colors.tint : colors.border,
                  backgroundColor: active ? colors.tint : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  variant="bodySm"
                  weight="semibold"
                  style={{ color: active ? '#0F1115' : colors.textTertiary }}
                >
                  {n}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumb: {
    width: 72,
    height: 72,
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 72,
    height: 72,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mistakeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mistakeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  reflectionInput: {
    borderWidth: 1,
    minHeight: 160,
  },
  debriefCard: {
    gap: 0,
  },
});
