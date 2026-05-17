import { supabase } from './supabase';
import { uploadScreenshots } from './storage';
import { generateDebrief, AiDebrief, DebriefInput } from './ai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TradeFormData {
  pair: string;
  direction: 'long' | 'short';
  entryPrice: string;
  exitPrice: string;
  rrRatio: string;
  session: string;
  setupType: string;
  localScreenshots: string[];
  notes: string;
  preEmotion: string;
  preIntensity: number;
  postEmotion: string;
  postIntensity: number;
  mistakes: string[];
  reflection: string;
}

export interface SaveTradeResult {
  id: string;
  debrief: AiDebrief;
}

export interface TradeSummary {
  id: string;
  pair: string;
  direction: 'long' | 'short';
  outcome: string | null;
  session: string | null;
  preEmotion: string | null;
  postEmotion: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mistake display label → DB enum
// ---------------------------------------------------------------------------

const MISTAKE_ENUM: Record<string, string> = {
  'Early entry':      'early_entry',
  'Late entry':       'late_entry',
  'Held too long':    'late_exit',
  'FOMO trade':       'fomo',
  'Moved stop loss':  'moved_stop',
  'Overtraded':       'overtrading',
  'Sized too large':  'oversize',
  'Ignored the plan': 'no_plan',
  'Broke a rule':     'broke_rule',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeOutcome(
  direction: 'long' | 'short',
  entry: string,
  exit: string
): 'win' | 'loss' | 'breakeven' | null {
  const e = parseFloat(entry);
  const x = parseFloat(exit);
  if (!exit || isNaN(e) || isNaN(x)) return null;
  if (e === x) return 'breakeven';
  return (direction === 'long' ? x > e : x < e) ? 'win' : 'loss';
}

function parseRR(raw: string): number | null {
  if (!raw.trim()) return null;
  if (raw.includes(':')) {
    const [a, b] = raw.split(':').map(Number);
    if (!isNaN(a) && !isNaN(b) && b !== 0) return parseFloat((b / a).toFixed(4));
    return null;
  }
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// Save trade (5-step flow)
// ---------------------------------------------------------------------------

export async function saveTrade(
  data: TradeFormData,
  userId: string,
  rules: string[]
): Promise<SaveTradeResult> {
  // 1. Upload screenshots
  const screenshotUrls =
    data.localScreenshots.length > 0
      ? await uploadScreenshots(data.localScreenshots, userId)
      : [];

  // 2. Insert trade
  const outcome = computeOutcome(data.direction, data.entryPrice, data.exitPrice);
  const entryNum = parseFloat(data.entryPrice) || null;
  const exitNum  = parseFloat(data.exitPrice)  || null;
  const rrNum    = parseRR(data.rrRatio);

  const { data: trade, error: tradeError } = await supabase
    .from('trades')
    .insert({
      user_id:            userId,
      symbol:             data.pair.trim().toUpperCase(),
      direction:          data.direction,
      entry_price:        entryNum,
      exit_price:         exitNum,
      risk_reward_ratio:  rrNum,
      session:            data.session   || null,
      setup_type:         data.setupType || null,
      screenshot_urls:    screenshotUrls.length > 0 ? screenshotUrls : null,
      notes:              data.notes     || '',
      outcome,
      status:             exitNum ? 'closed' : 'open',
    })
    .select('id')
    .single();
  if (tradeError) throw tradeError;

  const tradeId = trade.id as string;

  // 3. Insert emotions (phase: 'pre' | 'post', label: emotion_label enum)
  const { error: emotionError } = await supabase.from('trade_emotions').insert([
    {
      trade_id:  tradeId,
      user_id:   userId,
      phase:     'pre',
      label:     data.preEmotion.toLowerCase(),
      intensity: data.preIntensity,
    },
    {
      trade_id:  tradeId,
      user_id:   userId,
      phase:     'post',
      label:     data.postEmotion.toLowerCase(),
      intensity: data.postIntensity,
    },
  ]);
  if (emotionError) throw emotionError;

  // 4. Insert mistakes (type: mistake_type enum)
  if (data.mistakes.length > 0) {
    const rows = data.mistakes
      .map((m) => MISTAKE_ENUM[m] ?? 'other')
      .map((type) => ({ trade_id: tradeId, user_id: userId, type }));
    const { error: mistakeError } = await supabase.from('trade_mistakes').insert(rows);
    if (mistakeError) throw mistakeError;
  }

  // 5. Generate AI debrief
  const debriefInput: DebriefInput = {
    pair:          data.pair,
    direction:     data.direction,
    entryPrice:    data.entryPrice,
    exitPrice:     data.exitPrice,
    rrRatio:       data.rrRatio,
    session:       data.session,
    setupType:     data.setupType,
    preEmotion:    data.preEmotion,
    preIntensity:  data.preIntensity,
    postEmotion:   data.postEmotion,
    postIntensity: data.postIntensity,
    mistakes:      data.mistakes,
    reflection:    data.reflection,
    rules,
  };
  const debrief = await generateDebrief(debriefInput);

  // 6. Save reflection + debrief in reflections table
  //    summary    = trader's own reflection text
  //    insights   = AI debrief fields as array
  //    mood       = pre-trade emotion (emotion_label enum)
  //    messages   = full exchange for future reference
  const now = new Date().toISOString();
  const { error: reflectionError } = await supabase.from('reflections').insert({
    user_id:  userId,
    trade_id: tradeId,
    type:     'trade_review',
    mood:     data.preEmotion.toLowerCase(),
    summary:  data.reflection || null,
    insights: [
      `behavioral: ${debrief.behavioral}`,
      `emotional: ${debrief.emotional}`,
      `discipline: ${debrief.discipline}`,
      `question: ${debrief.question}`,
    ],
    messages: [
      { id: tradeId + '-u', role: 'user',      content: data.reflection, timestamp: now },
      { id: tradeId + '-a', role: 'assistant', content: debrief.behavioral, timestamp: now },
    ],
  });
  if (reflectionError) throw reflectionError;

  return { id: tradeId, debrief };
}

// ---------------------------------------------------------------------------
// Fetch trade list
// ---------------------------------------------------------------------------

export async function fetchTrades(userId: string): Promise<TradeSummary[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('id, symbol, direction, outcome, session, created_at, trade_emotions(phase, label)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return (data as any[]).map((row) => {
    const emotions: Array<{ phase: string; label: string }> = row.trade_emotions ?? [];
    const pre  = emotions.find((e) => e.phase === 'pre');
    const post = emotions.find((e) => e.phase === 'post');
    return {
      id:          row.id,
      pair:        row.symbol,
      direction:   row.direction,
      outcome:     row.outcome   ?? null,
      session:     row.session   ?? null,
      preEmotion:  pre?.label    ?? null,
      postEmotion: post?.label   ?? null,
      createdAt:   row.created_at,
    } as TradeSummary;
  });
}

// ---------------------------------------------------------------------------
// Fetch user rules
// ---------------------------------------------------------------------------

export async function fetchUserRules(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_rules')
    .select('title')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => r.title as string);
}
