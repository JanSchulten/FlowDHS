import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { GOOGLE_SCOPES } from '../config';
import type { AppUser } from '../types';

// The Google access token (provider_token) needed for the Calendar API. Supabase
// hands it over once, right after the OAuth round-trip, and does not persist it —
// so we stash it ourselves for the rest of the session.
const TOKEN_KEY = 'ff_google_token';

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

export async function signInGoogle(): Promise<void> {
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: GOOGLE_SCOPES,
      redirectTo,
      // access_type=offline + consent makes Google return a usable token even
      // on repeat logins.
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error) throw error;
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
  clearGoogleToken();
  await supabase.auth.signOut();
}

export function saveGoogleToken(token: string | null | undefined): void {
  if (!token) return;
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function getGoogleToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function clearGoogleToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}
