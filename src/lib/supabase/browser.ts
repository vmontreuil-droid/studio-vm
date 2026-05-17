"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey } from "./config";

// Browserclient die dezelfde auth-cookies als de SSR-client leest, zodat
// een ingelogde portaalklant rechtstreeks (RLS-afgeschermd) naar Storage
// kan uploaden zonder de bestandsbytes via een server action te sturen.
export function getSupabaseBrowser() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
