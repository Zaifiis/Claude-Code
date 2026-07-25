import { createClient } from '@supabase/supabase-js';

// Browser Supabase client — anon key + public URL only. Used by the
// kitchen dashboard for reads and realtime subscriptions. The service-role
// key never touches the frontend.
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;

export const supabaseConfigured = Boolean(supabase);
