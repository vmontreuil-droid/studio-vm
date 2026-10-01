import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

// De taal waarin we een klant aanschrijven: die van zijn laatste aanvraag
// (offerteformulier/contact), anders die van een oude scan, anders Nederlands.
export async function klantTaal(email: string): Promise<Locale> {
  const e = email.trim().toLowerCase();
  if (!e) return "nl";
  try {
    const db = getSupabaseAdmin();
    const { data: q } = await db
      .from("quotes")
      .select("locale")
      .ilike("email", e)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const ql = (q as { locale?: string } | null)?.locale;
    if (ql && isValidLocale(ql)) return ql;
    const { data: s } = await db
      .from("scan_requests")
      .select("locale")
      .ilike("email", e)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sl = (s as { locale?: string } | null)?.locale;
    if (sl && isValidLocale(sl)) return sl;
  } catch {
    // val terug op Nederlands
  }
  return "nl";
}
