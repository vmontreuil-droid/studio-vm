import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";

export const nowConfigured = monitorConfigured;

export type NowLocale = {
  work: string[];
  ideas: string[];
  bandwidth: string;
};
export type NowContent = Record<Locale, NowLocale>;
export type NowRow = {
  id: string;
  updated_on: string;
  content: NowContent;
};

export type NowOverride = {
  updated?: string;
  work?: string[];
  ideas?: string[];
  bandwidth?: string;
};

async function fetchRow(): Promise<NowRow | null> {
  if (!nowConfigured) return null;
  const { data } = await getSupabaseAdmin()
    .from("now_page")
    .select("id, updated_on, content")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as NowRow | null) ?? null;
}

// Voor de publieke /now: overrides per taal, of null (→ statische tekst).
export async function dbNow(locale: Locale): Promise<NowOverride | null> {
  const row = await fetchRow();
  if (!row) return null;
  const c = row.content?.[locale];
  return {
    updated: row.updated_on,
    work: c?.work?.filter(Boolean),
    ideas: c?.ideas?.filter(Boolean),
    bandwidth: c?.bandwidth || undefined,
  };
}

// Voor de admin: de volledige rij (of null).
export async function dbNowRow(): Promise<NowRow | null> {
  return fetchRow();
}
