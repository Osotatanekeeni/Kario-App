import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const DISRUPTIVE_EMOTIONS = new Set(['anxious', 'fearful', 'impulsive', 'overwhelmed']);

const MISTAKE_LABELS: Record<string, string> = {
  early_entry:       'Early entry',
  late_entry:        'Late entry',
  late_exit:         'Held too long',
  fomo:              'FOMO trade',
  moved_stop:        'Moved stop loss',
  overtrading:       'Overtraded',
  oversize:          'Sized too large',
  no_plan:           'Ignored the plan',
  broke_rule:        'Broke a rule',
  early_exit:        'Early exit',
  undersize:         'Sized too small',
  missed_signal:     'Missed signal',
  revenge_trade:     'Revenge trade',
  poor_risk_reward:  'Poor risk/reward',
  ignored_bias:      'Ignored bias',
  other:             'Other',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetailedTrade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  outcome: string | null;
  session: string | null;
  createdAt: string;
  preEmotion: string | null;
  postEmotion: string | null;
  mistakes: string[]; // raw enum keys
}

export interface TradePatterns {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number | null;
  dominantPreEmotion: string | null;
  dominantPostEmotion: string | null;
  disruptiveEntryRate: number;
  topMistakes: Array<{ key: string; label: string; count: number }>;
  repeatMistakeFlag: boolean;
  behavioralFlags: string[];
  disciplineTrend: 'improving' | 'stable' | 'declining';
  emotionalTrend: 'improving' | 'stable' | 'declining';
}

export interface ReflectionResult {
  observation: string;
  question: string;
  insight: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

export async function fetchDetailedTrades(
  userId: string,
  limit = 10
): Promise<DetailedTrade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      id, symbol, direction, outcome, session, created_at,
      trade_emotions(phase, label),
      trade_mistakes(type)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!data) return [];

  return (data as any[]).map((row) => {
    const emotions: Array<{ phase: string; label: string }> = row.trade_emotions ?? [];
    const mistakes: Array<{ type: string }>               = row.trade_mistakes  ?? [];
    return {
      id:          row.id,
      symbol:      row.symbol,
      direction:   row.direction,
      outcome:     row.outcome   ?? null,
      session:     row.session   ?? null,
      createdAt:   row.created_at,
      preEmotion:  emotions.find((e) => e.phase === 'pre')?.label  ?? null,
      postEmotion: emotions.find((e) => e.phase === 'post')?.label ?? null,
      mistakes:    mistakes.map((m) => m.type),
    } as DetailedTrade;
  });
}

// ---------------------------------------------------------------------------
// Pattern computation (pure — no API cost)
// ---------------------------------------------------------------------------

function mostFrequent(arr: string[]): string | null {
  if (arr.length === 0) return null;
  const freq: Record<string, number> = {};
  arr.forEach((v) => { freq[v] = (freq[v] ?? 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

export function computePatterns(trades: DetailedTrade[]): TradePatterns {
  if (trades.length === 0) {
    return {
      totalTrades: 0, winCount: 0, lossCount: 0, winRate: null,
      dominantPreEmotion: null, dominantPostEmotion: null,
      disruptiveEntryRate: 0, topMistakes: [], repeatMistakeFlag: false,
      behavioralFlags: [], disciplineTrend: 'stable', emotionalTrend: 'stable',
    };
  }

  // Win/loss
  const closed   = trades.filter((t) => t.outcome);
  const winCount = closed.filter((t) => t.outcome === 'win').length;
  const lossCount = closed.filter((t) => t.outcome === 'loss').length;
  const winRate  = closed.length > 0 ? winCount / closed.length : null;

  // Emotions
  const preEmotions  = trades.map((t) => t.preEmotion).filter(Boolean) as string[];
  const postEmotions = trades.map((t) => t.postEmotion).filter(Boolean) as string[];

  const dominantPreEmotion  = mostFrequent(preEmotions);
  const dominantPostEmotion = mostFrequent(postEmotions);

  const disruptiveCount    = preEmotions.filter((e) => DISRUPTIVE_EMOTIONS.has(e)).length;
  const disruptiveEntryRate = preEmotions.length > 0 ? disruptiveCount / preEmotions.length : 0;

  // Mistakes
  const allMistakes = trades.flatMap((t) => t.mistakes);
  const mistakeFreq: Record<string, number> = {};
  allMistakes.forEach((m) => { mistakeFreq[m] = (mistakeFreq[m] ?? 0) + 1; });
  const topMistakes = Object.entries(mistakeFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => ({ key, label: MISTAKE_LABELS[key] ?? key, count }));

  // Behavioral flags — pre-computed so AI doesn't need to derive them
  const flags: string[] = [];
  if (disruptiveEntryRate >= 0.5)   flags.push('High disruptive emotional entry rate');
  if (disruptiveEntryRate >= 0.3 && disruptiveEntryRate < 0.5)
                                    flags.push('Elevated anxiety/impulsiveness at entry');
  if (mistakeFreq['fomo']          >= 2) flags.push('Recurring FOMO pattern');
  if (mistakeFreq['moved_stop']    >= 2) flags.push('Repeated stop-loss violations');
  if (mistakeFreq['overtrading']   >= 2) flags.push('Overtrading tendency');
  if (mistakeFreq['revenge_trade'] >= 1) flags.push('Revenge trade detected');
  if (allMistakes.length === 0)          flags.push('No mistakes flagged in this sample');
  if (winRate !== null && winRate >= 0.6 && disruptiveEntryRate < 0.2)
                                    flags.push('High win rate correlating with disciplined entries');

  // Trend detection: compare newest half vs older half
  // trades are sorted newest-first, so newer = slice(0, half), older = slice(half)
  const half   = Math.max(1, Math.floor(trades.length / 2));
  const newer  = trades.slice(0, half);
  const older  = trades.slice(half);

  const disruptiveRate = (group: DetailedTrade[]) =>
    group.length > 0
      ? group.filter((t) => t.preEmotion && DISRUPTIVE_EMOTIONS.has(t.preEmotion)).length / group.length
      : 0;

  const newerDisruptive = disruptiveRate(newer);
  const olderDisruptive = disruptiveRate(older);

  let emotionalTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (newerDisruptive < olderDisruptive - 0.15) emotionalTrend = 'improving';
  else if (newerDisruptive > olderDisruptive + 0.15) emotionalTrend = 'declining';

  // Discipline trend: use mistake count as proxy (fewer mistakes = more discipline)
  const mistakesPerTrade = (group: DetailedTrade[]) =>
    group.length > 0 ? group.flatMap((t) => t.mistakes).length / group.length : 0;

  const newerMistakeRate = mistakesPerTrade(newer);
  const olderMistakeRate = mistakesPerTrade(older);

  let disciplineTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (newerMistakeRate < olderMistakeRate - 0.2) disciplineTrend = 'improving';
  else if (newerMistakeRate > olderMistakeRate + 0.2) disciplineTrend = 'declining';

  return {
    totalTrades: trades.length,
    winCount,
    lossCount,
    winRate,
    dominantPreEmotion,
    dominantPostEmotion,
    disruptiveEntryRate,
    topMistakes,
    repeatMistakeFlag: topMistakes.length > 0 && topMistakes[0].count >= 2,
    behavioralFlags: flags,
    disciplineTrend,
    emotionalTrend,
  };
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Kario — a calm trading psychology mentor embedded inside a trading journal app.

Your role is to help traders understand their behavioral patterns and emotional tendencies. You support growth in discipline, emotional awareness, execution quality, and self-reflection.

You are NOT:
- A profit coach or returns advisor
- A motivational speaker or hype-driven voice
- An aggressive accountability bot
- A financial advisor

Tone: calm, observant, neutral, reflective, emotionally intelligent. Think of a seasoned mentor who has seen many traders come and go, and knows that lasting improvement comes from honest self-awareness, not external pressure.

Write in short, direct paragraphs. No bullet points. No hype language ("Great job!", "Keep it up!"). No moralizing. Simply observe, question, and illuminate.`;

function buildContextBlock(patterns: TradePatterns): string {
  const lines: string[] = [];

  lines.push(`Sample: ${patterns.totalTrades} recent trades`);

  if (patterns.winRate !== null) {
    lines.push(
      `Outcomes: ${patterns.winCount} win / ${patterns.lossCount} loss` +
      ` (${Math.round(patterns.winRate * 100)}% win rate on closed trades)`
    );
  }

  if (patterns.dominantPreEmotion) {
    lines.push(
      `Pre-trade emotion: predominantly ${patterns.dominantPreEmotion}` +
      ` — disruptive entry rate: ${Math.round(patterns.disruptiveEntryRate * 100)}%`
    );
  }

  if (patterns.dominantPostEmotion) {
    lines.push(`Post-trade emotion: predominantly ${patterns.dominantPostEmotion}`);
  }

  if (patterns.topMistakes.length > 0) {
    const mistakeStr = patterns.topMistakes
      .map((m) => `${m.label} ×${m.count}`)
      .join(', ');
    lines.push(`Recurring mistakes: ${mistakeStr}`);
  }

  if (patterns.behavioralFlags.length > 0) {
    lines.push(`Behavioral patterns identified: ${patterns.behavioralFlags.join('; ')}`);
  }

  lines.push(
    `Discipline trend: ${patterns.disciplineTrend} | ` +
    `Emotional trend: ${patterns.emotionalTrend}`
  );

  return lines.join('\n');
}

function buildInitialPrompt(patterns: TradePatterns): string {
  return `Here is the trader's recent data — pre-computed, so you do not need to re-derive statistics:

${buildContextBlock(patterns)}

Provide exactly three things:
1. A behavioral observation (2–3 sentences). Describe what this data reveals about the trader's patterns — specific, honest, non-judgmental.
2. A reflective question (one sentence). Sharp, open-ended, designed to invite genuine self-examination.
3. A discipline insight (1–2 sentences). Focus on process and behavior, not outcome.

Return ONLY valid JSON with keys "observation", "question", "insight". No markdown. No extra keys.`;
}

function buildChatSystemPrompt(patterns: TradePatterns): string {
  return `${SYSTEM_PROMPT}

--- TRADER CONTEXT (do not restate this unless the trader asks about it) ---
${buildContextBlock(patterns)}
---

This is an ongoing reflection conversation. Respond to the trader's message directly and naturally. Keep responses short — two to four sentences maximum unless the trader asks for more. Ask one follow-up question if it deepens the reflection.`;
}

// ---------------------------------------------------------------------------
// Fallback responses (when no API key)
// ---------------------------------------------------------------------------

function fallbackReflection(patterns: TradePatterns): ReflectionResult {
  const { dominantPreEmotion, disruptiveEntryRate, topMistakes, disciplineTrend } = patterns;

  const observation =
    dominantPreEmotion
      ? `Your entries have predominantly been taken in a ${dominantPreEmotion} state, with ${Math.round(disruptiveEntryRate * 100)}% of entries flagged as emotionally disruptive. This is worth examining — entry state often predicts execution quality more reliably than setup quality.`
      : `You have ${patterns.totalTrades} trades in this sample. The data is still building — the more you log, the more precise the pattern recognition becomes.`;

  const question =
    topMistakes.length > 0
      ? `When you notice ${topMistakes[0].label.toLowerCase()} happening in real time, what stops you from pausing?`
      : 'When your trade is not going as expected, what does your internal dialogue sound like?';

  const insight =
    disciplineTrend === 'improving'
      ? 'Your recent trades show fewer execution errors compared to earlier ones. That shift is meaningful — it suggests growing awareness in the moment, not just in hindsight.'
      : disciplineTrend === 'declining'
      ? 'Your more recent trades carry more mistakes than your earlier ones. This pattern sometimes emerges from fatigue, external pressure, or accumulated emotional debt from prior sessions.'
      : 'Consistent execution is less about perfection and more about catching yourself earlier in the behavioral chain — before the mistake is already made.';

  return { observation, question, insight };
}

function fallbackChatResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('why') || lower.includes('how')) {
    return "That's worth sitting with. Most behavioral patterns in trading don't have a single cause — they're usually a combination of accumulated stress, identity attachment to being right, and the way uncertainty activates the nervous system. What did your body feel like right before that decision?";
  }
  if (lower.includes('emotion') || lower.includes('feel')) {
    return "Emotional awareness in trading isn't about eliminating feelings — it's about noticing them early enough that they don't make the decision for you. Which emotion tends to arrive first, before a mistake?";
  }
  return "What you're describing is more common than most traders admit. The gap between knowing the rule and following it in the moment is exactly where trading psychology lives. What do you think creates that gap for you specifically?";
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function callClaude(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens = 500
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'x-api-key': API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return (json?.content?.[0]?.text ?? '') as string;
}

export async function generateReflection(patterns: TradePatterns): Promise<ReflectionResult> {
  if (!API_KEY) return fallbackReflection(patterns);

  try {
    const text = await callClaude(
      SYSTEM_PROMPT,
      [{ role: 'user', content: buildInitialPrompt(patterns) }],
      600
    );
    const parsed = JSON.parse(text) as ReflectionResult;
    if (parsed.observation && parsed.question && parsed.insight) return parsed;
    return fallbackReflection(patterns);
  } catch {
    return fallbackReflection(patterns);
  }
}

export async function sendReflectionMessage(
  patterns: TradePatterns,
  history: ChatMessage[],
  message: string
): Promise<string> {
  if (!API_KEY) return fallbackChatResponse(message);

  try {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...history,
      { role: 'user', content: message },
    ];
    return await callClaude(buildChatSystemPrompt(patterns), messages, 400);
  } catch {
    return fallbackChatResponse(message);
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function saveReflectionSession(
  userId: string,
  patterns: TradePatterns,
  messages: ChatMessage[],
  initialReflection: ReflectionResult
): Promise<void> {
  const moodLabel = patterns.dominantPreEmotion ?? 'calm';
  const validEmotions = new Set([
    'calm', 'focused', 'confident', 'patient',
    'anxious', 'fearful', 'greedy', 'frustrated',
    'euphoric', 'impulsive', 'detached', 'overwhelmed',
  ]);
  const mood = validEmotions.has(moodLabel) ? moodLabel : 'calm';

  const insights = [
    `observation: ${initialReflection.observation}`,
    `question: ${initialReflection.question}`,
    `insight: ${initialReflection.insight}`,
  ];

  await supabase.from('reflections').insert({
    user_id:  userId,
    type:     'trade_review',
    mood,
    summary:  initialReflection.observation,
    insights,
    messages: messages.map((m, i) => ({
      id: `${Date.now()}-${i}`,
      role: m.role,
      content: m.content,
      timestamp: new Date().toISOString(),
    })),
  });
}
