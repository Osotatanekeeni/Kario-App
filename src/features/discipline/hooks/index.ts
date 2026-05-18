import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth/hooks';
import {
  computeWeeklyDiscipline,
  fetchDisciplineTrades,
  scoreTrade,
  TradeScore,
  WeeklyDiscipline,
} from '@/services/discipline';

export interface DisciplineData {
  weekly: WeeklyDiscipline;
  scores: TradeScore[];
}

export function useDiscipline(): { data: DisciplineData | null; isLoading: boolean } {
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const { data = null, isLoading } = useQuery<DisciplineData | null>({
    queryKey: ['discipline', userId],
    queryFn:  async () => {
      const trades = await fetchDisciplineTrades(userId, 60);
      const scores = trades.map(scoreTrade);
      if (scores.length === 0) return null;
      return { weekly: computeWeeklyDiscipline(scores), scores };
    },
    enabled: !!userId,
  });

  return { data, isLoading };
}
