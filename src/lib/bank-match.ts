import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { structuredComm } from "@/lib/bank";
import { structuredDigits } from "@/lib/bank-import";
import { factuurBedrag } from "@/lib/factuur-klant";
import { logBewijs } from "@/lib/invordering/bewijslog";

// Inkomende banktransacties koppelen aan onbetaalde facturen (open of
// vervallen: na de laatste herinnering staat een factuur op vervallen) via
// de Belgische gestructureerde mededeling (uniek per factuur). Enkel bij het
// volledige bedrag: een gedeeltelijke betaling blijft open voor nazicht.
// Uitbetalingen van Mollie horen bij geen factuur (die staan al op betaald
// via de webhook): die gaan op 'genegeerd'.
// Gebruikt door de CSV-import (Beheer → Bank) en de Revolut-koppeling.
// Idempotent: enkel status='open' wordt aangeraakt.
export async function koppelBetalingen(): Promise<number> {
  const db = getSupabaseAdmin();
  const [{ data: txs }, { data: invs }] = await Promise.all([
    db
      .from("bank_transactions")
      .select("id, booked_at, amount_cents, counterparty, communication")
      .eq("status", "open")
      .gt("amount_cents", 0)
      .limit(2000),
    db
      .from("invoices")
      // "*": ogm (0051), ticket_id/vat_reverse (0049) voor het bedrag.
      .select("*")
      .in("status", ["open", "vervallen"])
      .limit(2000),
  ]);

  type BankInv = {
    id: string;
    number: string;
    client_email?: string | null;
    ogm?: string | null;
    amount_cents: number;
    offer_id?: string | null;
    ticket_id?: string | null;
    vat_reverse?: boolean | null;
  };
  const opCode = new Map<string, BankInv>();
  for (const i of (invs as BankInv[] | null) ?? []) {
    const code = structuredDigits(structuredComm(i.number, i.ogm));
    if (code) opCode.set(code, i);
  }
  let gekoppeld = 0;
  type Tx = { id: string; booked_at: string; amount_cents: number; counterparty: string | null; communication: string | null };
  for (const t of (txs as Tx[] | null) ?? []) {
    const code = structuredDigits(t.communication);
    if (!code) {
      if (/\bmollie\b/i.test(`${t.counterparty ?? ""} ${t.communication ?? ""}`)) {
        await db.from("bank_transactions").update({ status: "genegeerd" }).eq("id", t.id);
      }
      continue;
    }
    const inv = opCode.get(code);
    if (!inv) continue;
    const teBetalen = (await factuurBedrag(inv))?.totaalCent;
    if (teBetalen == null || t.amount_cents < teBetalen) continue;
    await db.from("bank_transactions").update({ matched_invoice_id: inv.id, status: "gematcht" }).eq("id", t.id);
    // Betaaldatum = de dag dat het geld binnenkwam (niet de dag van inlezen).
    await db
      .from("invoices")
      .update({ status: "betaald", paid_at: t.booked_at || new Date().toISOString() })
      .eq("id", inv.id);
    await logBewijs({
      soort: "betaling",
      invoice_id: inv.id,
      client_email: inv.client_email ?? null,
      details: { via: "bank", transactie: t.id, bedrag_cent: t.amount_cents, op: t.booked_at, van: t.counterparty },
    });
    opCode.delete(code);
    gekoppeld++;
  }
  return gekoppeld;
}

// Wanneer werden de bankbewegingen laatst ingelezen (afschrift of Revolut)?
// Het deurwaardersdossier vertrekt pas na een recente inlezing: wie per
// overschrijving betaalde, wordt pas dan herkend.
const LAATSTE = "bank_laatste_inlezing";

export async function markeerInlezing(): Promise<void> {
  await getSupabaseAdmin()
    .from("app_settings")
    .upsert({ key: LAATSTE, value: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "key" });
}

export async function laatsteInlezing(): Promise<string | null> {
  const { data } = await getSupabaseAdmin().from("app_settings").select("value").eq("key", LAATSTE).maybeSingle();
  return (data as { value: string | null } | null)?.value ?? null;
}
