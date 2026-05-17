import { useUserStore } from '@/store/user-store';

export function useProfile() {
  return useUserStore((s) => s.profile);
}

export function usePreferences() {
  return useUserStore((s) => s.preferences);
}
