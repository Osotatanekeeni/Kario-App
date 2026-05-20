import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth/hooks';
import { AnalyticsData, fetchAndComputeAnalytics } from '@/services/analytics';
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

export function useAnalytics(): { data: AnalyticsData | null; isLoading: boolean } {
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const { data = null, isLoading } = useQuery<AnalyticsData | null>({
    queryKey:  ['analytics', userId],
    queryFn:   () => fetchAndComputeAnalytics(userId),
    enabled:   !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return { data, isLoading };
}
