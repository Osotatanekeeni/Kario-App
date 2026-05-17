import { computeMetrics } from '@/utils';
import { useJournalStore } from '@/store/journal-store';

export function useAnalyticsMetrics(period: 'day' | 'week' | 'month' | 'all' = 'all') {
  const entries = useJournalStore((s) => s.entries.filter((e) => e.status === 'closed'));
  return {
    entries,
    metrics: computeMetrics(entries, period),
    hasTrades: entries.length > 0,
    hasInsights: entries.length >= 3,
  };
}
