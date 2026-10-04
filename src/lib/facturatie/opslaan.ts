import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leesDocumentnummer, maakDocumentnummer, ogmVoorFactuur, type DocumentSoort } from "@/lib/facturatie/nummers";
import { nieuwToken } from "@/lib/facturatie/online-betalen";

// De ENIGE plek die facturen, creditnota's en offertes aanmaakt.
//
// Na migratie 0051 kent de databank het nummer toe binnen dezelfde bewerking
// als het opslaan (trigger): geen dubbele nummers, geen gaten. Deze code laat
// het nummer dan gewoon weg en leest het terug.
//
// Zolang 0051 niet gedraaid is, telt ze zoals vroeger (hoogste nummer van dit
// jaar + 1). Zo blijft alles werken in de tussentijd.

type Db = ReturnType<typeof getSupabaseAdmin>;
type Rij = Record<string, unknown>;

/** token = public_token van een factuur (factuurdocument en online betalen zonder aanmelden). */
export type Opgeslagen = { id: string; nummer: string; ogm: string | null; token: string | null };
export type Uitkomst = { ok: true; doc: Opgeslagen } | { ok: false; fout: string };

let actiefCache: { waarde: boolean; tot: number } | null = null;

/** Is migratie 0051 gedraaid? (tabel documentnummers bestaat) — 60 s onthouden. */
export async function nummeringActief(db: Db = getSupabaseAdmin()): Promise<boolean> {
  if (actiefCache && actiefCache.tot > Date.now()) return actiefCache.waarde;
  const { error } = await db.from("documentnummers").select("soort", { head: true, count: "exact" }).limit(1);
  const waarde = !error;
  actiefCache = { waarde, tot: Date.now() + 60_000 };
  return waarde;
}

const TABEL: Record<DocumentSoort, { tabel: "invoices" | "credit_notes" | "offers"; kolom: "number" | "offer_no" }> = {
  FAC: { tabel: "invoices", kolom: "number" },
  CN: { tabel: "credit_notes", kolom: "number" },
  OFF: { tabel: "offers", kolom: "offer_no" },
};

const NIEUWE_KOLOMMEN = ["ogm", "btw_regime", "btw_controle"] as const;

/** Vroegere telling (enkel zolang 0051 niet gedraaid is): hoogste van dit jaar + 1. */
async function oudVolgendNummer(db: Db, soort: DocumentSoort): Promise<string> {
  const { tabel, kolom } = TABEL[soort];
  const jaar = new Date().getFullYear();
  const { data } = await db.from(tabel).select(kolom).like(kolom, `${soort}-${jaar}-%`).limit(10_000);
  let hoogste = 0;
  for (const r of (data as Rij[] | null) ?? []) {
    const d = leesDocumentnummer(String(r[kolom] ?? ""));
    if (d && d.jaar === jaar && d.volgnummer > hoogste) hoogste = d.volgnummer;
  }
  return maakDocumentnummer(soort, jaar, hoogste + 1);
}

async function slaOp(db: Db, soort: DocumentSoort, rij: Rij): Promise<Uitkomst> {
  const { tabel, kolom } = TABEL[soort];
  // Een meegegeven nummer negeren we altijd: nummers komen enkel van hier.
  const schoon: Rij = { ...rij };
  delete schoon[kolom];
  // Elke factuur een publieke link (document + online betalen).
  if (soort === "FAC" && !schoon.public_token) schoon.public_token = nieuwToken();
  const actief = await nummeringActief(db);
  if (!actief) {
    schoon[kolom] = await oudVolgendNummer(db, soort);
    // Kolommen die pas met 0051 bestaan, niet meesturen.
    for (const k of NIEUWE_KOLOMMEN) delete schoon[k];
  }
  const velden = soort === "FAC" && actief ? `id, ${kolom}, ogm` : `id, ${kolom}`;
  const { data, error } = await db.from(tabel).insert(schoon).select(velden).single();
  if (error || !data) {
    console.error(`[facturatie] ${soort} opslaan mislukt:`, error?.code, error?.message);
    return { ok: false, fout: error?.message ?? "onbekende fout" };
  }
  const r = data as unknown as Rij;
  const nummer = String(r[kolom] ?? "");
  const ogm = soort === "FAC" ? ogmVoorFactuur(nummer, (r.ogm as string | null | undefined) ?? null) : null;
  const token = soort === "FAC" ? String(schoon.public_token) : null;
  return { ok: true, doc: { id: String(r.id), nummer, ogm, token } };
}

/** Nieuwe factuur. Geef GEEN nummer mee; je krijgt nummer en mededeling terug. */
export function slaFactuurOp(rij: Rij, db: Db = getSupabaseAdmin()): Promise<Uitkomst> {
  return slaOp(db, "FAC", rij);
}

/** Nieuwe creditnota (CN-jjjj-nnn). */
export function slaCreditnotaOp(rij: Rij, db: Db = getSupabaseAdmin()): Promise<Uitkomst> {
  return slaOp(db, "CN", rij);
}

/** Nieuwe offerte (OFF-jjjj-nnn). */
export function slaOfferteOp(rij: Rij, db: Db = getSupabaseAdmin()): Promise<Uitkomst> {
  return slaOp(db, "OFF", rij);
}
