import { Share } from 'react-native';

import { supabase } from './supabase';
import {
  CategoryKey,
  CategoryScore,
  CATEGORY_LABELS,
  fetchDisciplineTrades,
  scoreTrade,
  TradeDisciplineInput,
  TradeScore,
} from './discipline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const DISRUPTIVE_EMOTIONS = new Set(['anxious', 'fearful', 'impulsive']);

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
  no_plan:       'Ignored the plan',
  missed_signal: 'Missed signal',
  broke_rule:    'Broke a rule',
  other:         'Other',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmotionalBreakdownItem {
  emotion: string;
  count: number;
  wins: number;
  losses: number;
}

export interface WeeklyReportData {
  weekStart: string;   // ISO date, e.g. "2026-05-18"
  weekEnd: string;
  overallScore: number;
  previousScore: number | null;
  delta: number | null;
  categoryScores: CategoryScore[];
  tradeCount: number;
  winCount: number;
  lossCount: number;
  topMistakes: Array<{ key: string; label: string; count: number }>;
  emotionalBreakdown: EmotionalBreakdownItem[];
  strongestCategory: CategoryScore;
  weakestCategory: CategoryScore;
  disciplineTrend: 'improving' | 'stable' | 'declining';
  emotionalTrend: 'improving' | 'stable' | 'declining';
}

export interface ReportAISections {
  summary: string;
  strongestTrait: string;
  weakestPattern: string;
  emotionalTrendObservation: string;
  disciplineEvolution: string;
  reflectiveClosing: string;
}

export interface WeeklyReport {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  score: number;
  previousScore: number | null;
  delta: number | null;
  tradeCount: number;
  data: WeeklyReportData;
  sections: ReportAISections;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Week bounds (ISO calendar week: Mon–Sun)
// ---------------------------------------------------------------------------

interface WeekBounds {
  thisWeekStart: Date;
  prevWeekStart: Date;
  startStr: string;
  endStr: string;
}

function getWeekBounds(): WeekBounds {
  const now = new Date();
  const dayOfWeek = now.getDay();                       // 0=Sun … 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - daysFromMonday);
  thisWeekStart.setHours(0, 0, 0, 0);

  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

  const prevWeekStart = new Date(thisWeekStart);
  prevWeekStart.setDate(thisWeekStart.getDate() - 7);

  return {
    thisWeekStart,
    prevWeekStart,
    startStr: thisWeekStart.toISOString().split('T')[0],
    endStr:   thisWeekEnd.toISOString().split('T')[0],
  };
}

// ---------------------------------------------------------------------------
// Pure data-computation helpers
// ---------------------------------------------------------------------------

function avgCategoryScores(scores: TradeScore[]): CategoryScore[] {
  if (!scores.length) return [];
  const keys: CategoryKey[] = [
    'ruleAdherence', 'emotionalControl', 'riskManagement',
    'executionQuality', 'reflectionConsistency',
  ];
  return keys.map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    score: Math.round(
      scores.reduce(
        (sum, s) => sum + (s.categories.find((c) => c.key === key)?.score ?? 0),
        0,
      ) / scores.length,
    ),
  }));
}

function computeEmotionalBreakdown(trades: TradeDisciplineInput[]): EmotionalBreakdownItem[] {
  const map: Record<string, { count: number; wins: number; losses: number }> = {};
  for (const t of trades) {
    if (!t.preEmotion) continue;
    const e = t.preEmotion;
    if (!map[e]) map[e] = { count: 0, wins: 0, losses: 0 };
    map[e].count++;
    if (t.outcome === 'win')  map[e].wins++;
    if (t.outcome === 'loss') map[e].losses++;
  }
  return Object.entries(map)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([emotion, { count, wins, losses }]) => ({ emotion, count, wins, losses }));
}

function computeDisruptiveRate(trades: TradeDisciplineInput[]): number {
  const withEmotion = trades.filter((t) => t.preEmotion);
  if (!withEmotion.length) return 0;
  return withEmotion.filter((t) => DISRUPTIVE_EMOTIONS.has(t.preEmotion!)).length / withEmotion.length;
}

// ---------------------------------------------------------------------------
// Build report data (fetch + compute — no AI cost)
// ---------------------------------------------------------------------------

export async function buildWeekReportData(userId: string): Promise<WeeklyReportData> {
  const { thisWeekStart, prevWeekStart, startStr, endStr } = getWeekBounds();

  const allTrades = await fetchDisciplineTrades(userId, 120);

  const weekTrades = allTrades.filter(
    (t) => new Date(t.createdAt).getTime() >= thisWeekStart.getTime(),
  );
  const prevWeekTrades = allTrades.filter((t) => {
    const ts = new Date(t.createdAt).getTime();
    return ts >= prevWeekStart.getTime() && ts < thisWeekStart.getTime();
  });

  const weekScores = weekTrades.map(scoreTrade);
  const prevScores = prevWeekTrades.map(scoreTrade);

  const overallScore =
    weekScores.length > 0
      ? Math.round(weekScores.reduce((s, t) => s + t.overall, 0) / weekScores.length)
      : 0;

  const previousScore =
    prevScores.length > 0
      ? Math.round(prevScores.reduce((s, t) => s + t.overall, 0) / prevScores.length)
      : null;

  const delta         = previousScore !== null ? overallScore - previousScore : null;
  const categoryScores = avgCategoryScores(weekScores);
  const sorted         = [...categoryScores].sort((a, b) => b.score - a.score);
  const strongestCategory = sorted[0]                  ?? categoryScores[0];
  const weakestCategory   = sorted[sorted.length - 1] ?? categoryScores[0];

  // Discipline trend
  let disciplineTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (delta !== null) {
    if (delta > 5)  disciplineTrend = 'improving';
    if (delta < -5) disciplineTrend = 'declining';
  }

  // Emotional trend (fewer disruptive entries = improving)
  const thisDisruptive = computeDisruptiveRate(weekTrades);
  const prevDisruptive = computeDisruptiveRate(prevWeekTrades);
  let emotionalTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (prevWeekTrades.length > 0) {
    const emotDelta = thisDisruptive - prevDisruptive;
    if (emotDelta < -0.15) emotionalTrend = 'improving';
    if (emotDelta > 0.15)  emotionalTrend = 'declining';
  }

  // Mistake frequency
  const allMistakes = weekTrades.flatMap((t) => t.mistakes);
  const mistakeFreq: Record<string, number> = {};
  allMistakes.forEach((m) => { mistakeFreq[m] = (mistakeFreq[m] ?? 0) + 1; });
  const topMistakes = Object.entries(mistakeFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => ({ key, label: MISTAKE_LABELS[key] ?? key, count }));

  // Win/loss
  const closedTrades = weekTrades.filter((t) => t.outcome);
  const winCount     = closedTrades.filter((t) => t.outcome === 'win').length;
  const lossCount    = closedTrades.filter((t) => t.outcome === 'loss').length;

  return {
    weekStart:          startStr,
    weekEnd:            endStr,
    overallScore,
    previousScore,
    delta,
    categoryScores,
    tradeCount:         weekTrades.length,
    winCount,
    lossCount,
    topMistakes,
    emotionalBreakdown: computeEmotionalBreakdown(weekTrades),
    strongestCategory,
    weakestCategory,
    disciplineTrend,
    emotionalTrend,
  };
}

// ---------------------------------------------------------------------------
// AI report generation
// ---------------------------------------------------------------------------

function buildReportPrompt(data: WeeklyReportData): string {
  const deltaStr  = data.delta !== null
    ? `${data.delta >= 0 ? '+' : ''}${data.delta} from previous week`
    : 'no prior-week data available';

  const catLines = data.categoryScores
    .map((c) => `  ${c.label}: ${c.score}/100`)
    .join('\n');

  const mistakeLines = data.topMistakes.length > 0
    ? data.topMistakes.map((m) => `  ${m.label} ×${m.count}`).join('\n')
    : '  None recorded this week';

  const emotionLines = data.emotionalBreakdown
    .map((e) => {
      const closed = e.wins + e.losses;
      const winStr = closed > 0 ? ` (${Math.round((e.wins / closed) * 100)}% win rate on closed)` : '';
      return `  ${e.emotion} ×${e.count}${winStr}`;
    })
    .join('\n') || '  No emotional data this week';

  return `Generate a weekly psychology report for a Kario trader.

Focus on: discipline trends, emotional patterns, execution quality, recurring mistakes, behavioral improvements.
Do NOT focus primarily on profit. Tone: calm, insightful, non-judgmental, mentor-like.

TRADER DATA — ${data.weekStart} to ${data.weekEnd}:

Overall discipline score: ${data.overallScore}/100 (${deltaStr})
Trades: ${data.tradeCount} (${data.winCount} wins · ${data.lossCount} losses on closed)
Discipline trend: ${data.disciplineTrend}
Emotional trend: ${data.emotionalTrend}

Category breakdown:
${catLines}

Strongest this week: ${data.strongestCategory.label} (${data.strongestCategory.score}/100)
Most work needed:    ${data.weakestCategory.label} (${data.weakestCategory.score}/100)

Recurring mistakes:
${mistakeLines}

Pre-trade emotional states:
${emotionLines}

Return ONLY valid JSON with exactly these six keys:
{
  "summary": "2-3 sentences: what this week's behavioral data reveals about this trader's process",
  "strongestTrait": "1-2 sentences about what they executed consistently well",
  "weakestPattern": "1-2 sentences about the main behavioral pattern to address — specific, not generic",
  "emotionalTrendObservation": "1-2 sentences about emotional entry state patterns and their relationship to execution quality",
  "disciplineEvolution": "1-2 sentences comparing this week to previous if data exists, otherwise a foundational observation",
  "reflectiveClosing": "A single closing observation or question inviting honest self-reflection. Ends with ? or . Not motivational."
}`;
}

function fallbackSections(data: WeeklyReportData): ReportAISections {
  const { overallScore, strongestCategory, weakestCategory, delta, topMistakes, emotionalBreakdown } = data;

  const summary =
    overallScore >= 80
      ? `This week's discipline process operated at a high level — the data reflects consistent, structured behavior. ${strongestCategory.label} at ${strongestCategory.score} appears to be a genuine strength rather than a recent outlier.`
      : overallScore >= 60
      ? `Overall discipline of ${overallScore} this week reflects a process that is mostly working, with identifiable friction in ${weakestCategory.label.toLowerCase()}. These patterns are worth examining rather than correcting in isolation.`
      : `A score of ${overallScore} points to recurring gaps between intention and execution. ${weakestCategory.label} at ${weakestCategory.score} is where this week's behavioral friction concentrated most visibly.`;

  const strongestTrait =
    `${strongestCategory.label} at ${strongestCategory.score} was the most consistent category this week. This suggests deliberate process in that area — worth identifying exactly what behavior drives it so it can be replicated.`;

  const weakestPattern =
    topMistakes.length > 0
      ? `${weakestCategory.label} at ${weakestCategory.score} was the weakest area — ${topMistakes[0].label.toLowerCase()} appearing ${topMistakes[0].count} time${topMistakes[0].count > 1 ? 's' : ''} was the clearest signal. This pattern often emerges when execution pressure compresses decision time.`
      : `${weakestCategory.label} at ${weakestCategory.score} was the area with most room to improve. Without specific mistake data, the scoring reflects a structural gap in that category rather than a single event.`;

  const topEmotion = emotionalBreakdown[0];
  const emotionalTrendObservation =
    topEmotion
      ? `The most common pre-trade state this week was ${topEmotion.emotion} (${topEmotion.count} entries). Emotional entry state tends to set the conditions for execution — awareness of this pattern is the first step to working with it.`
      : 'Emotional data from this week is limited. Consistent tracking of pre-trade state over time reveals patterns that are invisible trade-by-trade.';

  const disciplineEvolution =
    delta !== null
      ? delta > 5
        ? `Discipline score rose ${delta} points from last week — a meaningful directional shift. Week-over-week improvement of this magnitude usually reflects behavioral changes that are still fragile, so consistency matters more than the number.`
        : delta < -5
        ? `Discipline score dropped ${Math.abs(delta)} points from last week. A single-week decline is rarely alarming, but the category data shows where the shift happened — that's the place to focus attention.`
        : `Discipline score was essentially stable week-over-week (${delta >= 0 ? '+' : ''}${delta}). Stability can reflect either solid consistency or entrenched patterns depending on the underlying behaviors.`
      : 'This appears to be among your first recorded weeks. The baseline you establish now becomes the reference point for everything that follows.';

  const reflectiveClosing =
    topMistakes.length > 0
      ? `When ${topMistakes[0].label.toLowerCase()} happens, what does it feel like in the moment just before the decision is made?`
      : `Looking at this week's process — not the outcomes — what single behavior change would have had the largest impact?`;

  return { summary, strongestTrait, weakestPattern, emotionalTrendObservation, disciplineEvolution, reflectiveClosing };
}

async function generateAISections(data: WeeklyReportData): Promise<ReportAISections> {
  if (!API_KEY) return fallbackSections(data);

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
        max_tokens: 800,
        system:
          'You are Kario — a calm trading psychology mentor. Generate honest, process-focused weekly reports. Never glorify gambling behavior, reckless profitability, or dopamine-heavy habits. Always reinforce consistency, patience, emotional regulation, and process quality. Tone: calm, insightful, non-judgmental.',
        messages: [{ role: 'user', content: buildReportPrompt(data) }],
      }),
    });

    if (!res.ok) return fallbackSections(data);
    const json    = await res.json();
    const text: string = json?.content?.[0]?.text ?? '';
    const parsed  = JSON.parse(text) as ReportAISections;
    if (
      parsed.summary && parsed.strongestTrait && parsed.weakestPattern &&
      parsed.emotionalTrendObservation && parsed.disciplineEvolution && parsed.reflectiveClosing
    ) return parsed;
    return fallbackSections(data);
  } catch {
    return fallbackSections(data);
  }
}

// ---------------------------------------------------------------------------
// Supabase persistence
// ---------------------------------------------------------------------------

function rowToReport(row: any): WeeklyReport {
  return {
    id:            row.id,
    userId:        row.user_id,
    weekStart:     row.week_start,
    weekEnd:       row.week_end,
    score:         row.score,
    previousScore: row.previous_score ?? null,
    delta:         row.delta          ?? null,
    tradeCount:    row.trade_count,
    data:          row.report_data    as WeeklyReportData,
    sections:      row.ai_sections    as ReportAISections,
    createdAt:     row.created_at,
  };
}

export async function saveWeeklyReport(
  userId: string,
  data: WeeklyReportData,
  sections: ReportAISections,
): Promise<WeeklyReport> {
  const { data: row, error } = await supabase
    .from('weekly_reports')
    .upsert(
      {
        user_id:        userId,
        week_start:     data.weekStart,
        week_end:       data.weekEnd,
        score:          data.overallScore,
        previous_score: data.previousScore,
        delta:          data.delta,
        trade_count:    data.tradeCount,
        report_data:    data,
        ai_sections:    sections,
      },
      { onConflict: 'user_id,week_start' },
    )
    .select()
    .single();

  if (error) throw error;
  return rowToReport(row);
}

export async function fetchWeeklyReports(
  userId: string,
  limit = 12,
): Promise<WeeklyReport[]> {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(rowToReport);
}

export async function fetchReportById(id: string): Promise<WeeklyReport | null> {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return rowToReport(data);
}

export async function fetchCurrentWeekReport(userId: string): Promise<WeeklyReport | null> {
  const { startStr } = getWeekBounds();
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', startStr)
    .maybeSingle();

  if (error || !data) return null;
  return rowToReport(data);
}

// ---------------------------------------------------------------------------
// Orchestrator — fetch, compute, generate, save
// ---------------------------------------------------------------------------

export async function buildAndSaveWeeklyReport(userId: string): Promise<WeeklyReport> {
  const data     = await buildWeekReportData(userId);
  if (data.tradeCount === 0) throw new Error('No trades recorded this week to generate a report.');
  const sections = await generateAISections(data);
  return saveWeeklyReport(userId, data, sections);
}

// ---------------------------------------------------------------------------
// Share (native Share sheet — text format)
// ---------------------------------------------------------------------------

export function buildShareText(report: WeeklyReport): string {
  const d = report.data;
  const s = report.sections;
  const deltaStr = report.delta !== null
    ? ` (${report.delta >= 0 ? '+' : ''}${report.delta} from last week)`
    : '';

  const catLines = d.categoryScores
    .map((c) => `${c.label}: ${c.score}/100`)
    .join('\n');

  return [
    `KARIO WEEKLY REPORT — ${d.weekStart} to ${d.weekEnd}`,
    '',
    `DISCIPLINE SCORE: ${report.score}/100${deltaStr}`,
    `TRADES: ${d.tradeCount} this week`,
    '',
    catLines,
    '',
    `STRONGEST: ${d.strongestCategory.label} (${d.strongestCategory.score})`,
    `AREA FOR GROWTH: ${d.weakestCategory.label} (${d.weakestCategory.score})`,
    '',
    s.summary,
    '',
    `"${s.reflectiveClosing}"`,
    '',
    '— Kario Trading Psychology',
  ].join('\n');
}

export async function shareReport(report: WeeklyReport): Promise<void> {
  await Share.share({
    title:   `Kario Weekly Report — ${report.data.weekStart}`,
    message: buildShareText(report),
  });
}
