import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
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
import { Divider } from '@/components/ui/divider';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SelectionCard } from '@/components/ui/selection-card';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user-store';

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

interface OnboardingData {
  yearsTrading:     string;
  markets:          string[];
  tradingSession:   string;
  tradingStyle:     string;
  mainChallenge:    string;
  dominantEmotion:  string;
  recurringMistake: string;
  rules:            string[];
  goals:            string[];
  traderIdentity:   string;
}

const INITIAL: OnboardingData = {
  yearsTrading:     '',
  markets:          [],
  tradingSession:   '',
  tradingStyle:     '',
  mainChallenge:    '',
  dominantEmotion:  '',
  recurringMistake: '',
  rules:            [],
  goals:            [],
  traderIdentity:   '',
};

const TOTAL_STEPS = 6;

const SUGGESTED_RULES = [
  'Max 3 trades per day',
  'Minimum 2:1 risk-reward ratio',
  'Wait for candle close confirmation',
  'Never move stop loss against me',
  'Risk no more than 1% per trade',
  'No trading during news events',
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const { colors, spacing } = useTheme();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const updateProfile         = useUserStore((s) => s.updateProfile);
  const setHasSeenOnboarding  = useUserStore((s) => s.setHasSeenOnboarding);
  const setPendingOnboarding  = useUserStore((s) => s.setPendingOnboarding);

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArray(key: 'markets' | 'goals', value: string) {
    setData((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  function goNext() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }

  function goBack() {
    if (step > 1) {
      setStep((s) => s - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }

  async function handleFinish() {
    setSaving(true);
    updateProfile({ tradingStyle: data.tradingStyle as any });
    setPendingOnboarding({
      yearsTrading:     data.yearsTrading,
      markets:          data.markets,
      tradingSession:   data.tradingSession,
      tradingStyle:     data.tradingStyle,
      mainChallenge:    data.mainChallenge,
      dominantEmotion:  data.dominantEmotion,
      recurringMistake: data.recurringMistake,
      rules:            data.rules,
      goals:            data.goals,
      traderIdentity:   data.traderIdentity,
    });
    setHasSeenOnboarding(true);
    setSaving(false);
    router.replace('/(auth)/sign-in');
  }

  const canAdvance = stepIsComplete(step, data);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header — back button (when applicable) stacked above progress bar */}
        <View style={[styles.header, { paddingHorizontal: spacing[6], paddingTop: spacing[4] }]}>
          {step > 1 && (
            <Pressable onPress={goBack} style={[styles.backBtn, { marginBottom: 8 }]} hitSlop={12}>
              <IconSymbol name="chevron.left" color={colors.textTertiary} size={20} />
            </Pressable>
          )}
          <ProgressBar current={step} total={TOTAL_STEPS} variant="segmented" />
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { padding: spacing[6], paddingTop: 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && <StepWelcome />}
          {step === 2 && <StepTradingIdentity data={data} update={update} toggleArray={toggleArray} />}
          {step === 3 && <StepEmotionalAssessment data={data} update={update} />}
          {step === 4 && <StepRuleDefinition data={data} update={update} />}
          {step === 5 && <StepGoalSetting data={data} toggleArray={toggleArray} />}
          {step === 6 && <StepFirstReflection data={data} update={update} />}

          <View style={{ height: spacing[8] }} />
        </ScrollView>

        {/* Footer CTA */}
        <View style={[styles.footer, { padding: spacing[6], paddingBottom: spacing[8] }]}>
          <Button
            label={step === TOTAL_STEPS ? 'Begin my practice' : 'Continue'}
            variant="primary"
            fullWidth
            loading={saving}
            disabled={!canAdvance || saving}
            onPress={step === TOTAL_STEPS ? handleFinish : goNext}
          />
          {step === 1 && (
            <>
              <Pressable
                onPress={() => { setHasSeenOnboarding(true); router.replace('/(auth)/sign-in'); }}
                style={{ marginTop: spacing[2] }}
              >
                <Text variant="bodySm" color="tertiary" style={{ textAlign: 'center' }}>
                  Skip for now
                </Text>
              </Pressable>

              <Text variant="bodySm" color="tertiary" style={[styles.disclaimer, { marginTop: spacing[8] }]}>
                Kario is not a trading platform. It does not give financial advice.
                It helps you understand yourself as a trader.
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Step validation
// ---------------------------------------------------------------------------

function stepIsComplete(step: number, data: OnboardingData): boolean {
  switch (step) {
    case 1: return true;
    case 2: return !!data.tradingStyle;
    case 3: return !!data.mainChallenge;
    case 4: return true;
    case 5: return data.goals.length > 0;
    case 6: return data.traderIdentity.trim().length > 0;
    default: return true;
  }
}

// ---------------------------------------------------------------------------
// Step 1 — Welcome
// ---------------------------------------------------------------------------

function StepWelcome() {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing[6] }}>
      <View style={{ gap: spacing[3] }}>
        <Text variant="display" style={{ lineHeight: 56 }}>
          A performance OS for disciplined traders.
        </Text>
      </View>

      <Divider subtle />

      <View style={{ gap: spacing[4] }}>
        <PillarRow
          iconName="psychology"
          label="Emotional awareness"
          body="Understand how your psychology affects every decision you make at the chart."
        />
        <PillarRow
          iconName="rule"
          label="Discipline tracking"
          body="Measure rule adherence, not just profits. Process is the only thing you control."
        />
        <PillarRow
          iconName="center-focus-strong"
          label="Execution quality"
          body="Reflect on how you entered and exited — independent of outcome."
        />
      </View>
    </View>
  );
}

function PillarRow({
  iconName,
  label,
  body,
}: {
  iconName: keyof typeof MaterialIcons.glyphMap;
  label: string;
  body: string;
}) {
  const { spacing, colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'flex-start' }}>
      <MaterialIcons name={iconName} size={22} color={colors.tint} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="body" weight="medium">{label}</Text>
        <Text variant="bodySm" color="secondary">{body}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Trading Identity
// ---------------------------------------------------------------------------

function StepTradingIdentity({
  data, update, toggleArray,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
  toggleArray: (k: 'markets' | 'goals', v: string) => void;
}) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing[7] }}>
      <StepHeading
        title="Your trading identity"
        subtitle="This helps Kario contextualise your journal and coaching. Be honest — it's only for you."
      />

      <StepSection label="How long have you been trading?">
        {[
          { value: 'under_1', label: 'Under 1 year',  iconName: 'eco'         as const },
          { value: '1_to_3',  label: '1–3 years',      iconName: 'trending-up' as const },
          { value: '3_to_5',  label: '3–5 years',      iconName: 'bolt'        as const },
          { value: 'over_5',  label: '5+ years',       iconName: 'stars'       as const },
        ].map((opt) => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            iconName={opt.iconName}
            selected={data.yearsTrading === opt.value}
            onPress={() => update('yearsTrading', opt.value)}
          />
        ))}
      </StepSection>

      <StepSection label="What markets do you trade?" hint="Select all that apply">
        {[
          { value: 'forex',   label: 'Forex',   iconName: 'swap-horiz'     as const },
          { value: 'stocks',  label: 'Stocks',  iconName: 'bar-chart'      as const },
          { value: 'crypto',  label: 'Crypto',  iconName: 'toll'           as const },
          { value: 'futures', label: 'Futures', iconName: 'trending-down'  as const },
          { value: 'options', label: 'Options', iconName: 'tune'           as const },
        ].map((opt) => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            iconName={opt.iconName}
            selected={data.markets.includes(opt.value)}
            onPress={() => toggleArray('markets', opt.value)}
          />
        ))}
      </StepSection>

      <StepSection label="What session do you trade most?">
        {[
          { value: 'london',    label: 'London',           description: '08:00–17:00 GMT' },
          { value: 'new_york',  label: 'New York',         description: '13:00–22:00 GMT' },
          { value: 'tokyo',     label: 'Tokyo',            description: '00:00–09:00 GMT' },
          { value: 'overlap',   label: 'Session overlaps', description: 'London/NY crossover' },
          { value: 'us_market', label: 'US market hours',  description: 'Stocks & ETFs' },
        ].map((opt) => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            selected={data.tradingSession === opt.value}
            onPress={() => update('tradingSession', opt.value)}
          />
        ))}
      </StepSection>

      <StepSection label="What style best describes you?" hint="Required">
        {[
          { value: 'scalper',  label: 'Scalper',  description: 'Seconds to minutes, high frequency' },
          { value: 'intraday', label: 'Intraday', description: 'Within a single session, no overnight' },
          { value: 'swing',    label: 'Swing',    description: 'Days to weeks, follow the trend' },
          { value: 'position', label: 'Position', description: 'Weeks to months, macro view' },
        ].map((opt) => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            selected={data.tradingStyle === opt.value}
            onPress={() => update('tradingStyle', opt.value)}
          />
        ))}
      </StepSection>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Emotional Self-Assessment
// ---------------------------------------------------------------------------

function StepEmotionalAssessment({
  data, update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
}) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing[7] }}>
      <StepHeading
        title="Know your patterns"
        subtitle="Self-awareness is the foundation of discipline. Answer honestly — no one else sees this."
      />

      <StepSection label="What hurts your trading most?" hint="Required">
        {[
          { value: 'fear',            label: 'Fear',            iconName: 'sentiment-dissatisfied'      as const, description: 'Hesitating on valid setups, second-guessing' },
          { value: 'impulsiveness',   label: 'Impulsiveness',   iconName: 'bolt'                        as const, description: 'Entering before confirmation, acting on instinct' },
          { value: 'revenge_trading', label: 'Revenge trading', iconName: 'whatshot'                    as const, description: 'Entering after a loss to "recover"' },
          { value: 'overconfidence',  label: 'Overconfidence',  iconName: 'emoji-events'                as const, description: 'Oversizing after wins, ignoring risk' },
          { value: 'hesitation',      label: 'Hesitation',      iconName: 'hourglass-empty'             as const, description: 'Valid setups missed due to overthinking' },
          { value: 'impatience',      label: 'Lack of patience',iconName: 'timer-off'                   as const, description: 'Forcing trades when there is no setup' },
        ].map((opt) => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            iconName={opt.iconName}
            selected={data.mainChallenge === opt.value}
            onPress={() => update('mainChallenge', opt.value)}
          />
        ))}
      </StepSection>

      <StepSection label="What emotion affects you most at the chart?">
        {[
          { value: 'anxious',    label: 'Anxiety',          iconName: 'sentiment-very-dissatisfied' as const },
          { value: 'greedy',     label: 'Greed',            iconName: 'monetization-on'             as const },
          { value: 'frustrated', label: 'Frustration',      iconName: 'mood-bad'                    as const },
          { value: 'impulsive',  label: 'Impulsiveness',    iconName: 'flash-on'                    as const },
          { value: 'fearful',    label: 'Fear of losing',   iconName: 'warning'                     as const },
          { value: 'detached',   label: 'Detachment',       iconName: 'blur-on'                     as const },
        ].map((opt) => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            iconName={opt.iconName}
            selected={data.dominantEmotion === opt.value}
            onPress={() => update('dominantEmotion', opt.value)}
          />
        ))}
      </StepSection>

      <StepSection label="What mistake repeats most often?">
        {[
          { value: 'fomo',                label: 'FOMO entries',        iconName: 'flight-takeoff'  as const, description: 'Chasing moves already in progress' },
          { value: 'overtrading',         label: 'Overtrading',         iconName: 'sync'            as const, description: 'Too many trades, too little edge' },
          { value: 'early_exits',         label: 'Early exits',         iconName: 'exit-to-app'     as const, description: 'Closing winners before target' },
          { value: 'oversized_positions', label: 'Oversized positions', iconName: 'view-comfy'      as const, description: 'Risking more than the plan allows' },
          { value: 'emotional_entries',   label: 'Emotional entries',   iconName: 'flash-on'        as const, description: 'Trading from emotion, not setup' },
        ].map((opt) => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            iconName={opt.iconName}
            selected={data.recurringMistake === opt.value}
            onPress={() => update('recurringMistake', opt.value)}
          />
        ))}
      </StepSection>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Rule Definition
// ---------------------------------------------------------------------------

function StepRuleDefinition({
  data, update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
}) {
  const { spacing, colors } = useTheme();
  const [draft, setDraft] = useState('');
  const inputRef = useRef<TextInput>(null);

  function addRule(text: string) {
    const trimmed = text.trim();
    if (!trimmed || data.rules.includes(trimmed)) return;
    update('rules', [...data.rules, trimmed]);
    setDraft('');
  }

  function removeRule(rule: string) {
    update('rules', data.rules.filter((r) => r !== rule));
  }

  function addSuggested(rule: string) {
    if (!data.rules.includes(rule)) {
      update('rules', [...data.rules, rule]);
    }
  }

  return (
    <View style={{ gap: spacing[7] }}>
      <StepHeading
        title="Define your playbook"
        subtitle="Rules are the operating system of discipline. They make decisions before emotion can. Add at least one — you can always refine later."
      />

      {data.rules.length > 0 && (
        <View style={{ gap: spacing[2] }}>
          <Text variant="caption" color="tertiary" weight="semibold" caps>
            Your rules
          </Text>
          {data.rules.map((rule) => (
            <View
              key={rule}
              style={[
                styles.ruleRow,
                {
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.tint + '40',
                  backgroundColor: colors.tint + '0C',
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                },
              ]}
            >
              <Text variant="body" style={{ flex: 1, color: colors.tint }}>{rule}</Text>
              <Pressable onPress={() => removeRule(rule)} hitSlop={8}>
                <MaterialIcons name="close" size={16} color={colors.textTertiary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={{ gap: spacing[3] }}>
        <Text variant="caption" color="tertiary" weight="semibold" caps>
          Add a rule
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <TextInput
            ref={inputRef}
            style={[
              styles.ruleInput,
              {
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[3],
                color: colors.text,
                fontSize: 16,
              },
            ]}
            placeholder="e.g. Never risk more than 1%"
            placeholderTextColor={colors.textTertiary}
            value={draft}
            onChangeText={setDraft}
            returnKeyType="done"
            onSubmitEditing={() => addRule(draft)}
          />
          <Pressable
            onPress={() => addRule(draft)}
            disabled={!draft.trim()}
            style={({ pressed }) => [
              styles.addBtn,
              {
                backgroundColor: draft.trim() ? colors.tint : colors.border,
                borderRadius: 12,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <MaterialIcons name="add" size={20} color={draft.trim() ? '#0F1115' : colors.textTertiary} />
          </Pressable>
        </View>
      </View>

      <View style={{ gap: spacing[3] }}>
        <Text variant="caption" color="tertiary" weight="semibold" caps>
          Common rules — tap to add
        </Text>
        <View style={{ gap: spacing[2] }}>
          {SUGGESTED_RULES.filter((r) => !data.rules.includes(r)).map((rule) => (
            <Pressable
              key={rule}
              onPress={() => addSuggested(rule)}
              style={({ pressed }) => [
                styles.suggestionRow,
                {
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  opacity: pressed ? 0.65 : 1,
                },
              ]}
            >
              <Text variant="bodySm" color="secondary" style={{ flex: 1 }}>{rule}</Text>
              <MaterialIcons name="add" size={16} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Goal Setting
// ---------------------------------------------------------------------------

function StepGoalSetting({
  data, toggleArray,
}: {
  data: OnboardingData;
  toggleArray: (k: 'markets' | 'goals', v: string) => void;
}) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing[7] }}>
      <StepHeading
        title="What do you want to improve?"
        subtitle="Focus on process, not profits. Select the areas that matter most to you right now."
      />

      <StepSection label="Choose your focus areas" hint="Select at least one">
        {[
          { value: 'discipline',            label: 'Discipline',             iconName: 'rule'             as const, description: 'Following rules even when it is difficult' },
          { value: 'emotional_consistency', label: 'Emotional consistency',  iconName: 'self-improvement' as const, description: 'Staying neutral across wins and losses' },
          { value: 'execution_quality',     label: 'Execution quality',      iconName: 'gps-fixed'        as const, description: 'Entering and exiting with precision' },
          { value: 'patience',              label: 'Patience',               iconName: 'hourglass-empty'  as const, description: 'Waiting for the high-probability setup' },
          { value: 'process',               label: 'Process adherence',      iconName: 'checklist'        as const, description: 'Trusting the system over gut instinct' },
        ].map((opt) => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            iconName={opt.iconName}
            selected={data.goals.includes(opt.value)}
            onPress={() => toggleArray('goals', opt.value)}
          />
        ))}
      </StepSection>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 6 — First Reflection
// ---------------------------------------------------------------------------

function StepFirstReflection({
  data, update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
}) {
  const { spacing, colors } = useTheme();

  return (
    <View style={{ gap: spacing[7] }}>
      <StepHeading
        title="One last question."
        subtitle="Take a moment. There is no right answer here."
      />

      <View style={{ gap: spacing[4] }}>
        <Text variant="bodyLg" style={{ lineHeight: 28 }}>
          What kind of trader do you want to become?
        </Text>
        <Text variant="bodySm" color="tertiary" style={{ lineHeight: 22 }}>
          Not what returns you want to make — who do you want to be as a trader?
          Describe the mindset, the habits, the version of yourself that executes with clarity.
        </Text>

        <TextInput
          style={[
            styles.reflectionInput,
            {
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: data.traderIdentity ? colors.tint + '50' : colors.border,
              padding: spacing[4],
              color: colors.text,
              fontSize: 16,
              lineHeight: 24,
              minHeight: 160,
            },
          ]}
          multiline
          textAlignVertical="top"
          placeholder="I want to be a trader who is patient, process-driven, and emotionally consistent…"
          placeholderTextColor={colors.textTertiary}
          value={data.traderIdentity}
          onChangeText={(t) => update('traderIdentity', t)}
          selectionColor={colors.tint}
        />

        {data.traderIdentity.length > 0 && (
          <Text variant="dataSm" color="tertiary" style={{ textAlign: 'right' }}>
            {data.traderIdentity.length} characters
          </Text>
        )}
      </View>

      <View style={{ gap: spacing[3] }}>
        <Text variant="caption" color="tertiary" style={{ lineHeight: 20 }}>
          This reflection stays private. Kario uses it to personalise your AI coaching and
          remind you of your intention when discipline slips.
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing[3] }}>
      <Text variant="h1">{title}</Text>
      <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
        {subtitle}
      </Text>
    </View>
  );
}

function StepSection({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing[3] }}>
      <View style={{ gap: 4 }}>
        <Text variant="h4">{label}</Text>
        {hint ? <Text variant="caption" color="tertiary">{hint}</Text> : null}
      </View>
      <View style={{ gap: spacing[2] }}>{children}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container:       { flex: 1 },
  flex:            { flex: 1 },
  header:          {
    paddingBottom: 0,
  },
  backBtn:         { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  content:         { flexGrow: 1 },
  footer:          { borderTopWidth: 0 },
  disclaimer:      { textAlign: 'center', lineHeight: 20 },
  ruleRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleInput:       {},
  addBtn:          { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  suggestionRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reflectionInput: {},
});
