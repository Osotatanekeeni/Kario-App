import { supabase } from './supabase';
import { TradeEntry } from '@/types';

export async function fetchEntries(userId: string): Promise<TradeEntry[]> {
  const { data, error } = await supabase
    .from('trade_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEntry(entry: TradeEntry & { user_id: string }): Promise<TradeEntry> {
  const { data, error } = await supabase
    .from('trade_entries')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEntry(id: string, updates: Partial<TradeEntry>): Promise<TradeEntry> {
  const { data, error } = await supabase
    .from('trade_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('trade_entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
