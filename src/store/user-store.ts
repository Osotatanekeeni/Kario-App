import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { UserPreferences, UserProfile } from "../types";
import { generateId, todayISO } from "../utils";

export interface PendingOnboardingData {
  yearsTrading: string;
  markets: string[];
  tradingSession: string;
  tradingStyle: string;
  mainChallenge: string;
  dominantEmotion: string;
  recurringMistake: string;
  rules: string[];
  goals: string[];
  traderIdentity: string;
}

interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences;
  hasSeenOnboarding: boolean;
  pendingOnboarding: PendingOnboardingData | null;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  completeOnboarding: () => void;
  setHasSeenOnboarding: (v: boolean) => void;
  setPendingOnboarding: (data: PendingOnboardingData | null) => void;
  reset: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  defaultCurrency: "USD",
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
      hasSeenOnboarding: false,
      pendingOnboarding: null,

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

      setHasSeenOnboarding: (v) => set({ hasSeenOnboarding: v }),

      setPendingOnboarding: (data) => set({ pendingOnboarding: data }),

      reset: () =>
        set({
          profile: null,
          preferences: DEFAULT_PREFERENCES,
          hasSeenOnboarding: false,
          pendingOnboarding: null,
        }),
    }),
    {
      name: "kario-user",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
