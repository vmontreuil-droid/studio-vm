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

// Korte capaciteit-regel voor naast de CTA's. Eén bron: de /now-
// bandbreedte (eerste zin). Geen DB/leeg → eerlijke statische fallback.
const CAP_FALLBACK: Record<Locale, string> = {
  nl: "Beperkte plekken — kleine opdrachten dit kwartaal mogelijk",
  fr: "Places limitées — petites missions possibles ce trimestre",
  en: "Limited slots — small projects possible this quarter",
};

export async function getCapacity(locale: Locale): Promise<string> {
  const ov = await dbNow(locale);
  const bw = ov?.bandwidth?.trim();
  if (bw) {
    const first = bw.split(/(?<=[.!?])\s/)[0].trim();
    return first.length > 90 ? first.slice(0, 87).trimEnd() + "…" : first;
  }
  return CAP_FALLBACK[locale];
}

// Voor de admin: de volledige rij (of null).
export async function dbNowRow(): Promise<NowRow | null> {
  return fetchRow();
}
