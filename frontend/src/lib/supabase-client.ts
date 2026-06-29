import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

/**
 * Lazily-initialised Supabase browser client. We expose a function rather
 * than a top-level constant so that the build never inlines a missing key
 * (it would fail with `createClient is undefined`).
 */
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (_client) return _client;
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, // we use our own JWTs
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return _client;
}
