import "server-only";
// Wie dient er een dossier in via het klantenportaal?
//
// Het e-mailadres komt ALTIJD uit de sessie (auth.getUser()), nooit uit een
// formulier. Naam, bedrijf, telefoon en btw komen uit het accountprofiel
// (user_metadata); wat daar ontbreekt, vullen we aan uit de laatste
// aanvragen van dezelfde klant (tabel quotes, enkel via de service-role).
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";

export type AanvraagProfiel = {
  email: string;
  naam: string | null;
  bedrijf: string | null;
  telefoon: string | null;
  btw: string | null;
};

/**
 * Sleutels in user_metadata, zoals ensurePortalUser() ze bewaart — en
 * tegelijk de kolomnamen in quotes.
 */
export const PROFIEL_META = {
  naam: "name",
  bedrijf: "company",
  telefoon: "phone",
  btw: "vat_number",
} as const;

export type ProfielVeld = keyof typeof PROFIEL_META;
export const PROFIEL_VELDEN = ["naam", "bedrijf", "telefoon", "btw"] as const satisfies readonly ProfielVeld[];

export function profielTekst(x: unknown): string | null {
  return typeof x === "string" && x.trim() ? x.trim().slice(0, 200) : null;
}

export async function aanvraagProfiel(
  user: Pick<User, "email" | "user_metadata">,
): Promise<AanvraagProfiel | null> {
  const email = (user.email ?? "").trim().toLowerCase();
  if (!email) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const p: AanvraagProfiel = {
    email,
    naam: profielTekst(meta[PROFIEL_META.naam]),
    bedrijf: profielTekst(meta[PROFIEL_META.bedrijf]),
    telefoon: profielTekst(meta[PROFIEL_META.telefoon]),
    btw: profielTekst(meta[PROFIEL_META.btw]),
  };
  // Een lege tekst op het account heeft de klant zelf zo gezet (bv. een
  // btw-nummer gewist via "Wijzigen"): dan niet terugvallen op oude aanvragen.
  const aanvullen = PROFIEL_VELDEN.filter((v) => !p[v] && typeof meta[PROFIEL_META[v]] !== "string");
  if (aanvullen.length === 0 || !monitorConfigured) return p;

  try {
    // quotes heeft RLS zonder policies: enkel de service-role leest mee,
    // strikt gefilterd op het adres uit de sessie (% en _ letterlijk).
    const patroon = email.replace(/[\\%_]/g, (c) => `\\${c}`);
    const { data } = await getSupabaseAdmin()
      .from("quotes")
      .select("name, company, phone, vat_number")
      .ilike("email", patroon)
      .order("created_at", { ascending: false })
      .limit(5);
    const rijen = (data as Record<string, unknown>[] | null) ?? [];
    for (const q of rijen) {
      for (const v of aanvullen) p[v] ??= profielTekst(q[PROFIEL_META[v]]);
    }
  } catch {
    // Terugval is optioneel: het formulier vraagt dan zelf wat ontbreekt.
  }
  return p;
}
