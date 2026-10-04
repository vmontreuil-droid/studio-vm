import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Bewijslog: wat er rond een factuur gebeurde, met tijdstip (migratie 0052).
// Loggen mag nooit iets anders breken: zonder tabel of bij een fout wordt
// stil overgeslagen.

export type BewijsSoort =
  | "factuur_verstuurd"
  | "herinnering_verstuurd"
  | "offerte_beslist"
  | "levering_gedownload"
  | "betaling"
  | "invordering";

export type Bewijs = {
  soort: BewijsSoort;
  invoice_id?: string | null;
  offer_id?: string | null;
  project_id?: string | null;
  client_email?: string | null;
  details?: Record<string, unknown>;
};

export async function logBewijs(b: Bewijs): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin()
      .from("bewijslog")
      .insert({
        soort: b.soort,
        invoice_id: b.invoice_id ?? null,
        offer_id: b.offer_id ?? null,
        project_id: b.project_id ?? null,
        client_email: b.client_email?.trim().toLowerCase() ?? null,
        details: b.details ?? {},
      });
    if (error && !/bewijslog|42P01|PGRST205/i.test(`${error.code} ${error.message}`)) {
      console.error("[bewijslog]", error.code, error.message);
    }
  } catch {
    /* nooit iets breken om een logregel */
  }
}

/** Herkomst van een verzoek (IP en browser), voor het bewijs van een klik of download. */
export function herkomst(h: Headers): { ip: string | null; browser: string | null } {
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || null;
  return { ip, browser: h.get("user-agent")?.slice(0, 300) ?? null };
}
