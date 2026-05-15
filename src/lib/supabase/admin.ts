import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseServiceKey } from "./config";

// Service-role client: enkel server-side (cron, opt-in routes, signup action).
// Omzeilt RLS — nooit naar de client exposen.
export function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
