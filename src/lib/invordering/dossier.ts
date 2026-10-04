import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { factuurBedrag, factuurTaal } from "@/lib/factuur-klant";
import { klantGegevens } from "@/lib/projecten-admin";
import { getCompanySettings } from "@/lib/admin/settings";
import { verwijlinterest, FORFAIT_CENT } from "@/lib/facturatie/rente";
import { regimeVan, type BtwRegime } from "@/lib/facturatie/btw";
import { structuredComm } from "@/lib/bank";
import type { Locale } from "@/lib/i18n/config";
import {
  ARRONDISSEMENTEN,
  arrondissementVanKlant,
  isArrondissement,
  isBuitenlands,
  type Arrondissement,
} from "./arrondissement";
import { htmlNaarTekst } from "./teksten";

// Alles wat de deurwaarder nodig heeft over één onbetaalde factuur: de
// factuur zelf, wie de klant is, hoe de opdracht tot stand kwam (offerte en
// aanvaarding), de oplevering, de herinneringen met hun volledige tekst, en
// wat de klant nu verschuldigd is. Ook de waarschuwingen die Studio VM moet
// zien vóór er iets vertrekt (betaald, creditnota, open ticket, particulier,
// buitenland).

const DAG = 86_400_000;

export type Deurwaarder = {
  arrondissement?: string | null;
  naam: string;
  kantoor?: string | null;
  email: string;
  telefoon?: string | null;
  adres?: string | null;
  taal: "nl" | "fr" | "de";
};

export type Herinnering = {
  niveau: number;
  op: string | null;
  aan: string | null;
  onderwerp: string | null;
  tekst: string | null;
  resendId: string | null;
};

export type Gebeurtenis = {
  op: string;
  soort: "offerte" | "levering" | "factuur" | "factuurmail" | "herinnering" | "download" | "betaling" | "invordering";
  /** Gegevens voor de tekst (nummer, bestand, niveau, IP …). */
  w: Record<string, string | number | null>;
};

export type Waarschuwing = { code: string; tekst: string; blokkeert: boolean };

export type Dossier = {
  factuur: {
    id: string;
    nummer: string;
    omschrijving: string | null;
    status: string;
    uitgereikt: string;
    vervaldag: string;
    betaaldOp: string | null;
    ogm: string;
    publicToken: string | null;
    regime: BtwRegime;
    exclCent: number;
    btwCent: number;
    totaalCent: number;
    metBtw: boolean;
    soort: "project" | "revisie" | "andere";
    herinneringsniveau: number;
  };
  klant: {
    email: string;
    naam: string;
    adres: string | null;
    btw: string | null;
    telefoon: string | null;
    taal: Locale;
  };
  /** Btw-nummer gekend → handelstransactie (wet 2 augustus 2002). */
  zakelijk: boolean;
  buitenland: boolean;
  arrondissement: Arrondissement | null;
  offerte: {
    nummer: string;
    titel: string;
    bedragCent: number | null;
    aanvaardOp: string | null;
    ip: string | null;
    browser: string | null;
    regels: { label: string; cent: number | null }[];
  } | null;
  project: {
    id: string;
    titel: string;
    status: string;
    gewerkteUren: number | null;
    leverdatum: string | null;
  } | null;
  leveringen: { naam: string; systeem: string; versie: number; op: string }[];
  herinneringen: Herinnering[];
  tijdlijn: Gebeurtenis[];
  vordering: {
    hoofdsomCent: number;
    interestCent: number;
    forfaitCent: number;
    totaalCent: number;
    dagen: number;
    pct: number | null;
    berekendOp: string;
  };
  waarschuwingen: Waarschuwing[];
};

type Inv = {
  id: string;
  client_email: string;
  client_name: string | null;
  client_address: string | null;
  client_vat: string | null;
  number: string;
  description: string | null;
  amount_cents: number;
  status: string;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  offer_id: string | null;
  ticket_id?: string | null;
  vat_reverse?: boolean | null;
  btw_regime?: string | null;
  ogm?: string | null;
  public_token?: string | null;
  reminder_level?: number | null;
  last_reminder_at?: string | null;
};

type LogRij = { created_at: string; soort: string; details: Record<string, unknown> | null };

/** Vandaag in België (YYYY-MM-DD). */
export function vandaagBrussel(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });
}

const tekst = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

export async function laadDossier(invoiceId: string): Promise<Dossier | null> {
  if (!/^[0-9a-f-]{36}$/i.test(invoiceId)) return null;
  const db = getSupabaseAdmin();
  const { data } = await db.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
  const i = data as Inv | null;
  if (!i) return null;

  const settings = await getCompanySettings();
  const b = await factuurBedrag(i);
  const vervaldag =
    i.due_at ??
    new Date(new Date(i.issued_at).getTime() + settings.payment_terms_days * DAG).toISOString().slice(0, 10);

  const [k, taal] = await Promise.all([
    klantGegevens(i.client_email, b?.quoteId ?? null),
    factuurTaal(i, b?.quoteId ?? null),
  ]);

  // Offerte (rechtstreeks aan de factuur, of via het project)
  type ProjRij = { id: string; titel: string; status: string; gewerkte_uren: number | null; leverdatum: string | null; offer_id: string | null };
  let projectRij: ProjRij | null = null;
  if (b?.projectId) {
    const { data: p } = await db
      .from("projecten")
      .select("id, titel, status, gewerkte_uren, leverdatum, offer_id")
      .eq("id", b.projectId)
      .maybeSingle();
    projectRij = (p as ProjRij | null) ?? null;
  }
  const offerId = i.offer_id ?? projectRij?.offer_id ?? null;
  type OffRij = {
    id: string;
    offer_no: string | null;
    title: string | null;
    amount_cents: number | null;
    status: string | null;
    decided_at: string | null;
    items: { label?: string; cents?: number | null; kind?: string }[] | null;
  };
  let off: OffRij | null = null;
  if (offerId) {
    const { data: o } = await db
      .from("offers")
      .select("id, offer_no, title, amount_cents, status, decided_at, items")
      .eq("id", offerId)
      .maybeSingle();
    off = (o as OffRij | null) ?? null;
  }

  // Bewijslog: rond de factuur, de offerte en het project.
  const logs: LogRij[] = [];
  const voegToe = (r: { data: unknown; error: unknown }) => {
    if (!r.error && Array.isArray(r.data)) logs.push(...(r.data as LogRij[]));
  };
  const velden = "created_at, soort, details";
  const [lf, lo, lp] = await Promise.all([
    db.from("bewijslog").select(velden).eq("invoice_id", i.id).order("created_at"),
    offerId ? db.from("bewijslog").select(velden).eq("offer_id", offerId).is("invoice_id", null).order("created_at") : Promise.resolve({ data: [], error: null }),
    projectRij ? db.from("bewijslog").select(velden).eq("project_id", projectRij.id).is("invoice_id", null).is("offer_id", null).order("created_at") : Promise.resolve({ data: [], error: null }),
  ]);
  voegToe(lf);
  voegToe(lo);
  voegToe(lp);

  const aanvaarding = logs.find((l) => l.soort === "offerte_beslist" && l.details?.beslissing === "akkoord");

  // Leveringen van het project
  let leveringen: Dossier["leveringen"] = [];
  if (projectRij) {
    const { data: lev } = await db
      .from("leveringen")
      .select("naam, systeem, versie, created_at")
      .eq("project_id", projectRij.id)
      .order("created_at");
    leveringen = ((lev as { naam: string; systeem: string; versie: number; created_at: string }[] | null) ?? []).map((l) => ({
      naam: l.naam,
      systeem: l.systeem,
      versie: l.versie,
      op: l.created_at,
    }));
  }

  // Herinneringen: uit de bewijslog; verstuurd vóór de bewijslog bestond →
  // enkel niveau en datum van de laatste (uit de factuur zelf).
  const herinneringen: Herinnering[] = logs
    .filter((l) => l.soort === "herinnering_verstuurd")
    .map((l) => ({
      niveau: Number(l.details?.niveau) || 0,
      op: l.created_at,
      aan: tekst(l.details?.aan),
      onderwerp: tekst(l.details?.onderwerp),
      tekst: l.details?.html ? htmlNaarTekst(String(l.details.html)) : null,
      resendId: tekst(l.details?.resend_id),
    }));
  const niveau = i.reminder_level ?? 0;
  if (niveau > 0 && !herinneringen.some((h) => h.niveau === niveau)) {
    herinneringen.push({ niveau, op: i.last_reminder_at ?? null, aan: i.client_email, onderwerp: null, tekst: null, resendId: null });
  }
  herinneringen.sort((a, b2) => String(a.op).localeCompare(String(b2.op)));

  // Tijdlijn
  const tijdlijn: Gebeurtenis[] = [];
  if (off?.decided_at && off.status === "akkoord") {
    tijdlijn.push({
      op: off.decided_at,
      soort: "offerte",
      w: { nummer: off.offer_no ?? off.title ?? "", ip: tekst(aanvaarding?.details?.ip), browser: tekst(aanvaarding?.details?.browser) },
    });
  }
  for (const l of leveringen) tijdlijn.push({ op: l.op, soort: "levering", w: { bestand: `${l.naam} (${l.systeem}, v${l.versie})` } });
  // Enkel een datum (geen uur): sorteert vóór de gebeurtenissen van die dag.
  tijdlijn.push({ op: i.issued_at.slice(0, 10), soort: "factuur", w: { nummer: i.number } });
  for (const l of logs) {
    if (l.soort === "factuur_verstuurd" && l.details?.verstuurd !== false)
      tijdlijn.push({ op: l.created_at, soort: "factuurmail", w: { aan: tekst(l.details?.aan) ?? i.client_email } });
    if (l.soort === "levering_gedownload")
      tijdlijn.push({ op: l.created_at, soort: "download", w: { bestand: tekst(l.details?.bestand) ?? "" } });
    if (l.soort === "betaling")
      tijdlijn.push({ op: l.created_at, soort: "betaling", w: { via: tekst(l.details?.via) ?? "" } });
  }
  for (const h of herinneringen) if (h.op) tijdlijn.push({ op: h.op, soort: "herinnering", w: { niveau: h.niveau } });
  tijdlijn.sort((a, b2) => a.op.localeCompare(b2.op));

  // Klant
  const adres = i.client_address || k.adres || null;
  const btw = i.client_vat || k.btw || null;
  const naam = i.client_name || k.bedrijf || k.naam || i.client_email;
  const zakelijk = !!btw;
  const buitenland = isBuitenlands(adres, btw);
  const arrondissement = arrondissementVanKlant(adres, btw);

  // Vordering tot vandaag
  const hoofdsom = b?.totaalCent ?? i.amount_cents;
  const vandaag = vandaagBrussel();
  const rente = zakelijk ? verwijlinterest(hoofdsom, vervaldag, vandaag) : null;
  const interestCent = rente?.interestCent ?? 0;
  const forfaitCent = zakelijk ? FORFAIT_CENT : 0;

  // Waarschuwingen
  const waarschuwingen: Waarschuwing[] = [];
  if (i.status === "betaald")
    waarschuwingen.push({ code: "betaald", tekst: `Deze factuur is betaald${i.paid_at ? ` (${i.paid_at.slice(0, 10)})` : ""}: niet naar de deurwaarder sturen.`, blokkeert: true });
  if (!b)
    waarschuwingen.push({ code: "bedrag", tekst: "Het bedrag kon niet bepaald worden (databankfout). Probeer later opnieuw.", blokkeert: true });
  const { data: cn } = await db.from("credit_notes").select("number, amount_cents").eq("invoice_id", i.id);
  for (const c of (cn as { number: string; amount_cents: number }[] | null) ?? [])
    waarschuwingen.push({ code: "creditnota", tekst: `Er bestaat een creditnota ${c.number} op deze factuur: eerst nakijken wat er nog openstaat.`, blokkeert: true });
  const { data: tk } = await db
    .from("tickets")
    .select("*")
    .ilike("client_email", i.client_email)
    .gte("created_at", i.issued_at)
    .neq("status", "gesloten");
  for (const t of (tk as { nummer?: number | null; subject: string }[] | null) ?? [])
    waarschuwingen.push({
      code: "ticket",
      tekst: `Open ticket${t.nummer ? ` #${t.nummer}` : ""} sinds de factuur: "${t.subject}". Is de factuur betwist? Een betwiste schuld hoort niet bij de deurwaarder.`,
      blokkeert: false,
    });
  if (!zakelijk)
    waarschuwingen.push({ code: "particulier", tekst: "Geen btw-nummer: de klant geldt als particulier. Enkel de hoofdsom wordt gevorderd (geen verwijlinterest of forfait van de wet van 2 augustus 2002); de deurwaarder volgt de regels voor consumenten.", blokkeert: false });
  if (buitenland)
    waarschuwingen.push({ code: "buitenland", tekst: "De klant lijkt in het buitenland te zitten: een Belgische deurwaarder kan daar niet optreden. Kies zelf een deurwaarder of gebruik het Europees betalingsbevel.", blokkeert: false });
  else if (!arrondissement)
    waarschuwingen.push({ code: "adres", tekst: "Geen Belgische postcode gevonden in het adres van de klant: kies zelf de deurwaarder.", blokkeert: false });
  if (zakelijk && !rente)
    waarschuwingen.push({ code: "rentevoet", tekst: "De rentevoet van dit semester staat nog niet in de tabel (src/lib/facturatie/rente.ts): de verwijlinterest staat op € 0.", blokkeert: false });
  if (herinneringen.some((h) => !h.tekst))
    waarschuwingen.push({ code: "bewijs", tekst: "Niet van elke herinnering is de tekst bewaard (verstuurd vóór de bewijslog bestond).", blokkeert: false });

  return {
    factuur: {
      id: i.id,
      nummer: i.number,
      omschrijving: i.description,
      status: i.status,
      uitgereikt: i.issued_at,
      vervaldag,
      betaaldOp: i.paid_at,
      ogm: structuredComm(i.number, i.ogm),
      publicToken: i.public_token ?? null,
      regime: regimeVan(i),
      exclCent: b?.exclCent ?? i.amount_cents,
      btwCent: b?.btwCent ?? 0,
      totaalCent: hoofdsom,
      metBtw: b?.metBtw ?? false,
      soort: b?.soort ?? "andere",
      herinneringsniveau: niveau,
    },
    klant: { email: i.client_email, naam, adres, btw, telefoon: k.telefoon, taal },
    zakelijk,
    buitenland,
    arrondissement,
    offerte: off
      ? {
          nummer: off.offer_no ?? "",
          titel: off.title ?? "",
          bedragCent: off.amount_cents,
          aanvaardOp: off.status === "akkoord" ? off.decided_at : null,
          ip: tekst(aanvaarding?.details?.ip),
          browser: tekst(aanvaarding?.details?.browser),
          regels: (off.items ?? [])
            .filter((r) => r.label)
            .map((r) => ({ label: String(r.label), cent: typeof r.cents === "number" ? r.cents : null })),
        }
      : null,
    project: projectRij
      ? {
          id: projectRij.id,
          titel: projectRij.titel,
          status: projectRij.status,
          gewerkteUren: projectRij.gewerkte_uren,
          leverdatum: projectRij.leverdatum,
        }
      : null,
    leveringen,
    herinneringen,
    tijdlijn,
    vordering: {
      hoofdsomCent: hoofdsom,
      interestCent,
      forfaitCent,
      totaalCent: hoofdsom + interestCent + forfaitCent,
      dagen: rente?.dagen ?? Math.max(0, Math.floor((Date.parse(vandaag) - Date.parse(vervaldag)) / DAG)),
      pct: rente?.pctNu ?? null,
      berekendOp: vandaag,
    },
    waarschuwingen,
  };
}

// ── Deurwaarders ────────────────────────────────────────────────────────

type DwRij = {
  arrondissement: string;
  naam: string;
  kantoor: string | null;
  email: string;
  telefoon: string | null;
  adres: string | null;
  taal: string;
};

export function naarDeurwaarder(r: DwRij): Deurwaarder {
  return {
    arrondissement: r.arrondissement,
    naam: r.naam,
    kantoor: r.kantoor,
    email: r.email,
    telefoon: r.telefoon,
    adres: r.adres,
    taal: r.taal === "fr" || r.taal === "de" ? r.taal : "nl",
  };
}

/** Alle ingestelde deurwaarders, per arrondissement. Leeg zonder migratie 0052. */
export async function deurwaarders(): Promise<Map<Arrondissement, Deurwaarder>> {
  const { data, error } = await getSupabaseAdmin().from("deurwaarders").select("*");
  const m = new Map<Arrondissement, Deurwaarder>();
  if (error) return m;
  for (const r of (data as DwRij[] | null) ?? []) if (isArrondissement(r.arrondissement)) m.set(r.arrondissement, naarDeurwaarder(r));
  return m;
}

/** Deurwaarder voor een dossier: die van het arrondissement van de klant. */
export async function deurwaarderVoor(arr: Arrondissement | null): Promise<Deurwaarder | null> {
  if (!arr) return null;
  return (await deurwaarders()).get(arr) ?? null;
}

export function isDeurwaarder(v: unknown): v is Deurwaarder {
  const d = v as Deurwaarder | null;
  return !!d && typeof d.naam === "string" && !!d.naam && typeof d.email === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email);
}

export function arrondissementNaam(a: string | null | undefined): string | null {
  return a && isArrondissement(a) ? ARRONDISSEMENTEN[a].naam : null;
}
