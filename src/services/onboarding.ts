import { supabase } from './supabase';

export interface OnboardingPayload {
  // Step 2 — Trading Identity
  years_trading:  string;
  markets:        string[];
  trading_session: string;
  trading_style:  string;

  // Step 3 — Emotional Assessment
  main_challenge:    string;
  dominant_emotion:  string;
  recurring_mistake: string;

  // Step 4 — Rules (written to user_rules table)
  rules: string[];

  // Step 5 — Goals
  goals: string[];

  // Step 6 — Trader Identity
  trader_identity: string;
}

export async function saveOnboarding(payload: OnboardingPayload): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw userError ?? new Error('Not authenticated.');

  // Persist profile fields to users table
  const { error: profileError } = await supabase
    .from('users')
    .update({
      trading_style:        payload.trading_style as any,
      onboarding_completed: true,
    })
    .eq('id', user.id);
  if (profileError) throw profileError;

  // Write trading rules to user_rules table
  if (payload.rules.length > 0) {
    const ruleRows = payload.rules.map((title, i) => ({
      user_id:    user.id,
      title,
      category:   'process' as const,
      is_active:  true,
      sort_order: i,
    }));

    const { error: rulesError } = await supabase
      .from('user_rules')
      .insert(ruleRows);
    if (rulesError) throw rulesError;
  }
}
