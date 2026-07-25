import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client. Uses the SERVICE ROLE key, which bypasses
// row-level security — this must NEVER be shipped to the browser. All
// tool handlers go through this client so the 5-minute DB trigger is the
// single source of truth for the edit window.
let _client = null;

export function getSupabase() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env',
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
