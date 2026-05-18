import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useTheme } from '@/hooks/use-theme';
import {
  ChatMessage,
  computePatterns,
  fetchDetailedTrades,
  generateReflection,
  saveReflectionSession,
  sendReflectionMessage,
  TradePatterns,
} from '@/services/reflection';

// ---------------------------------------------------------------------------
// Seed message shown before user sends anything
// ---------------------------------------------------------------------------

const OPENER: ChatMessage = {
  role: 'assistant',
  content:
    "I've reviewed your recent trading data. Ask me anything about your patterns, your emotional tendencies, or a specific trade. I'll reflect it back honestly — not to judge, but to help you see more clearly.",
};

export default function ReflectionSession() {
  const { colors, spacing } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const [patterns, setPatterns] = useState<TradePatterns | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([OPENER]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [saved, setSaved] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef  = useRef<TextInput>(null);

  // Load trade data + generate opening reflection
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const trades = await fetchDetailedTrades(userId, 10);
        const p = computePatterns(trades);
        setPatterns(p);

        if (p.totalTrades >= 2) {
          const result = await generateReflection(p);
          // Replace the generic opener with the actual AI reflection
          setMessages([
            {
              role: 'assistant',
              content: `${result.observation}\n\n${result.insight}\n\n${result.question}`,
            },
          ]);
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, [userId]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !patterns) return;

    setInput('');
    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const reply = await sendReflectionMessage(patterns, messages, text);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    // Persist session on close if there's been a real conversation
    if (!saved && patterns && messages.length > 1 && userId) {
      setSaved(true);
      const initialReflection = {
        observation: messages[0]?.content ?? '',
        question: '',
        insight: '',
      };
      saveReflectionSession(userId, patterns, messages, initialReflection).catch(() => {});
    }
    router.back();
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
            paddingVertical: spacing[3],
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <Pressable onPress={handleClose} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={colors.textTertiary} />
        </Pressable>
        <View style={styles.headerTitle}>
          <MaterialIcons name="psychology" size={18} color={colors.tint} />
          <Text variant="h4" weight="medium">Kario AI</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {initializing ? (
            <View style={[styles.initBlock, { gap: spacing[3] }]}>
              <ActivityIndicator color={colors.tint} />
              <Text variant="body" color="tertiary">Reviewing your recent trades…</Text>
            </View>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))
          )}

          {loading && (
            <View style={[styles.typingRow, { gap: spacing[2] }]}>
              <TypingDots />
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.borderSubtle,
              backgroundColor: colors.background,
              gap: spacing[2],
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 20,
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[2],
                color: colors.text,
                fontSize: 15,
                maxHeight: 100,
              },
            ]}
            placeholder="Ask your mentor…"
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            selectionColor={colors.tint}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!initializing}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || loading || initializing}
            style={[
              styles.sendBtn,
              {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor:
                  input.trim() && !loading && !initializing
                    ? colors.tint
                    : colors.surface,
                borderWidth: 1,
                borderColor:
                  input.trim() && !loading && !initializing
                    ? colors.tint
                    : colors.border,
              },
            ]}
          >
            <MaterialIcons
              name="arrow-upward"
              size={18}
              color={
                input.trim() && !loading && !initializing ? '#0F1115' : colors.textTertiary
              }
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: ChatMessage }) {
  const { colors, spacing, radius } = useTheme();
  const isUser = message.role === 'user';

  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
      {!isUser && (
        <View
          style={[
            styles.aiAvatar,
            {
              backgroundColor: colors.tint + '18',
              borderRadius: 14,
              width: 28,
              height: 28,
              marginTop: 2,
            },
          ]}
        >
          <MaterialIcons name="psychology" size={16} color={colors.tint} />
        </View>
      )}
      <View
        style={[
          styles.bubbleContent,
          {
            backgroundColor: isUser ? colors.tint : colors.surface,
            borderRadius: isUser ? radius.lg : radius.lg,
            borderWidth: isUser ? 0 : StyleSheet.hairlineWidth,
            borderColor: colors.border,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            maxWidth: '85%',
          },
        ]}
      >
        <Text
          variant="body"
          style={{
            color: isUser ? '#0F1115' : colors.text,
            lineHeight: 24,
          }}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingDots() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.typingBubble,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: colors.textTertiary }]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root:    { flex: 1 },
  header:  {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  initBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bubbleUser: {
    justifyContent: 'flex-end',
  },
  bubbleAI: {
    justifyContent: 'flex-start',
  },
  bubbleContent: {},
  aiAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input:   {},
  sendBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
