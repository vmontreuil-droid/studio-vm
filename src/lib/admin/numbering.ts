import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getCompanySettings } from "@/lib/admin/settings";

// Centrale documentnummering (Billit-stijl): doorlopende teller per
// type, opgeslagen in company_settings, formaat PREFIX + jaar - NNNN
// (bv. F2026-0007, CN2026-0002). Eén admin, lage volumes → een
// read-increment-write volstaat.
type Kind = "invoice" | "credit";

export async function nextDocNumber(kind: Kind): Promise<string> {
  const s = await getCompanySettings();
  const year = new Date().getFullYear();
  const prefix = kind === "invoice" ? s.invoice_prefix : s.credit_prefix;
  const col = kind === "invoice" ? "invoice_counter" : "credit_counter";
  const current = kind === "invoice" ? s.invoice_counter : s.credit_counter;
  const next = current + 1;
  try {
    await getSupabaseAdmin()
      .from("company_settings")
      .update({ [col]: next, updated_at: new Date().toISOString() })
      .eq("id", "default");
  } catch {
    /* teller niet bij te werken → nummer blijft geldig, gewoon
       zonder ophoging; admin kan in Instellingen corrigeren */
  }
  return `${prefix}${year}-${String(next).padStart(4, "0")}`;
}
