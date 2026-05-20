import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/shared/screen-header';
import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import {
  usePlaybookPrinciples,
  usePlaybookRules,
  usePlaybookSetups,
} from '@/features/playbook/hooks';
import { useTheme } from '@/hooks/use-theme';
import {
  BehavioralPrinciple,
  PlaybookRule,
  RULE_CATEGORIES,
  RULE_CATEGORY_LABELS,
  RuleCategory,
  TradingSetup,
} from '@/services/playbook';

// ---------------------------------------------------------------------------
// Section type
// ---------------------------------------------------------------------------

type Section = 'rules' | 'setups' | 'principles';

const SECTION_LABELS: Record<Section, string> = {
  rules:      'Rules',
  setups:     'Setups',
  principles: 'Principles',
};

// ---------------------------------------------------------------------------
// Category accent colors (maps to theme)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PlaybookScreen() {
  const { colors, spacing } = useTheme();
  const [activeSection, setActiveSection] = useState<Section>('rules');

  const { rules,      isLoading: rulesLoading     } = usePlaybookRules();
  const { setups,     isLoading: setupsLoading     } = usePlaybookSetups();
  const { principles, isLoading: principlesLoading } = usePlaybookPrinciples();

  const isLoading = rulesLoading || setupsLoading || principlesLoading;

  const handleAdd = () => {
    if (activeSection === 'rules')      router.push('/modals/playbook-rule');
    if (activeSection === 'setups')     router.push('/modals/playbook-setup');
    if (activeSection === 'principles') router.push('/modals/playbook-principle');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScreenHeader
        title="Playbook"
        subtitle="Your trading manual"
        showDivider
        right={
          <Pressable onPress={handleAdd} hitSlop={8}>
            <MaterialIcons name="add" size={22} color={colors.tint} />
          </Pressable>
        }
      />

      {/* Section tab bar */}
      <SectionTabBar active={activeSection} onPress={setActiveSection} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : (
        <ScrollView
          key={activeSection}
          contentContainerStyle={{ padding: spacing[4], gap: spacing[6], paddingBottom: spacing[8] }}
          showsVerticalScrollIndicator={false}
        >
          {activeSection === 'rules'      && <RulesSection      rules={rules}           onAdd={handleAdd} />}
          {activeSection === 'setups'     && <SetupsSection     setups={setups}         onAdd={handleAdd} />}
          {activeSection === 'principles' && <PrinciplesSection principles={principles} onAdd={handleAdd} />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Section tab bar
// ---------------------------------------------------------------------------

function SectionTabBar({
  active,
  onPress,
}: {
  active: Section;
  onPress: (s: Section) => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={[
        styles.tabBar,
        {
          paddingHorizontal: spacing[4],
          paddingVertical:   spacing[2],
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      {(['rules', 'setups', 'principles'] as Section[]).map((s) => (
        <Pressable
          key={s}
          onPress={() => onPress(s)}
          style={[
            styles.tabItem,
            {
              paddingVertical:  spacing[2],
              paddingHorizontal: spacing[4],
              borderBottomWidth: active === s ? 2 : 0,
              borderBottomColor: colors.tint,
            },
          ]}
        >
          <Text
            variant="body"
            weight={active === s ? 'semibold' : 'regular'}
            style={{ color: active === s ? colors.tint : colors.textTertiary }}
          >
            {SECTION_LABELS[s]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rules section
// ---------------------------------------------------------------------------

function RulesSection({ rules, onAdd }: { rules: PlaybookRule[]; onAdd: () => void }) {
  const { colors, spacing, radius } = useTheme();

  if (rules.length === 0) {
    return (
      <EmptySection
        icon="rule"
        heading="Define your edge"
        body="Rules are the backbone of discipline. They tell you exactly what to do before emotion has a chance to interfere."
        cta="Add First Rule"
        onAdd={onAdd}
      />
    );
  }

  // Group by category, only show categories that have rules
  const grouped = RULE_CATEGORIES.reduce<Record<RuleCategory, PlaybookRule[]>>(
    (acc, cat) => {
      acc[cat] = rules.filter((r) => r.category === cat);
      return acc;
    },
    { entry: [], exit: [], risk: [], psychology: [], process: [] },
  );

  const activeCategories = RULE_CATEGORIES.filter((c) => grouped[c].length > 0);

  return (
    <View style={{ gap: spacing[6] }}>
      {activeCategories.map((cat, ci) => (
        <View key={cat} style={{ gap: spacing[4] }}>
          {ci > 0 && <Divider subtle />}
          <CategoryGroupHeader category={cat} count={grouped[cat].length} />
          {grouped[cat].map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </View>
      ))}
    </View>
  );
}

function CategoryGroupHeader({ category, count }: { category: RuleCategory; count: number }) {
  const { colors, spacing } = useTheme();
  const color = categoryColor(category, colors);
  return (
    <View style={[styles.row, { gap: spacing[2] }]}>
      <View style={[styles.categoryDot, { backgroundColor: color }]} />
      <Text variant="caption" weight="semibold" style={{ color }}>
        {RULE_CATEGORY_LABELS[category].toUpperCase()}
      </Text>
      <Text variant="caption" color="tertiary">· {count}</Text>
    </View>
  );
}

function RuleCard({ rule }: { rule: PlaybookRule }) {
  const { colors, spacing, radius } = useTheme();
  const color = categoryColor(rule.category, colors);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/modals/playbook-rule', params: { id: rule.id } })}
      style={[
        styles.ruleCard,
        {
          backgroundColor: colors.surface,
          borderRadius:    radius.md,
          borderWidth:     StyleSheet.hairlineWidth,
          borderColor:     colors.border,
          borderLeftWidth: 3,
          borderLeftColor: rule.isActive ? color : colors.borderSubtle,
          padding:         spacing[4],
          gap:             spacing[1],
        },
      ]}
    >
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text
          variant="body"
          weight="medium"
          style={{
            flex:  1,
            color: rule.isActive ? colors.text : colors.textTertiary,
          }}
        >
          {rule.title}
        </Text>
        {!rule.isActive && (
          <Text variant="dataSm" color="tertiary" style={{ marginLeft: spacing[2] }}>
            Paused
          </Text>
        )}
      </View>
      {rule.description && (
        <Text variant="bodySm" color="tertiary" style={{ lineHeight: 20 }} numberOfLines={2}>
          {rule.description}
        </Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Setups section
// ---------------------------------------------------------------------------

function SetupsSection({ setups, onAdd }: { setups: TradingSetup[]; onAdd: () => void }) {
  const { spacing } = useTheme();

  if (setups.length === 0) {
    return (
      <EmptySection
        icon="candlestick-chart"
        heading="Document your setups"
        body="A named setup with clear entry criteria and invalidation rules turns intuition into a repeatable process."
        cta="Add First Setup"
        onAdd={onAdd}
      />
    );
  }

  return (
    <View style={{ gap: spacing[4] }}>
      {setups.map((setup) => (
        <SetupCard key={setup.id} setup={setup} />
      ))}
    </View>
  );
}

function SetupCard({ setup }: { setup: TradingSetup }) {
  const { colors, spacing, radius } = useTheme();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/modals/playbook-setup', params: { id: setup.id } })}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius:    radius.lg,
          borderWidth:     StyleSheet.hairlineWidth,
          borderColor:     colors.border,
          overflow:        'hidden',
        },
      ]}
    >
      {/* Screenshot */}
      {setup.screenshotUrl ? (
        <Image
          source={{ uri: setup.screenshotUrl }}
          style={styles.setupThumb}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.setupThumbPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
          <MaterialIcons name="candlestick-chart" size={28} color={colors.borderSubtle} />
        </View>
      )}

      <View style={{ padding: spacing[4], gap: spacing[2] }}>
        <Text variant="h4" weight="semibold">{setup.name}</Text>

        {setup.entryCriteria && (
          <View style={{ gap: 2 }}>
            <Text variant="dataSm" weight="semibold" color="tertiary">ENTRY</Text>
            <Text variant="bodySm" color="secondary" numberOfLines={2} style={{ lineHeight: 20 }}>
              {setup.entryCriteria}
            </Text>
          </View>
        )}

        {setup.invalidationRules && (
          <View style={{ gap: 2 }}>
            <Text variant="dataSm" weight="semibold" style={{ color: colors.negative }}>
              INVALIDATION
            </Text>
            <Text variant="bodySm" color="secondary" numberOfLines={1} style={{ lineHeight: 20 }}>
              {setup.invalidationRules}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Principles section
// ---------------------------------------------------------------------------

function PrinciplesSection({
  principles,
  onAdd,
}: {
  principles: BehavioralPrinciple[];
  onAdd: () => void;
}) {
  const { spacing } = useTheme();

  if (principles.length === 0) {
    return (
      <EmptySection
        icon="format-quote"
        heading="Set your anchors"
        body="Principles are the reminders you need most when things get hard. Write them in your own voice."
        cta="Add First Principle"
        onAdd={onAdd}
        sampleItems={[
          'Patience creates clarity.',
          'One trade does not define the week.',
          'I trade the plan, not the emotion.',
        ]}
      />
    );
  }

  return (
    <View style={{ gap: spacing[4] }}>
      {principles.map((p, i) => (
        <PrincipleCard key={p.id} principle={p} index={i} />
      ))}
    </View>
  );
}

function PrincipleCard({
  principle,
  index,
}: {
  principle: BehavioralPrinciple;
  index: number;
}) {
  const { colors, spacing, radius } = useTheme();

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/modals/playbook-principle', params: { id: principle.id } })
      }
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius:    radius.lg,
          borderWidth:     StyleSheet.hairlineWidth,
          borderColor:     principle.isActive ? colors.border : colors.borderSubtle,
          padding:         spacing[6],
          gap:             spacing[2],
        },
      ]}
    >
      <Text
        variant="bodyLg"
        style={{
          lineHeight:  28,
          fontStyle:   'italic',
          color:       principle.isActive ? colors.text : colors.textTertiary,
        }}
      >
        {`"${principle.text}"`}
      </Text>
      {!principle.isActive && (
        <Text variant="dataSm" color="tertiary">Paused</Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Shared empty state
// ---------------------------------------------------------------------------

function EmptySection({
  icon,
  heading,
  body,
  cta,
  onAdd,
  sampleItems,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  heading: string;
  body: string;
  cta: string;
  onAdd: () => void;
  sampleItems?: string[];
}) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ gap: spacing[6] }}>
      <View
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius:    radius.lg,
            borderWidth:     1,
            borderColor:     colors.tint + '30',
            padding:         spacing[6],
            gap:             spacing[4],
            alignItems:      'center',
          },
        ]}
      >
        <View
          style={[
            styles.emptyIcon,
            { backgroundColor: colors.tint + '18', borderRadius: radius.xl },
          ]}
        >
          <MaterialIcons name={icon} size={28} color={colors.tint} />
        </View>
        <View style={{ alignItems: 'center', gap: spacing[2] }}>
          <Text variant="h4" weight="medium" style={{ textAlign: 'center' }}>{heading}</Text>
          <Text variant="body" color="secondary" style={{ textAlign: 'center', lineHeight: 24 }}>
            {body}
          </Text>
        </View>
        <Pressable
          onPress={onAdd}
          style={[
            styles.row,
            {
              gap:             spacing[2],
              paddingVertical: spacing[2],
              paddingHorizontal: spacing[4],
              borderRadius:    radius.full,
              backgroundColor: colors.tint + '18',
              borderWidth:     1,
              borderColor:     colors.tint + '40',
            },
          ]}
        >
          <MaterialIcons name="add" size={16} color={colors.tint} />
          <Text variant="bodySm" weight="semibold" style={{ color: colors.tint }}>{cta}</Text>
        </Pressable>
      </View>

      {/* Sample items as inspiration */}
      {sampleItems && (
        <View style={{ gap: spacing[2] }}>
          <Text variant="caption" weight="semibold" color="tertiary">EXAMPLES</Text>
          {sampleItems.map((item, i) => (
            <View
              key={i}
              style={[
                {
                  backgroundColor: colors.surface,
                  borderRadius:    radius.md,
                  borderWidth:     StyleSheet.hairlineWidth,
                  borderColor:     colors.borderSubtle,
                  padding:         spacing[4],
                },
              ]}
            >
              <Text variant="bodySm" color="tertiary" style={{ fontStyle: 'italic' }}>
                "{item}"
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root:               { flex: 1 },
  center:             { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row:                { flexDirection: 'row', alignItems: 'center' },
  tabBar:             { flexDirection: 'row' },
  tabItem:            {},
  categoryDot:        { width: 8, height: 8, borderRadius: 4 },
  ruleCard:           {},
  setupThumb:         { width: '100%', height: 140 },
  setupThumbPlaceholder: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon:          { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
});
