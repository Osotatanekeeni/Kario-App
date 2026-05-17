import { useJournalStore } from '@/store/journal-store';

export function useJournalEntries() {
  return useJournalStore((s) => s.entries);
}

export function useOpenEntries() {
  return useJournalStore((s) => s.entries.filter((e) => e.status === 'open'));
}

export function useClosedEntries() {
  return useJournalStore((s) => s.entries.filter((e) => e.status === 'closed'));
}
