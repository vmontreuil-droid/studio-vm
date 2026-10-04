import "server-only";
// Wat de klant voor een factuur betaalt, en in welke taal we hem erover
// mailen. Eén regel voor het portaal (Mollie), de betalingsherinneringen en
// de bevestiging na betaling.
//
// Bij facturen van een 3D-project en bij revisiefacturen (ticket) is
// invoices.amount_cents het bedrag EXCL. btw (gewerkte uren × uurtarief): de
// klant betaalt dat bedrag + 21 % btw (0 % bij btw-verlegging). Oude
// websitefacturen (offerte/abonnement, zonder project of ticket) blijven
// ongemoeid: daar is amount_cents het te betalen bedrag zelf.
// Welke facturen 'uurwerk' zijn, volgt dezelfde regel als de facturenpagina
// van het portaal: ticket_id, een eigen vat_reverse (revisiefactuur waarvan
// het ticket intussen gewist is: ticket_id werd dan null), of een project
// dat rechtstreeks of via zijn offerte aan de factuur hangt.
//
// Werkt met én zonder migratie 0049 (ticket_id en vat_reverse ontbreken dan:
// lees de factuur met select("*")).

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { klantGegevens } from "@/lib/projecten-admin";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

export type KlantFactuur = {
  id: string;
  client_email?: string | null;
  amount_cents: number;
  offer_id?: string | null;
  // Vanaf migratie 0049 (revisiefacturen):
  ticket_id?: string | null;
  vat_reverse?: boolean | null;
};

export type FactuurBedrag = {
  /** Bedrag zoals op de factuur (amount_cents). */
  exclCent: number;
  btwCent: number;
  /** Wat de klant betaalt. */
  totaalCent: number;
  /** false = oude websitefactuur zonder btw-opsplitsing (totaal = amount_cents). */
  metBtw: boolean;
  verlegd: boolean;
  soort: "project" | "revisie" | "andere";
  /** Project van de factuur (rechtstreeks of via de offerte), indien gekend. */
  projectId: string | null;
  quoteId: string | null;
};

/** null bij een databankfout (dan liever niets aanrekenen dan een fout bedrag). */
export async function factuurBedrag(inv: KlantFactuur): Promise<FactuurBedrag | null> {
  const bedrag = inv.amount_cents;
  const db = getSupabaseAdmin();

  const revisie = !!inv.ticket_id || typeof inv.vat_reverse === "boolean";
  let project: { id: string; quote_id: string | null } | null = null;
  if (!revisie) {
    // Project: rechtstreeks gekoppeld (projecten.invoice_id), of via de
    // offerte van het project — zelfde regel als de facturenpagina.
    const viaFactuur = await db
      .from("projecten")
      .select("id, quote_id")
      .eq("invoice_id", inv.id)
      .limit(1);
    if (viaFactuur.error) return null;
    project = (viaFactuur.data?.[0] as { id: string; quote_id: string | null } | undefined) ?? null;
    if (!project && inv.offer_id) {
      const viaOfferte = await db
        .from("projecten")
        .select("id, quote_id")
        .eq("offer_id", inv.offer_id)
        .limit(1);
      if (viaOfferte.error) return null;
      project = (viaOfferte.data?.[0] as { id: string; quote_id: string | null } | undefined) ?? null;
    }
  }
  const metBtw = revisie || !!project;
  if (!metBtw) {
    return { exclCent: bedrag, btwCent: 0, totaalCent: bedrag, metBtw: false, verlegd: false, soort: "andere", projectId: null, quoteId: null };
  }

  let verlegd = false;
  if (typeof inv.vat_reverse === "boolean") {
    verlegd = inv.vat_reverse;
  } else if (inv.offer_id) {
    const { data: off, error } = await db
      .from("offers")
      .select("vat_reverse")
      .eq("id", inv.offer_id)
      .maybeSingle();
    if (error) return null;
    verlegd = !!(off as { vat_reverse?: boolean | null } | null)?.vat_reverse;
  }
  const btw = verlegd ? 0 : Math.round(bedrag * 0.21);
  return {
    exclCent: bedrag,
    btwCent: btw,
    totaalCent: bedrag + btw,
    metBtw: true,
    verlegd,
    soort: revisie ? "revisie" : "project",
    projectId: project?.id ?? null,
    quoteId: project?.quote_id ?? null,
  };
}

/**
 * Taal voor een mail over deze factuur: die van het ticket (revisiefactuur),
 * anders die van de klant (accountprofiel → aanvraag van het project →
 * laatste aanvraag), anders Nederlands. Gooit nooit.
 */
export async function factuurTaal(inv: KlantFactuur, quoteId?: string | null): Promise<Locale> {
  const email = String(inv.client_email ?? "").trim().toLowerCase();
  try {
    if (inv.ticket_id) {
      const { data } = await getSupabaseAdmin()
        .from("tickets")
        .select("locale")
        .eq("id", inv.ticket_id)
        .maybeSingle();
      const l = (data as { locale?: string | null } | null)?.locale;
      if (isValidLocale(l)) return l;
    }
    if (!email) return "nl";
    const taal = (await klantGegevens(email, quoteId ?? null)).taal;
    return isValidLocale(taal) ? taal : "nl";
  } catch {
    return "nl";
  }
}
