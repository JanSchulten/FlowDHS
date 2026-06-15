// Supabase connection.
//
// The publishable key is *designed* to live in the browser bundle — your data
// is protected by Postgres Row-Level-Security, not by hiding this key.
export const SUPABASE_KEY = 'sb_publishable_lBgLdRFOzpqrqNfaG94q_w_pO9m-kQ0';

// Project URL. A runtime override (localStorage) is still supported via the
// setup field in Einstellungen → Konto, but the real project is wired in here.
const DEFAULT_URL = 'https://ewsetrdndiodlnffzkqy.supabase.co';
const URL_KEY = 'ff_supabase_url';

export function getSupabaseUrl(): string {
  try {
    const v = localStorage.getItem(URL_KEY);
    if (v && /^https?:\/\//.test(v)) return v.replace(/\/+$/, '');
  } catch {}
  return DEFAULT_URL;
}

export function setSupabaseUrl(url: string): void {
  try { localStorage.setItem(URL_KEY, url.trim().replace(/\/+$/, '')); } catch {}
}

export function isSupabaseConfigured(): boolean {
  return /^https:\/\/[a-z0-9]+\.supabase\.co/.test(getSupabaseUrl());
}
