import "server-only";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mollieConfigured } from "@/lib/supabase/config";
import { siteLink } from "@/lib/email";
import type { Locale } from "@/lib/i18n/config";

// Online betalen zonder aanmelden: elke factuur heeft een geheime, publieke
// link (public_token, ook gebruikt voor het factuurdocument). De knop
// "Online betalen" in de mails gaat naar /<taal>/factuur/<token>/betaal, die
// meteen een Mollie-betaling opent in de taal van de klant.

export function nieuwToken(): string {
  return randomBytes(18).toString("base64url");
}

export const TOKEN = /^[A-Za-z0-9_-]{16,64}$/;

/** Token van een factuur; heeft ze er nog geen (oude factuur), dan krijgt ze er nu een. Null bij een fout. */
export async function zorgVoorToken(invoiceId: string, bestaand?: string | null): Promise<string | null> {
  if (bestaand && TOKEN.test(bestaand)) return bestaand;
  const token = nieuwToken();
  const { data, error } = await getSupabaseAdmin()
    .from("invoices")
    .update({ public_token: token })
    .eq("id", invoiceId)
    .is("public_token", null)
    .select("public_token");
  if (error) return null;
  if ((data as unknown[] | null)?.length) return token;
  // Intussen al een token gekregen (gelijktijdige mail): dat teruglezen.
  const { data: rij } = await getSupabaseAdmin().from("invoices").select("public_token").eq("id", invoiceId).maybeSingle();
  return (rij as { public_token?: string | null } | null)?.public_token ?? null;
}

/** Link "Online betalen" voor een mail, of null (Mollie uit of geen token). */
export function betaalLink(taal: string, token: string | null | undefined): string | null {
  if (!mollieConfigured || !token) return null;
  return siteLink(`/${taal}/factuur/${encodeURIComponent(token)}/betaal`);
}

/** Taal van de Mollie-betaalpagina. */
export const MOLLIE_LOCALE: Record<Locale, string> = {
  nl: "nl_BE",
  fr: "fr_BE",
  en: "en_US",
  de: "de_DE",
  es: "es_ES",
};
