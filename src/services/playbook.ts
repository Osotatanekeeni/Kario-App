import { supabase } from './supabase';
import { uploadScreenshot } from './storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RuleCategory = 'entry' | 'exit' | 'risk' | 'psychology' | 'process';

export const RULE_CATEGORY_LABELS: Record<RuleCategory, string> = {
  entry:      'Entry',
  exit:       'Exit',
  risk:       'Risk',
  psychology: 'Psychology',
  process:    'Process',
};

export const RULE_CATEGORIES: RuleCategory[] = ['entry', 'exit', 'risk', 'psychology', 'process'];

export interface PlaybookRule {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: RuleCategory;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface TradingSetup {
  id: string;
  userId: string;
  name: string;
  screenshotUrl: string | null;
  entryCriteria: string | null;
  invalidationRules: string | null;
  confirmationRequirements: string | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface BehavioralPrinciple {
  id: string;
  userId: string;
  text: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToRule(row: any): PlaybookRule {
  return {
    id:          row.id,
    userId:      row.user_id,
    title:       row.title,
    description: row.description   ?? null,
    category:    row.category      as RuleCategory,
    isActive:    row.is_active,
    sortOrder:   row.sort_order,
    createdAt:   row.created_at,
  };
}

function rowToSetup(row: any): TradingSetup {
  return {
    id:                       row.id,
    userId:                   row.user_id,
    name:                     row.name,
    screenshotUrl:            row.screenshot_url            ?? null,
    entryCriteria:            row.entry_criteria            ?? null,
    invalidationRules:        row.invalidation_rules        ?? null,
    confirmationRequirements: row.confirmation_requirements ?? null,
    notes:                    row.notes                     ?? null,
    sortOrder:                row.sort_order,
    createdAt:                row.created_at,
  };
}

function rowToPrinciple(row: any): BehavioralPrinciple {
  return {
    id:        row.id,
    userId:    row.user_id,
    text:      row.text,
    sortOrder: row.sort_order,
    isActive:  row.is_active,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Rules CRUD
// ---------------------------------------------------------------------------

export async function fetchRules(userId: string): Promise<PlaybookRule[]> {
  const { data, error } = await supabase
    .from('user_rules')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToRule);
}

export async function saveRule(
  userId: string,
  fields: { title: string; description: string | null; category: RuleCategory },
): Promise<PlaybookRule> {
  // Next sort_order
  const { count } = await supabase
    .from('user_rules')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data, error } = await supabase
    .from('user_rules')
    .insert({
      user_id:     userId,
      title:       fields.title.trim(),
      description: fields.description?.trim() || null,
      category:    fields.category,
      is_active:   true,
      sort_order:  count ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToRule(data);
}

export async function updateRule(
  id: string,
  fields: { title: string; description: string | null; category: RuleCategory; isActive: boolean },
): Promise<PlaybookRule> {
  const { data, error } = await supabase
    .from('user_rules')
    .update({
      title:       fields.title.trim(),
      description: fields.description?.trim() || null,
      category:    fields.category,
      is_active:   fields.isActive,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return rowToRule(data);
}

export async function deleteRule(id: string): Promise<void> {
  const { error } = await supabase.from('user_rules').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Setups CRUD
// ---------------------------------------------------------------------------

export async function fetchSetups(userId: string): Promise<TradingSetup[]> {
  const { data, error } = await supabase
    .from('trade_setups')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToSetup);
}

export async function saveSetup(
  userId: string,
  fields: {
    name: string;
    localScreenshotUri: string | null;
    entryCriteria: string | null;
    invalidationRules: string | null;
    confirmationRequirements: string | null;
    notes: string | null;
  },
): Promise<TradingSetup> {
  const { count } = await supabase
    .from('trade_setups')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  let screenshotUrl: string | null = null;
  if (fields.localScreenshotUri) {
    try {
      screenshotUrl = await uploadScreenshot(fields.localScreenshotUri, userId);
    } catch {
      // Screenshot upload failed — proceed without it
    }
  }

  const { data, error } = await supabase
    .from('trade_setups')
    .insert({
      user_id:                   userId,
      name:                      fields.name.trim(),
      screenshot_url:            screenshotUrl,
      entry_criteria:            fields.entryCriteria?.trim()            || null,
      invalidation_rules:        fields.invalidationRules?.trim()        || null,
      confirmation_requirements: fields.confirmationRequirements?.trim() || null,
      notes:                     fields.notes?.trim()                    || null,
      sort_order:                count ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToSetup(data);
}

export async function updateSetup(
  userId: string,
  id: string,
  fields: {
    name: string;
    localScreenshotUri: string | null;
    existingScreenshotUrl: string | null;
    entryCriteria: string | null;
    invalidationRules: string | null;
    confirmationRequirements: string | null;
    notes: string | null;
  },
): Promise<TradingSetup> {
  let screenshotUrl = fields.existingScreenshotUrl;
  if (fields.localScreenshotUri) {
    try {
      screenshotUrl = await uploadScreenshot(fields.localScreenshotUri, userId);
    } catch {
      // Keep existing URL on upload failure
    }
  }

  const { data, error } = await supabase
    .from('trade_setups')
    .update({
      name:                      fields.name.trim(),
      screenshot_url:            screenshotUrl,
      entry_criteria:            fields.entryCriteria?.trim()            || null,
      invalidation_rules:        fields.invalidationRules?.trim()        || null,
      confirmation_requirements: fields.confirmationRequirements?.trim() || null,
      notes:                     fields.notes?.trim()                    || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return rowToSetup(data);
}

export async function deleteSetup(id: string): Promise<void> {
  const { error } = await supabase.from('trade_setups').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Principles CRUD
// ---------------------------------------------------------------------------

export async function fetchPrinciples(userId: string): Promise<BehavioralPrinciple[]> {
  const { data, error } = await supabase
    .from('behavioral_principles')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToPrinciple);
}

export async function savePrinciple(
  userId: string,
  text: string,
): Promise<BehavioralPrinciple> {
  const { count } = await supabase
    .from('behavioral_principles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data, error } = await supabase
    .from('behavioral_principles')
    .insert({
      user_id:    userId,
      text:       text.trim(),
      sort_order: count ?? 0,
      is_active:  true,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToPrinciple(data);
}

export async function updatePrinciple(
  id: string,
  fields: { text: string; isActive: boolean },
): Promise<BehavioralPrinciple> {
  const { data, error } = await supabase
    .from('behavioral_principles')
    .update({ text: fields.text.trim(), is_active: fields.isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return rowToPrinciple(data);
}

export async function deletePrinciple(id: string): Promise<void> {
  const { error } = await supabase.from('behavioral_principles').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Daily principle helper (deterministic rotation by day)
// ---------------------------------------------------------------------------

export function pickDailyPrinciple(
  principles: BehavioralPrinciple[],
): BehavioralPrinciple | null {
  const active = principles.filter((p) => p.isActive);
  if (!active.length) return null;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return active[dayOfYear % active.length];
}
