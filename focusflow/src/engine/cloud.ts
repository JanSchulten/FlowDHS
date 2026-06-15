import { supabase } from '../lib/supabase';
import type { Snapshot } from '../store/reducer';

// Whole-app snapshot stored as a single JSONB row per user in `app_state`.
// Simple, robust, and a perfect match for the existing localStorage model.

export async function pullState(userId: string): Promise<Snapshot | null> {
  const { data, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.data as Snapshot) ?? null;
}

export async function pushState(userId: string, snapshot: Snapshot): Promise<void> {
  const { error } = await supabase
    .from('app_state')
    .upsert(
      { user_id: userId, data: snapshot, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) throw new Error(error.message);
}
