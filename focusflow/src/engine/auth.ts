import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AppUser } from '../types';

export function mapUser(u: User | null | undefined): AppUser | null {
  if (!u) return null;
  const m = (u.user_metadata ?? {}) as Record<string, string>;
  return {
    id: u.id,
    email: u.email ?? '',
    name: m.full_name ?? m.name ?? u.email ?? 'Konto',
    avatar: m.avatar_url ?? m.picture ?? '',
  };
}

export async function signInEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Returns needsConfirm=true when Supabase requires e-mail confirmation first. */
export async function signUpEmail(email: string, password: string): Promise<{ needsConfirm: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { needsConfirm: !data.session };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
