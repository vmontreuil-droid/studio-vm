import "server-only";
// Server-side hulpjes voor de projecten-admin (service-role). Geen
// server actions — die staan in src/app/actions/projecten-admin.ts.
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isTaal, type Taal } from "@/lib/projecten-teksten";
import { klantTaal } from "@/lib/klant-taal";

export type KlantGegevens = {
  taal: Taal;
  naam: string | null;
  bedrijf: string | null;
  adres: string | null;
  btw: string | null;
  telefoon: string | null;
};

type AuthMeta = {
  name?: string;
  company?: string;
  address?: string;
  vat_number?: string;
  phone?: string;
  locale?: string;
};

export async function authGebruiker(email: string): Promise<{ id: string; meta: AuthMeta } | null> {
  const clean = email.trim().toLowerCase();
  try {
    const { data } = await getSupabaseAdmin().auth.admin.listUsers({ perPage: 1000 });
    const u = data?.users?.find((x) => (x.email ?? "").toLowerCase() === clean);
    return u ? { id: u.id, meta: (u.user_metadata ?? {}) as AuthMeta } : null;
  } catch {
    return null;
  }
}

/**
 * Wat we over een klant weten: eerst het accountprofiel (handmatig
 * aangemaakte projecten bewaren daar de taal), dan de aanvraag van het
 * project / de laatste aanvraag. Taal valt terug op klantTaal() → "nl".
 */
export async function klantGegevens(email: string, quoteId?: string | null): Promise<KlantGegevens> {
  const db = getSupabaseAdmin();
  const clean = email.trim().toLowerCase();
  const [user, quoteR] = await Promise.all([
    authGebruiker(clean),
    (quoteId
      ? db.from("quotes").select("locale, name, company, address, vat_number, phone").eq("id", quoteId)
      : db
          .from("quotes")
          .select("locale, name, company, address, vat_number, phone")
          .ilike("email", clean)
          .order("created_at", { ascending: false })
          .limit(1)
    ).maybeSingle(),
  ]);
  const q = quoteR.data as {
    locale?: string | null;
    name?: string | null;
    company?: string | null;
    address?: string | null;
    vat_number?: string | null;
    phone?: string | null;
  } | null;
  const m = user?.meta ?? {};

  // Taal: expliciet gekozen bij handmatig aanmaken (accountprofiel) →
  // taal van de aanvraag van dit project → gedeelde klantTaal().
  const taal: Taal = isTaal(m.locale) ? m.locale : isTaal(q?.locale) ? (q!.locale as Taal) : await klantTaal(clean);
  return {
    taal,
    naam: m.name || q?.name || null,
    bedrijf: m.company || q?.company || null,
    // Bij een 3D-aanvraag is quotes.address het werfadres, niet het
    // facturatieadres — dus enkel het accountprofiel gebruiken.
    adres: m.address || null,
    btw: m.vat_number || q?.vat_number || null,
    telefoon: m.phone || q?.phone || null,
  };
}

/** Volgend nummer PREFIX-JAAR-NNN, zelfde reeks als de bestaande code, maar botsvrij. */
export async function volgendNummer(tabel: "offers" | "invoices", prefix: "OFF" | "FAC"): Promise<string> {
  const db = getSupabaseAdmin();
  const kol = tabel === "offers" ? "offer_no" : "number";
  const jaar = new Date().getFullYear();
  const [{ count }, { data }] = await Promise.all([
    db.from(tabel).select("id", { count: "exact", head: true }),
    db.from(tabel).select(kol).like(kol, `${prefix}-${jaar}-%`).limit(5000),
  ]);
  let max = 0;
  for (const r of (data as Record<string, string | null>[] | null) ?? []) {
    const n = Number(String(r[kol] ?? "").split("-")[2]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  const volgende = Math.max((count ?? 0) + 1, max + 1);
  return `${prefix}-${jaar}-${String(volgende).padStart(3, "0")}`;
}
