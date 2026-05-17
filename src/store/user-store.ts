import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { generateId, todayISO } from '@/utils';
import { UserPreferences, UserProfile } from '@/types';

interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  defaultCurrency: 'USD',
  reminderEnabled: false,
};

const DEFAULT_PROFILE: UserProfile = {
  id: generateId(),
  onboardingCompleted: false,
  createdAt: todayISO(),
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      preferences: DEFAULT_PREFERENCES,

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates }
            : { ...DEFAULT_PROFILE, ...updates },
        })),

      updatePreferences: (updates) =>
        set((state) => ({ preferences: { ...state.preferences, ...updates } })),

      completeOnboarding: () =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, onboardingCompleted: true }
            : { ...DEFAULT_PROFILE, onboardingCompleted: true },
        })),

      reset: () => set({ profile: null, preferences: DEFAULT_PREFERENCES }),
    }),
    {
      name: 'kario-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
