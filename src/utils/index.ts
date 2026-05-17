import { EmotionLabel, TradeEntry, DisciplineMetrics } from '@/types';

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDate(iso: string, style: 'short' | 'medium' | 'long' = 'medium'): string {
  const date = new Date(iso);
  if (style === 'short') {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  if (style === 'long') {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso, 'short');
}

export function todayISO(): string {
  return new Date().toISOString();
}

const DISRUPTIVE_EMOTIONS: EmotionLabel[] = [
  'anxious', 'fearful', 'greedy', 'frustrated', 'euphoric', 'impulsive', 'overwhelmed',
];

export function isDisruptiveEmotion(label: EmotionLabel): boolean {
  return DISRUPTIVE_EMOTIONS.includes(label);
}

export function emotionDisplayLabel(label: EmotionLabel): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function computeDisciplineScore(
  entry: Pick<TradeEntry, 'rulesFollowed' | 'rulesBroken' | 'setupQuality' | 'executionQuality'>
): number {
  const totalRules = entry.rulesFollowed.length + entry.rulesBroken.length;
  const ruleScore = totalRules > 0 ? entry.rulesFollowed.length / totalRules : 0.5;
  const setup = (entry.setupQuality ?? 5) / 10;
  const execution = (entry.executionQuality ?? 5) / 10;
  return Math.round((ruleScore * 0.5 + setup * 0.25 + execution * 0.25) * 100);
}

export function computeMetrics(entries: TradeEntry[], period: DisciplineMetrics['period']): DisciplineMetrics {
  if (entries.length === 0) {
    return { overallScore: 0, rulesFollowedRate: 0, emotionalConsistency: 0, entryQuality: 0, exitQuality: 0, totalTrades: 0, period };
  }

  const scores = entries.map((e) => e.disciplineScore ?? 0);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const allFollowed = entries.reduce((a, e) => a + e.rulesFollowed.length, 0);
  const allRules = entries.reduce((a, e) => a + e.rulesFollowed.length + e.rulesBroken.length, 0);
  const rulesFollowedRate = allRules > 0 ? allFollowed / allRules : 0;

  const calmCount = entries.filter((e) => e.emotionBefore && !isDisruptiveEmotion(e.emotionBefore.label)).length;
  const emotionalConsistency = Math.round((calmCount / entries.length) * 100);

  const entryQuality = Math.round(entries.reduce((a, e) => a + (e.setupQuality ?? 5), 0) / entries.length * 10);
  const exitQuality = Math.round(entries.reduce((a, e) => a + (e.executionQuality ?? 5), 0) / entries.length * 10);

  return { overallScore, rulesFollowedRate, emotionalConsistency, entryQuality, exitQuality, totalTrades: entries.length, period };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function scoreColor(score: number): 'positive' | 'negative' | 'warning' | 'neutral' {
  if (score >= 75) return 'positive';
  if (score >= 50) return 'warning';
  if (score >= 25) return 'neutral';
  return 'negative';
}
