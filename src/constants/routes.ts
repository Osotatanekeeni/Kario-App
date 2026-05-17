export const ROUTES = {
  // Auth
  SIGN_IN:     '/(auth)/sign-in',
  SIGN_UP:     '/(auth)/sign-up',

  // Onboarding
  ONBOARDING:  '/(onboarding)',

  // Tabs
  HOME:        '/(tabs)/home',
  JOURNAL:     '/(tabs)/journal',
  REVIEW:      '/(tabs)/review',
  ANALYTICS:   '/(tabs)/analytics',
  PLAYBOOK:    '/(tabs)/playbook',
  PROFILE:     '/(tabs)/profile',

  // Modals
  LOG_TRADE:   '/modals/log-trade',
} as const;
