import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

// Mistakes that directly violate a trader's rules or strategy plan
const RULE_BREAK = new Set(['broke_rule', 'no_plan', 'fomo', 'revenge_trade']);
// Mistakes that indicate strategy slippage (entry/exit timing)
const STRATEGY_SLIP = new Set([
  'early_entry', 'late_entry', 'early_exit', 'late_exit', 'missed_signal', 'overtrading',
]);
// Mistakes that violate risk management principles
const RISK_VIOLATIONS = new Set(['oversize', 'undersize', 'moved_stop']);
// Mistakes that indicate poor trade execution timing
const EXECUTION_ERRORS = new Set([
  'early_entry', 'late_entry', 'early_exit', 'late_exit', 'missed_signal',
]);
// Mistakes rooted in emotional decision-making
const EMOTIONAL_MISTAKES = new Set(['fomo', 'revenge_trade']);

const DISRUPTIVE_PRE  = new Set(['anxious', 'fearful', 'impulsive']);
const DISRUPTIVE_POST = new Set(['frustrated', 'overwhelmed', 'euphoric']);

const WEIGHTS = {
  ruleAdherence:         0.25,
  emotionalControl:      0.25,
  riskManagement:        0.20,
  executionQuality:      0.20,
  reflectionConsistency: 0.10,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CategoryKey =
  | 'ruleAdherence'
  | 'emotionalControl'
  | 'riskManagement'
  | 'executionQuality'
  | 'reflectionConsistency';

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  ruleAdherence:         'Rule Adherence',
  emotionalControl:      'Emotional Control',
  riskManagement:        'Risk Management',
  executionQuality:      'Execution Quality',
  reflectionConsistency: 'Reflection Consistency',
};

export interface TradeDisciplineInput {
  id: string;
  symbol: string;
  outcome: string | null;
  notes: string | null;
  rrRatio: number | null;
  reflection: string | null;
  preEmotion: string | null;
  preIntensity: number;
  postEmotion: string | null;
  postIntensity: number;
  mistakes: string[];
  createdAt: string;
}

export interface CategoryScore {
  key: CategoryKey;
  label: string;
  score: number; // 0–100
}

export interface TradeScore {
  tradeId: string;
  symbol: string;
  outcome: string | null;
  overall: number; // 0–100
  categories: CategoryScore[];
  createdAt: string;
}

export interface WeeklyDiscipline {
  weekScore: number;
  previousWeekScore: number | null;
  delta: number | null;
  trend: 'improving' | 'declining' | 'stable';
  tradeCount: number;
  strongest: CategoryScore;
  weakest: CategoryScore;
  categoryAverages: CategoryScore[];
  recentTradeScores: TradeScore[];
}

export interface DisciplineInsight {
  summary: string;
  focus: string;
}

// ---------------------------------------------------------------------------
// Per-category scoring — pure functions, 0–100 each
// Philosophy: process quality > short-term outcome
// ---------------------------------------------------------------------------

export function scoreRuleAdherence(mistakes: string[]): number {
  let score = 100;
  for (const m of mistakes) {
    if (RULE_BREAK.has(m)) score -= 25;
    else if (STRATEGY_SLIP.has(m)) score -= 10;
  }
  return Math.max(0, score);
}

export function scoreEmotionalControl(
  preEmotion: string | null,
  preIntensity: number,
  postEmotion: string | null,
  postIntensity: number,
  mistakes: string[],
): number {
  let score = 100;
  // Disruptive pre-trade emotion: max –30 at intensity 5
  if (preEmotion && DISRUPTIVE_PRE.has(preEmotion)) score -= preIntensity * 6;
  // Disruptive post-trade emotion: max –20 at intensity 5
  if (postEmotion && DISRUPTIVE_POST.has(postEmotion)) score -= postIntensity * 4;
  // Mistakes rooted in emotional decisions
  for (const m of mistakes) {
    if (EMOTIONAL_MISTAKES.has(m)) score -= 15;
  }
  return Math.max(0, score);
}

export function scoreRiskManagement(mistakes: string[], rrRatio: number | null): number {
  let score = 100;
  for (const m of mistakes) {
    if (RISK_VIOLATIONS.has(m)) score -= 25;
  }
  // Accepted worse than 1:1 risk
  if (rrRatio !== null && rrRatio < 1.0) score -= 20;
  // R:R not logged — incomplete data penalty
  if (rrRatio === null) score -= 5;
  return Math.max(0, score);
}

// Outcome is intentionally excluded — a winning trade can still reflect poor execution.
export function scoreExecutionQuality(mistakes: string[]): number {
  let score = 100;
  for (const m of mistakes) {
    if (EXECUTION_ERRORS.has(m)) score -= 20;
  }
  return Math.max(0, score);
}

export function scoreReflectionConsistency(
  reflection: string | null,
  notes: string | null,
): number {
  let score = 15; // base: trade logged + emotions always captured
  if (reflection && reflection.trim().length > 0) score += 40;
  if (reflection && reflection.trim().length > 100) score += 25; // thoughtful detail
  if (notes && notes.trim().length > 0) score += 20;
  return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// Per-trade overall score
// ---------------------------------------------------------------------------

export function scoreTrade(input: TradeDisciplineInput): TradeScore {
  const ra = scoreRuleAdherence(input.mistakes);
  const ec = scoreEmotionalControl(
    input.preEmotion, input.preIntensity,
    input.postEmotion, input.postIntensity,
    input.mistakes,
  );
  const rm = scoreRiskManagement(input.mistakes, input.rrRatio);
  const eq = scoreExecutionQuality(input.mistakes);
  const rc = scoreReflectionConsistency(input.reflection, input.notes);

  const overall = Math.round(
    ra * WEIGHTS.ruleAdherence +
    ec * WEIGHTS.emotionalControl +
    rm * WEIGHTS.riskManagement +
    eq * WEIGHTS.executionQuality +
    rc * WEIGHTS.reflectionConsistency,
  );

  const categories: CategoryScore[] = [
    { key: 'ruleAdherence',         label: CATEGORY_LABELS.ruleAdherence,         score: ra },
    { key: 'emotionalControl',      label: CATEGORY_LABELS.emotionalControl,      score: ec },
    { key: 'riskManagement',        label: CATEGORY_LABELS.riskManagement,        score: rm },
    { key: 'executionQuality',      label: CATEGORY_LABELS.executionQuality,      score: eq },
    { key: 'reflectionConsistency', label: CATEGORY_LABELS.reflectionConsistency, score: rc },
  ];

  return {
    tradeId:   input.id,
    symbol:    input.symbol,
    outcome:   input.outcome,
    overall,
    categories,
    createdAt: input.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Weekly aggregation
// ---------------------------------------------------------------------------

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function avgScore(scores: TradeScore[]): number {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((s, t) => s + t.overall, 0) / scores.length);
}

function avgCategories(scores: TradeScore[]): CategoryScore[] {
  if (!scores.length) return [];
  const keys: CategoryKey[] = [
    'ruleAdherence', 'emotionalControl', 'riskManagement',
    'executionQuality', 'reflectionConsistency',
  ];
  return keys.map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    score: Math.round(
      scores.reduce((sum, s) => sum + (s.categories.find((c) => c.key === key)?.score ?? 0), 0) /
        scores.length,
    ),
  }));
}

export function computeWeeklyDiscipline(allScores: TradeScore[]): WeeklyDiscipline {
  const now      = Date.now();
  const thisWeek = allScores.filter((s) => now - new Date(s.createdAt).getTime() < WEEK_MS);
  const prevWeek = allScores.filter((s) => {
    const age = now - new Date(s.createdAt).getTime();
    return age >= WEEK_MS && age < 2 * WEEK_MS;
  });

  // Fall back to most-recent trades when there are no trades this calendar week
  const current = thisWeek.length > 0 ? thisWeek : allScores.slice(0, Math.min(10, allScores.length));

  const weekScore     = avgScore(current);
  const prevWeekScore = prevWeek.length > 0 ? avgScore(prevWeek) : null;
  const delta         = prevWeekScore !== null ? weekScore - prevWeekScore : null;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (delta !== null) {
    if (delta > 5)  trend = 'improving';
    if (delta < -5) trend = 'declining';
  }

  const categoryAverages = avgCategories(current);
  const sorted           = [...categoryAverages].sort((a, b) => b.score - a.score);
  const strongest        = sorted[0]                    ?? categoryAverages[0];
  const weakest          = sorted[sorted.length - 1]   ?? categoryAverages[0];

  return {
    weekScore,
    previousWeekScore: prevWeekScore,
    delta,
    trend,
    tradeCount: current.length,
    strongest,
    weakest,
    categoryAverages,
    recentTradeScores: allScores.slice(0, 7),
  };
}

// ---------------------------------------------------------------------------
// AI discipline insight
// ---------------------------------------------------------------------------

function buildInsightPrompt(weekly: WeeklyDiscipline): string {
  const catLines  = weekly.categoryAverages.map((c) => `  ${c.label}: ${c.score}/100`).join('\n');
  const deltaStr  = weekly.delta !== null
    ? `${weekly.delta >= 0 ? '+' : ''}${weekly.delta} from previous week`
    : 'no prior-week comparison available';

  return `Trader discipline score data — ${weekly.tradeCount} trades:

Overall: ${weekly.weekScore}/100 (${deltaStr}) | Trend: ${weekly.trend}
Strongest: ${weekly.strongest.label} (${weekly.strongest.score}/100)
Weakest:   ${weekly.weakest.label} (${weekly.weakest.score}/100)

Category breakdown:
${catLines}

Return ONLY valid JSON with two keys:
- "summary": 2 sentences observing what this score pattern reveals about the trader's process. Do not mention profit, wins, losses, or money.
- "focus": 1 sentence — the single most impactful behavioral change for the weakest category.`;
}

function fallbackInsight(weekly: WeeklyDiscipline): DisciplineInsight {
  const { weekScore, weakest } = weekly;

  const summary =
    weekScore >= 80
      ? `Your process is operating at a high level — ${weakest.label.toLowerCase()} at ${weakest.score} is the one area still leaving points on the table. Scores in this range typically reflect internalized habits, not just rule memory.`
      : weekScore >= 60
      ? `Your overall process is mostly sound at ${weekScore}, but ${weakest.label.toLowerCase()} at ${weakest.score} is where the most preventable patterns tend to cluster. That gap often widens under pressure.`
      : `A score of ${weekScore} signals real friction between knowing what to do and doing it in the moment. ${weakest.label} at ${weakest.score} is where that friction is most concentrated right now.`;

  const focusMap: Record<CategoryKey, string> = {
    ruleAdherence:
      'Before each trade, state your entry criteria explicitly — rule violations most often happen when the rules stay abstract.',
    emotionalControl:
      'Log your emotional state before you open the chart — awareness has to precede the decision, not follow it.',
    riskManagement:
      'Define your position size and stop level before the trade loads, not while it is happening.',
    executionQuality:
      'Set a price alert at your entry criteria level rather than watching the chart — reactive entries are the root of most execution drift.',
    reflectionConsistency:
      'Write at least two sentences of reflection immediately after each trade, not at the end of the session.',
  };

  return { summary, focus: focusMap[weakest.key] };
}

export async function generateDisciplineInsight(
  weekly: WeeklyDiscipline,
): Promise<DisciplineInsight> {
  if (!API_KEY) return fallbackInsight(weekly);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key':         API_KEY,
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 350,
        system:
          'You are Kario — a calm trading psychology mentor. Analyze discipline score data and provide honest, process-focused observations. Never mention profit, wins, or losses. Never be motivational or use hype language. Tone: observant, direct, neutral.',
        messages: [{ role: 'user', content: buildInsightPrompt(weekly) }],
      }),
    });

    if (!res.ok) return fallbackInsight(weekly);
    const json = await res.json();
    const text: string = json?.content?.[0]?.text ?? '';
    const parsed = JSON.parse(text) as DisciplineInsight;
    if (parsed.summary && parsed.focus) return parsed;
    return fallbackInsight(weekly);
  } catch {
    return fallbackInsight(weekly);
  }
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

export async function fetchDisciplineTrades(
  userId: string,
  limit = 60,
): Promise<TradeDisciplineInput[]> {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      id, symbol, outcome, notes, risk_reward_ratio, created_at,
      trade_emotions(phase, label, intensity),
      trade_mistakes(type),
      reflections(summary)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!data) return [];

  return (data as any[]).map((row) => {
    const emotions: Array<{ phase: string; label: string; intensity: number }> =
      row.trade_emotions ?? [];
    const mistakes: Array<{ type: string }>               = row.trade_mistakes  ?? [];
    const reflections: Array<{ summary: string | null }>  = row.reflections     ?? [];

    const pre  = emotions.find((e) => e.phase === 'pre');
    const post = emotions.find((e) => e.phase === 'post');

    return {
      id:            row.id,
      symbol:        row.symbol,
      outcome:       row.outcome              ?? null,
      notes:         row.notes               ?? null,
      rrRatio:       row.risk_reward_ratio    ?? null,
      reflection:    reflections[0]?.summary ?? null,
      preEmotion:    pre?.label              ?? null,
      preIntensity:  pre?.intensity          ?? 3,
      postEmotion:   post?.label             ?? null,
      postIntensity: post?.intensity         ?? 3,
      mistakes:      mistakes.map((m) => m.type),
      createdAt:     row.created_at,
    } as TradeDisciplineInput;
  });
}
