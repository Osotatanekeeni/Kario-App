import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { computeDisciplineScore } from '@/lib/utils';
import { TradeEntry } from '@/types';

interface JournalState {
  entries: TradeEntry[];
  addEntry: (entry: TradeEntry) => void;
  updateEntry: (id: string, updates: Partial<TradeEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => TradeEntry | undefined;
  closeEntry: (id: string, updates: Pick<TradeEntry, 'outcome' | 'emotionAfter' | 'executionQuality' | 'rulesFollowed' | 'rulesBroken' | 'lessonsLearned'>) => void;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => ({ entries: [entry, ...state.entries] })),

      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        })),

      deleteEntry: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),

      getEntry: (id) => get().entries.find((e) => e.id === id),

      closeEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) => {
            if (e.id !== id) return e;
            const closed: TradeEntry = {
              ...e,
              ...updates,
              status: 'closed',
              updatedAt: new Date().toISOString(),
            };
            closed.disciplineScore = computeDisciplineScore(closed);
            return closed;
          }),
        })),
    }),
    {
      name: 'kario-journal',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
