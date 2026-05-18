import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/hooks';
import {
  fetchCurrentWeekReport,
  fetchWeeklyReports,
  WeeklyReport,
} from '@/services/weekly-report';

export function useWeeklyReports(limit = 12): {
  reports: WeeklyReport[];
  isLoading: boolean;
} {
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const { data: reports = [], isLoading } = useQuery<WeeklyReport[]>({
    queryKey: ['weekly-reports', userId],
    queryFn:  () => fetchWeeklyReports(userId, limit),
    enabled:  !!userId,
  });

  return { reports, isLoading };
}

export function useCurrentWeekReport(): {
  report: WeeklyReport | null;
  isLoading: boolean;
} {
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const { data: report = null, isLoading } = useQuery<WeeklyReport | null>({
    queryKey: ['weekly-report-current', userId],
    queryFn:  () => fetchCurrentWeekReport(userId),
    enabled:  !!userId,
    staleTime: 5 * 60 * 1000, // re-check every 5 minutes
  });

  return { report, isLoading };
}

export function useInvalidateReports() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  return () => {
    queryClient.invalidateQueries({ queryKey: ['weekly-reports', userId] });
    queryClient.invalidateQueries({ queryKey: ['weekly-report-current', userId] });
  };
}
