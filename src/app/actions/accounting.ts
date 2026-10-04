"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { parseNaceList } from "@/lib/admin/aannemers";
import { logBewijs } from "@/lib/invordering/bewijslog";

// Boekhoud-suite — gedeelde server actions. Groeit mee met de modules.

function str(fd: FormData, k: string): string | null {
  const v = (fd.get(k) as string | null)?.trim();
  return v ? v : null;
}
function int(fd: FormData, k: string, fallback: number): number {
  const n = Number((fd.get(k) as string | null)?.trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function num(fd: FormData, k: string, fallback: number): number {
  const n = Number((fd.get(k) as string | null)?.trim());
  return Number.isFinite(n) ? n : fallback;
}

// Module 1 — bedrijfsinstellingen opslaan.
export async function saveCompanySettings(
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Geen toegang." };
  try {
    const { error } = await getSupabaseAdmin()
      .from("company_settings")
      .upsert(
        {
          id: "default",
          company_name: str(fd, "company_name") || "Studio VM",
          legal_name: str(fd, "legal_name"),
          vat_number: str(fd, "vat_number"),
          address: str(fd, "address"),
          email: str(fd, "email"),
          phone: str(fd, "phone"),
          website: str(fd, "website"),
          iban: str(fd, "iban"),
          bic: str(fd, "bic"),
          bank_holder: str(fd, "bank_holder"),
          payment_terms_days: int(fd, "payment_terms_days", 14),
          default_vat_rate: num(fd, "default_vat_rate", 21),
          invoice_footer: str(fd, "invoice_footer"),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/instellingen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fout." };
  }
}

// useActionState-wrapper (React 19) zodat het formulier feedback toont.
export async function saveCompanySettingsAction(
  _prev: { ok: boolean; error?: string } | null,
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const base = await saveCompanySettings(fd);
  if (!base.ok) return base;
  // Sla in dezelfde call ook de outreach-config op (zelfde rij in
  // company_settings, andere kolommen).
  try {
    const naceRaw = (fd.get("outreach_nace_prefixes") as string | null) ?? "";
    const lands: ("be" | "fr" | "uk")[] = [];
    for (const l of ["be", "fr", "uk"] as const) {
      if (fd.get(`outreach_land_${l}`) != null) lands.push(l);
    }
    const patch = {
      outreach_paused: fd.get("outreach_paused") != null,
      outreach_daily_quota: int(fd, "outreach_daily_quota", 20),
      outreach_cal_link: str(fd, "outreach_cal_link"),
      outreach_sender_name:
        str(fd, "outreach_sender_name") || "Vincent Montreuil",
      outreach_sender_email:
        str(fd, "outreach_sender_email") || "vincent@studio-vm.be",
      outreach_min_score: int(fd, "outreach_min_score", 30),
      outreach_max_score: int(fd, "outreach_max_score", 65),
      // Genormaliseerd zonder punten ("42.11" → "4211"); leeg = standaard-
      // aannemersselectie (zie src/lib/admin/aannemers.ts).
      outreach_nace_prefixes: parseNaceList(naceRaw),
      outreach_lands: lands.length > 0 ? lands : ["be"],
    };
    const { error } = await getSupabaseAdmin()
      .from("company_settings")
      .update(patch)
      .eq("id", "default");
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/instellingen");
    revalidatePath("/admin/outreach");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Outreach-config fout.",
    };
  }
}

// ---------- Module 3a — productcatalogus ----------

function cents(fd: FormData, k: string): number {
  const raw = (fd.get(k) as string | null)?.trim().replace(",", ".") ?? "0";
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export async function saveProduct(
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Geen toegang." };
  const id = str(fd, "id");
  const row = {
    name: str(fd, "name") || "Naamloos",
    description: str(fd, "description"),
    unit_price_cents: cents(fd, "unit_price"),
    vat_rate: num(fd, "vat_rate", 21),
    kind: str(fd, "kind") === "product" ? "product" : "dienst",
    active: fd.get("active") != null,
    sort: int(fd, "sort", 0),
  };
  try {
    const db = getSupabaseAdmin();
    const { error } = id
      ? await db.from("products").update(row).eq("id", id)
      : await db.from("products").insert(row);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/producten");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fout." };
  }
}

export async function deleteProduct(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = str(fd, "id");
  if (!id) return;
  try {
    await getSupabaseAdmin().from("products").delete().eq("id", id);
    revalidatePath("/admin/producten");
  } catch {}
}

export async function toggleProduct(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = str(fd, "id");
  if (!id) return;
  try {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("products")
      .select("active")
      .eq("id", id)
      .maybeSingle();
    await db
      .from("products")
      .update({ active: !(data as { active: boolean } | null)?.active })
      .eq("id", id);
    revalidatePath("/admin/producten");
  } catch {}
}

export async function saveProductAction(
  _prev: { ok: boolean; error?: string } | null,
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  return saveProduct(fd);
}

// ---------- Module 3b — creditnota's ----------

export async function createCreditNote(
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Geen toegang." };
  const email = str(fd, "client_email");
  if (!email) return { ok: false, error: "Klant-e-mail is verplicht." };
  try {
    // Nummer CN-jjjj-nnn: centraal toegekend (doorlopend, zonder gaten).
    const { slaCreditnotaOp } = await import("@/lib/facturatie/opslaan");
    const opgeslagen = await slaCreditnotaOp({
      invoice_id: str(fd, "invoice_id"),
      client_email: email.toLowerCase(),
      amount_cents: cents(fd, "amount"),
      vat_rate: num(fd, "vat_rate", 21),
      reason: str(fd, "reason"),
    });
    if (!opgeslagen.ok) return { ok: false, error: opgeslagen.fout };
    revalidatePath("/admin/creditnotas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fout." };
  }
}

export async function createCreditNoteAction(
  _prev: { ok: boolean; error?: string } | null,
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  return createCreditNote(fd);
}

export async function setCreditNoteStatus(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!id || (status !== "open" && status !== "verwerkt")) return;
  try {
    await getSupabaseAdmin()
      .from("credit_notes")
      .update({ status })
      .eq("id", id);
    revalidatePath("/admin/creditnotas");
    revalidatePath(`/admin/creditnotas/${id}`);
  } catch {}
}

// ---------- Module 4 — aankoop & leveranciers ----------

export async function saveSupplier(
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Geen toegang." };
  const id = str(fd, "id");
  const row = {
    name: str(fd, "name") || "Naamloos",
    vat_number: str(fd, "vat_number"),
    email: str(fd, "email"),
    iban: str(fd, "iban"),
    notes: str(fd, "notes"),
  };
  try {
    const db = getSupabaseAdmin();
    const { error } = id
      ? await db.from("suppliers").update(row).eq("id", id)
      : await db.from("suppliers").insert(row);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/leveranciers");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fout." };
  }
}

export async function saveSupplierAction(
  _prev: { ok: boolean; error?: string } | null,
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  return saveSupplier(fd);
}

export async function deleteSupplier(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = str(fd, "id");
  if (!id) return;
  try {
    await getSupabaseAdmin().from("suppliers").delete().eq("id", id);
    revalidatePath("/admin/leveranciers");
  } catch {}
}

// Upload het bron-bestand + lees het (optioneel) uit via Mindee.
// Retourneert de prefill-velden zodat de admin ze kan nakijken.
export async function scanPurchase(
  fd: FormData,
): Promise<{
  ok: boolean;
  error?: string;
  fileUrl?: string;
  ocrApplied?: boolean;
  fields?: {
    supplierName: string | null;
    supplierVat: string | null;
    number: string | null;
    invoiceDate: string | null;
    dueDate: string | null;
    net: number | null;
    vat: number | null;
    total: number | null;
    vatRate: number | null;
  };
}> {
  if (!(await requireAdmin())) return { ok: false, error: "Geen toegang." };
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Geen bestand." };
  }
  try {
    const db = getSupabaseAdmin();
    const safe = (file.name || "bon")
      .replace(/[^\w.\-]+/g, "_")
      .slice(-80);
    const path = `${Date.now()}-${safe}`;
    const up = await db.storage
      .from("purchases")
      .upload(path, file, { upsert: false });
    if (up.error) return { ok: false, error: up.error.message };

    const { parseInvoice } = await import("@/lib/mindee");
    const parsed = await parseInvoice(file);
    return {
      ok: true,
      fileUrl: path,
      ocrApplied: !!parsed,
      fields: {
        supplierName: parsed?.supplierName ?? null,
        supplierVat: parsed?.supplierVat ?? null,
        number: parsed?.invoiceNumber ?? null,
        invoiceDate: parsed?.invoiceDate ?? null,
        dueDate: parsed?.dueDate ?? null,
        net: parsed?.netCents ?? null,
        vat: parsed?.vatCents ?? null,
        total: parsed?.totalCents ?? null,
        vatRate: parsed?.vatRate ?? null,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fout." };
  }
}

export async function createPurchaseInvoice(
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Geen toegang." };
  const net = cents(fd, "net");
  const vat = cents(fd, "vat");
  const totalRaw = cents(fd, "total");
  const total = totalRaw || net + vat;
  try {
    const { error } = await getSupabaseAdmin()
      .from("purchase_invoices")
      .insert({
        supplier_name: str(fd, "supplier_name"),
        number: str(fd, "number"),
        net_cents: net,
        vat_cents: vat,
        total_cents: total,
        vat_rate: num(fd, "vat_rate", 21),
        category: str(fd, "category"),
        invoice_date:
          str(fd, "invoice_date") ||
          new Date().toISOString().slice(0, 10),
        due_date: str(fd, "due_date"),
        file_url: str(fd, "file_url"),
      });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/aankoopfacturen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fout." };
  }
}

export async function createPurchaseInvoiceAction(
  _prev: { ok: boolean; error?: string } | null,
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  return createPurchaseInvoice(fd);
}

export async function setPurchaseStatus(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!id || (status !== "open" && status !== "betaald")) return;
  try {
    await getSupabaseAdmin()
      .from("purchase_invoices")
      .update({ status })
      .eq("id", id);
    revalidatePath("/admin/aankoopfacturen");
  } catch {}
}

export async function deletePurchaseInvoice(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = str(fd, "id");
  if (!id) return;
  try {
    await getSupabaseAdmin()
      .from("purchase_invoices")
      .delete()
      .eq("id", id);
    revalidatePath("/admin/aankoopfacturen");
  } catch {}
}

// ---------- Module 5 — bank ----------

// Match openstaande inkomende transacties met onbetaalde facturen (open of
// vervallen: na de laatste herinnering staat een factuur op vervallen) via
// de Belgische gestructureerde mededeling (uniek per factuur). Enkel bij het
// volledige bedrag: een gedeeltelijke betaling blijft open voor nazicht.
// Uitbetalingen van Mollie horen bij geen factuur (die staan al op betaald
// via de webhook): die gaan op 'genegeerd'.
// Idempotent: enkel status='open' wordt aangeraakt.
async function autoMatchBank(): Promise<number> {
  const db = getSupabaseAdmin();
  const { structuredComm } = await import("@/lib/bank");
  const { structuredDigits } = await import("@/lib/bank-import");
  const { factuurBedrag } = await import("@/lib/factuur-klant");

  const [{ data: txs }, { data: invs }] = await Promise.all([
    db
      .from("bank_transactions")
      .select("id, amount_cents, counterparty, communication")
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

  type BankInv = { id: string; number: string; ogm?: string | null; amount_cents: number; offer_id?: string | null; ticket_id?: string | null; vat_reverse?: boolean | null };
  const byCode = new Map<string, BankInv>();
  for (const i of (invs as BankInv[] | null) ?? []) {
    const code = structuredDigits(structuredComm(i.number, i.ogm));
    if (code) byCode.set(code, i);
  }
  let matched = 0;
  for (const t of (txs as
    | { id: string; amount_cents: number; counterparty: string | null; communication: string | null }[]
    | null) ?? []) {
    const code = structuredDigits(t.communication);
    if (!code) {
      if (/\bmollie\b/i.test(`${t.counterparty ?? ""} ${t.communication ?? ""}`)) {
        await db.from("bank_transactions").update({ status: "genegeerd" }).eq("id", t.id);
      }
      continue;
    }
    const inv = byCode.get(code);
    if (!inv) continue;
    const teBetalen = (await factuurBedrag(inv))?.totaalCent;
    if (teBetalen == null || t.amount_cents < teBetalen) continue;
    const invId = inv.id;
    await db
      .from("bank_transactions")
      .update({ matched_invoice_id: invId, status: "gematcht" })
      .eq("id", t.id);
    await db
      .from("invoices")
      .update({ status: "betaald", paid_at: new Date().toISOString() })
      .eq("id", invId);
    await logBewijs({ soort: "betaling", invoice_id: invId, details: { via: "bank", transactie: t.id, bedrag_cent: t.amount_cents } });
    byCode.delete(code);
    matched++;
  }
  return matched;
}

export async function importBankCsv(
  fd: FormData,
): Promise<{
  ok: boolean;
  error?: string;
  imported?: number;
  matched?: number;
}> {
  if (!(await requireAdmin())) return { ok: false, error: "Geen toegang." };
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Geen CSV-bestand." };
  }
  try {
    const text = await file.text();
    const { parseBankCsv, fingerprint } = await import(
      "@/lib/bank-import"
    );
    const parsed = parseBankCsv(text);
    if (parsed.length === 0) {
      return {
        ok: false,
        error: "Geen herkenbare transacties — controleer het CSV-formaat.",
      };
    }
    const rows = parsed.map((t) => ({
      booked_at: t.bookedAt,
      amount_cents: t.amountCents,
      counterparty: t.counterparty,
      communication: t.communication,
      fingerprint: fingerprint(t),
    }));
    const { error } = await getSupabaseAdmin()
      .from("bank_transactions")
      .upsert(rows, { onConflict: "fingerprint", ignoreDuplicates: true });
    if (error) return { ok: false, error: error.message };

    const matched = await autoMatchBank();
    revalidatePath("/admin/bank");
    revalidatePath("/admin/facturen");
    return { ok: true, imported: rows.length, matched };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fout." };
  }
}

export async function importBankCsvAction(
  _prev: { ok: boolean; error?: string; imported?: number; matched?: number } | null,
  fd: FormData,
): Promise<{
  ok: boolean;
  error?: string;
  imported?: number;
  matched?: number;
}> {
  return importBankCsv(fd);
}

export async function matchTransaction(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = str(fd, "id");
  const invoiceId = str(fd, "invoice_id");
  if (!id || !invoiceId) return;
  try {
    const db = getSupabaseAdmin();
    await db
      .from("bank_transactions")
      .update({ matched_invoice_id: invoiceId, status: "gematcht" })
      .eq("id", id);
    await db
      .from("invoices")
      .update({ status: "betaald", paid_at: new Date().toISOString() })
      .eq("id", invoiceId);
    await logBewijs({ soort: "betaling", invoice_id: invoiceId, details: { via: "bank", transactie: id } });
    revalidatePath("/admin/bank");
    revalidatePath("/admin/facturen");
  } catch {}
}

export async function setTransactionStatus(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!id || (status !== "open" && status !== "genegeerd")) return;
  try {
    await getSupabaseAdmin()
      .from("bank_transactions")
      .update({
        status,
        ...(status === "open" ? { matched_invoice_id: null } : {}),
      })
      .eq("id", id);
    revalidatePath("/admin/bank");
  } catch {}
}
