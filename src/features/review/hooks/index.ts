import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth/hooks';
import {
  computePatterns,
  fetchDetailedTrades,
  TradePatterns,
} from '@/services/reflection';

export function useTradePatterns(limit = 10): {
  patterns: TradePatterns;
  isLoading: boolean;
} {
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['detailed-trades', userId],
    queryFn: () => fetchDetailedTrades(userId, limit),
    enabled: !!userId,
  });

  return {
    patterns: computePatterns(trades),
    isLoading,
  };
}
