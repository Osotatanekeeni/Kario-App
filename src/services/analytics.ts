import { supabase } from './supabase';
import {
  CategoryKey,
  CategoryScore,
  CATEGORY_LABELS,
  scoreTrade,
  TradeDisciplineInput,
  TradeScore,
} from './discipline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MISTAKE_LABELS: Record<string, string> = {
  early_entry:   'Early entry',
  early_exit:    'Early exit',
  late_entry:    'Late entry',
  late_exit:     'Held too long',
  fomo:          'FOMO trade',
  revenge_trade: 'Revenge trade',
  moved_stop:    'Moved stop loss',
  overtrading:   'Overtraded',
  oversize:      'Sized too large',
  undersize:     'Sized too small',
  no_plan:       'No plan',
  missed_signal: 'Missed signal',
  broke_rule:    'Broke a rule',
  other:         'Other',
};

const DISRUPTIVE = new Set(['anxious', 'fearful', 'impulsive', 'frustrated', 'overwhelmed']);

const RULE_BREAKS = new Set(['broke_rule', 'no_plan', 'fomo', 'revenge_trade']);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyticsTrade extends TradeDisciplineInput {
  session: string | null;
  direction: 'long' | 'short';
  disciplineScore: TradeScore;
}

export interface TrendPoint {
  label: string;
  score: number;
  symbol: string;
}

export interface EmotionStat {
  emotion: string;
  count: number;
  pct: number;
  avgDiscipline: number;
  winRate: number | null;
  isDisruptive: boolean;
}

export interface CategoryTrend {
  key: CategoryKey;
  label: string;
  avg: number;
  direction: 'improving' | 'declining' | 'stable';
  recentAvg: number;
  olderAvg: number;
}

export interface SessionStat {
  session: string;
  tradeCount: number;
  avgDiscipline: number;
  topEmotion: string | null;
  isDisruptiveSessions: boolean;
}

export interface MistakeStat {
  key: string;
  label: string;
  count: number;
  pct: number;
  topTrigger: string | null;
  isRuleViolation: boolean;
}

export interface PatternCard {
  text: string;
  type: 'warning' | 'positive' | 'neutral';
}

export interface AnalyticsData {
  trades: AnalyticsTrade[];
  trendPoints: TrendPoint[];
  overallAvg: number;
  categoryAverages: CategoryScore[];
  categoryTrends: CategoryTrend[];
  emotions: EmotionStat[];
  disruptiveRate: number;
  calmAvgDiscipline: number;
  disruptiveAvgDiscipline: number;
  sessions: SessionStat[];
  mistakes: MistakeStat[];
  patterns: PatternCard[];
  consistencyRate: number; // % of trades scoring 70+
}

// ---------------------------------------------------------------------------
// Fetch — extends discipline query with session + direction
// ---------------------------------------------------------------------------

export async function fetchAnalyticsTrades(
  userId: string,
  limit = 90,
): Promise<AnalyticsTrade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      id, symbol, direction, session, outcome, notes, risk_reward_ratio, created_at,
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
    const mistakes: Array<{ type: string }>              = row.trade_mistakes ?? [];
    const reflections: Array<{ summary: string | null }> = row.reflections    ?? [];

    const pre  = emotions.find((e) => e.phase === 'pre');
    const post = emotions.find((e) => e.phase === 'post');

    const base: TradeDisciplineInput = {
      id:            row.id,
      symbol:        row.symbol,
      outcome:       row.outcome           ?? null,
      notes:         row.notes             ?? null,
      rrRatio:       row.risk_reward_ratio  ?? null,
      reflection:    reflections[0]?.summary ?? null,
      preEmotion:    pre?.label            ?? null,
      preIntensity:  pre?.intensity        ?? 3,
      postEmotion:   post?.label           ?? null,
      postIntensity: post?.intensity       ?? 3,
      mistakes:      mistakes.map((m) => m.type),
      createdAt:     row.created_at,
    };

    return {
      ...base,
      session:         row.session  ?? null,
      direction:       (row.direction ?? 'long') as 'long' | 'short',
      disciplineScore: scoreTrade(base),
    } as AnalyticsTrade;
  });
}

// ---------------------------------------------------------------------------
// Pure computation helpers
// ---------------------------------------------------------------------------

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((s, n) => s + n, 0) / arr.length);
}

function catAvg(trades: AnalyticsTrade[], key: CategoryKey): number {
  return avg(trades.map((t) => t.disciplineScore.categories.find((c) => c.key === key)?.score ?? 0));
}

function computeTrendPoints(trades: AnalyticsTrade[]): TrendPoint[] {
  return [...trades]
    .reverse()
    .slice(-30)
    .map((t) => ({
      label:  new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score:  t.disciplineScore.overall,
      symbol: t.symbol,
    }));
}

function computeCategoryAverages(trades: AnalyticsTrade[]): CategoryScore[] {
  const keys: CategoryKey[] = [
    'ruleAdherence', 'emotionalControl', 'riskManagement',
    'executionQuality', 'reflectionConsistency',
  ];
  return keys.map((key) => ({ key, label: CATEGORY_LABELS[key], score: catAvg(trades, key) }));
}

function computeCategoryTrends(trades: AnalyticsTrade[]): CategoryTrend[] {
  const half   = Math.max(1, Math.floor(trades.length / 2));
  const recent = trades.slice(0, half);
  const older  = trades.slice(half);

  const keys: CategoryKey[] = [
    'ruleAdherence', 'emotionalControl', 'riskManagement',
    'executionQuality', 'reflectionConsistency',
  ];
  return keys.map((key) => {
    const recentAvg = catAvg(recent, key);
    const olderAvg  = older.length ? catAvg(older, key) : recentAvg;
    const diff      = recentAvg - olderAvg;
    const direction: CategoryTrend['direction'] =
      diff > 5 ? 'improving' : diff < -5 ? 'declining' : 'stable';
    return {
      key,
      label: CATEGORY_LABELS[key],
      avg:   catAvg(trades, key),
      direction,
      recentAvg,
      olderAvg,
    };
  });
}

function computeEmotions(trades: AnalyticsTrade[]): EmotionStat[] {
  const map: Record<string, { scores: number[]; wins: number; losses: number }> = {};
  for (const t of trades) {
    if (!t.preEmotion) continue;
    const e = t.preEmotion;
    if (!map[e]) map[e] = { scores: [], wins: 0, losses: 0 };
    map[e].scores.push(t.disciplineScore.overall);
    if (t.outcome === 'win')  map[e].wins++;
    if (t.outcome === 'loss') map[e].losses++;
  }
  const total = Math.max(1, trades.filter((t) => t.preEmotion).length);

  return Object.entries(map)
    .sort((a, b) => b[1].scores.length - a[1].scores.length)
    .map(([emotion, { scores, wins, losses }]) => {
      const closed = wins + losses;
      return {
        emotion,
        count:         scores.length,
        pct:           Math.round((scores.length / total) * 100),
        avgDiscipline: avg(scores),
        winRate:       closed > 0 ? Math.round((wins / closed) * 100) : null,
        isDisruptive:  DISRUPTIVE.has(emotion),
      };
    });
}

function computeDisruptiveStats(trades: AnalyticsTrade[]): {
  rate: number;
  calmAvg: number;
  disruptiveAvg: number;
} {
  const withEmotion  = trades.filter((t) => t.preEmotion);
  const calmTrades   = withEmotion.filter((t) => !DISRUPTIVE.has(t.preEmotion!));
  const disrTrades   = withEmotion.filter((t) => DISRUPTIVE.has(t.preEmotion!));

  return {
    rate:          withEmotion.length
      ? Math.round((disrTrades.length / withEmotion.length) * 100)
      : 0,
    calmAvg:       avg(calmTrades.map((t) => t.disciplineScore.overall)),
    disruptiveAvg: avg(disrTrades.map((t) => t.disciplineScore.overall)),
  };
}

function computeSessions(trades: AnalyticsTrade[]): SessionStat[] {
  const map: Record<string, { scores: number[]; emotions: Record<string, number> }> = {};
  for (const t of trades) {
    const s = t.session || 'Unspecified';
    if (!map[s]) map[s] = { scores: [], emotions: {} };
    map[s].scores.push(t.disciplineScore.overall);
    if (t.preEmotion) {
      map[s].emotions[t.preEmotion] = (map[s].emotions[t.preEmotion] ?? 0) + 1;
    }
  }

  return Object.entries(map)
    .filter(([, v]) => v.scores.length > 0)
    .sort((a, b) => b[1].scores.length - a[1].scores.length)
    .map(([session, { scores, emotions }]) => {
      const topEmotion = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        session,
        tradeCount:         scores.length,
        avgDiscipline:      avg(scores),
        topEmotion,
        isDisruptiveSessions: topEmotion ? DISRUPTIVE.has(topEmotion) : false,
      };
    });
}

function computeMistakes(trades: AnalyticsTrade[]): MistakeStat[] {
  const map: Record<string, { count: number; triggers: Record<string, number> }> = {};
  for (const t of trades) {
    for (const m of t.mistakes) {
      if (!map[m]) map[m] = { count: 0, triggers: {} };
      map[m].count++;
      if (t.preEmotion) {
        map[m].triggers[t.preEmotion] = (map[m].triggers[t.preEmotion] ?? 0) + 1;
      }
    }
  }
  const totalTrades = Math.max(1, trades.length);

  return Object.entries(map)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([key, { count, triggers }]) => ({
      key,
      label:          MISTAKE_LABELS[key] ?? key,
      count,
      pct:            Math.round((count / totalTrades) * 100),
      topTrigger:     Object.entries(triggers).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      isRuleViolation: RULE_BREAKS.has(key),
    }));
}

function detectPatterns(trades: AnalyticsTrade[]): PatternCard[] {
  const cards: PatternCard[] = [];
  if (trades.length < 5) return cards;

  // Revenge trades after losses
  let revengeAfterLoss = 0;
  for (let i = 0; i < trades.length - 1; i++) {
    const older = trades[i + 1];
    const newer = trades[i];
    if (older.outcome === 'loss' && newer.mistakes.includes('revenge_trade')) {
      revengeAfterLoss++;
    }
  }
  if (revengeAfterLoss >= 2) {
    cards.push({
      text: `Revenge trades appeared ${revengeAfterLoss} times immediately after a loss. Emotional recovery is happening inside trades rather than between them.`,
      type: 'warning',
    });
  }

  // Calm vs disruptive discipline delta
  const { calmAvg, disruptiveAvg, rate } = computeDisruptiveStats(trades);
  if (calmAvg > 0 && disruptiveAvg > 0) {
    const diff = calmAvg - disruptiveAvg;
    if (diff >= 8) {
      cards.push({
        text: `Discipline is ${diff} pts higher when entering calm vs a disruptive state. Pre-trade emotional awareness is not just theory here — the data supports it.`,
        type: 'positive',
      });
    } else if (diff <= -5) {
      cards.push({
        text: `Discipline score does not drop in disruptive emotional states. Pre-trade awareness may already be moderating the impact of those states on execution.`,
        type: 'neutral',
      });
    }
  }
  if (rate >= 40) {
    cards.push({
      text: `${rate}% of trades are entered in a disruptive emotional state. That frequency means the pattern is structural, not situational.`,
      type: 'warning',
    });
  }

  // Reflection quality correlation
  const withRef    = trades.filter((t) => t.reflection && t.reflection.length > 50);
  const withoutRef = trades.filter((t) => !t.reflection || t.reflection.length <= 50);
  if (withRef.length >= 3 && withoutRef.length >= 3) {
    const diff = avg(withRef.map((t) => t.disciplineScore.overall)) -
                 avg(withoutRef.map((t) => t.disciplineScore.overall));
    if (diff >= 6) {
      cards.push({
        text: `Trades with meaningful reflection notes score ${diff} pts higher on average. The habit of reflection appears to correlate directly with better process quality.`,
        type: 'positive',
      });
    }
  }

  // Session variance
  const sessions = computeSessions(trades).filter((s) => s.session !== 'Unspecified' && s.tradeCount >= 3);
  if (sessions.length >= 2) {
    const best  = sessions.reduce((a, b) => a.avgDiscipline >= b.avgDiscipline ? a : b);
    const worst = sessions.reduce((a, b) => a.avgDiscipline <= b.avgDiscipline ? a : b);
    if (best.avgDiscipline - worst.avgDiscipline >= 10) {
      cards.push({
        text: `${best.session} sessions show the highest discipline (avg ${best.avgDiscipline}). ${worst.session} is ${best.avgDiscipline - worst.avgDiscipline} pts lower — worth examining what differs between these contexts.`,
        type: 'neutral',
      });
    }
  }

  // Recent rule violation cluster
  const recent     = trades.slice(0, Math.min(10, trades.length));
  const ruleBreaks = recent.filter((t) => t.mistakes.some((m) => RULE_BREAKS.has(m))).length;
  if (ruleBreaks >= 3) {
    cards.push({
      text: `${ruleBreaks} of the last ${recent.length} trades involved a rule violation. Clustering like this often signals that the rules need revisiting, not just reinforcing.`,
      type: 'warning',
    });
  }

  return cards.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function computeAnalytics(trades: AnalyticsTrade[]): AnalyticsData {
  const allScores      = trades.map((t) => t.disciplineScore.overall);
  const consistency    = trades.length
    ? Math.round((trades.filter((t) => t.disciplineScore.overall >= 70).length / trades.length) * 100)
    : 0;
  const { rate, calmAvg, disruptiveAvg } = computeDisruptiveStats(trades);

  return {
    trades,
    trendPoints:             computeTrendPoints(trades),
    overallAvg:              avg(allScores),
    categoryAverages:        computeCategoryAverages(trades),
    categoryTrends:          computeCategoryTrends(trades),
    emotions:                computeEmotions(trades),
    disruptiveRate:          rate,
    calmAvgDiscipline:       calmAvg,
    disruptiveAvgDiscipline: disruptiveAvg,
    sessions:                computeSessions(trades),
    mistakes:                computeMistakes(trades),
    patterns:                detectPatterns(trades),
    consistencyRate:         consistency,
  };
}

export async function fetchAndComputeAnalytics(userId: string): Promise<AnalyticsData | null> {
  const trades = await fetchAnalyticsTrades(userId);
  if (!trades.length) return null;
  return computeAnalytics(trades);
}
