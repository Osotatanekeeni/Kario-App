import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/hooks';
import {
  BehavioralPrinciple,
  fetchPrinciples,
  fetchRules,
  fetchSetups,
  pickDailyPrinciple,
  PlaybookRule,
  TradingSetup,
} from '@/services/playbook';

export function usePlaybookRules(): { rules: PlaybookRule[]; isLoading: boolean } {
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const { data: rules = [], isLoading } = useQuery<PlaybookRule[]>({
    queryKey: ['playbook-rules', userId],
    queryFn:  () => fetchRules(userId),
    enabled:  !!userId,
  });

  return { rules, isLoading };
}

export function usePlaybookSetups(): { setups: TradingSetup[]; isLoading: boolean } {
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const { data: setups = [], isLoading } = useQuery<TradingSetup[]>({
    queryKey: ['playbook-setups', userId],
    queryFn:  () => fetchSetups(userId),
    enabled:  !!userId,
  });

  return { setups, isLoading };
}

export function usePlaybookPrinciples(): { principles: BehavioralPrinciple[]; isLoading: boolean } {
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const { data: principles = [], isLoading } = useQuery<BehavioralPrinciple[]>({
    queryKey: ['playbook-principles', userId],
    queryFn:  () => fetchPrinciples(userId),
    enabled:  !!userId,
  });

  return { principles, isLoading };
}

export function useDailyPrinciple(): BehavioralPrinciple | null {
  const { principles } = usePlaybookPrinciples();
  return pickDailyPrinciple(principles);
}

export function useInvalidatePlaybook() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  return (section: 'rules' | 'setups' | 'principles' | 'all' = 'all') => {
    if (section === 'rules'      || section === 'all') queryClient.invalidateQueries({ queryKey: ['playbook-rules',      userId] });
    if (section === 'setups'     || section === 'all') queryClient.invalidateQueries({ queryKey: ['playbook-setups',     userId] });
    if (section === 'principles' || section === 'all') queryClient.invalidateQueries({ queryKey: ['playbook-principles', userId] });
  };
}
