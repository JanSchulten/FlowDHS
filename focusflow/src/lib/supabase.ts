import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, SUPABASE_KEY } from '../config';

// Single shared client. URL is resolved at load; changing it (setup field)
// triggers a reload so the client picks up the new value.
export const supabase = createClient(getSupabaseUrl(), SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
