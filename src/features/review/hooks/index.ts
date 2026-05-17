import { useJournalStore } from '@/store/journal-store';

export function useRecentEntriesForReview(limit = 5) {
  return useJournalStore((s) => s.entries.slice(0, limit));
}
