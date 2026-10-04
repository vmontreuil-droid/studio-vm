import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sourceFromLand, type Land } from "@/lib/admin/prospect-source";
import { safeFetchText } from "@/lib/safe-fetch";
import {
  adresPastBijSite,
  beoordeel,
  decodeSignalen,
  detecteerSignalen,
  encodeSignalen,
  isAannemerGrade,
  isGeparkeerd,
  isKernNace,
  legeSignalen,
  naceMetPunt,
  naceOrFilter,
  parseNaceList,
  signaalLabels,
  type AannemerGrade,
  type MailTaal,
  type Signalen,
} from "@/lib/admin/aannemers";

// Outreach-engine — sinds 1/10/2026 gericht op aannemers (grond-, weg-
// en waterbouw) voor 3D-modellen voor machinesturing.
//
// Pijplijn (alle stappen respecteren de pauze, behalve de e-mailzoeker
// en website-discovery die enkel publieke data lezen):
//   1. website-discovery    — website zoeken voor aannemers zonder URL
//   2. outreach-email-finder — publiek contactadres op hun site zoeken
//   3. outreach-prescan     — homepage lezen op machinesturing-signalen,
//                             prioriteit bepalen, rij in prospect_outreach
//   4. outreach-send        — eerste mail, hoogste prioriteit eerst
//   5. outreach-followup    — één opvolgmail na 5 dagen

export type OutreachConfig = {
  paused: boolean;
  dailyQuota: number;
  calLink: string | null;
  senderName: string;
  senderEmail: string;
  /** Niet meer gebruikt door de aannemers-campagne (bewaard voor de DB-kolom). */
  minScore: number;
  /** Niet meer gebruikt door de aannemers-campagne (bewaard voor de DB-kolom). */
  maxScore: number;
  /** Ingestelde NACE-prefixen (genormaliseerd, zonder punten). Leeg = standaard-aannemersselectie. */
  nacePrefixes: string[];
  lands: Land[];
  startedAt: string | null;
};

const DEFAULT_CONFIG: OutreachConfig = {
  paused: true,
  dailyQuota: 20,
  calLink: null,
  senderName: "Vincent Montreuil",
  senderEmail: "vincent@studio-vm.be",
  minScore: 30,
  maxScore: 65,
  nacePrefixes: [],
  lands: ["be"],
  startedAt: null,
};

// Warm-up-curve: nieuwe afzender-domeinen moeten gradueel opbouwen
// om bij mailproviders niet als "plotseling agressief" gezien te
// worden. We capen de configurabele dagquota op een curve die op
// dag 14 de volle quota bereikt — met meerdere tussenstappen zodat
// er geen bruuske sprong (bv. 15 → 100) in zit:
//
//   dag  0-3  → max 5
//   dag  4-7  → max 10
//   dag  8-10 → max 25
//   dag 11-13 → max 50
//   dag 14+   → volle configuratie-quota
//
// Stelt vanzelf in zodra de eerste mail uitgaat (outreach_started_at).
export function warmUpQuota(
  configured: number,
  startedAt: string | null,
): number {
  if (!startedAt) return Math.min(configured, 5);
  const days = Math.floor(
    (Date.now() - new Date(startedAt).getTime()) / 86_400_000,
  );
  const cap =
    days < 4 ? 5 : days < 8 ? 10 : days < 11 ? 25 : days < 14 ? 50 : configured;
  return Math.min(configured, cap);
}

export async function getOutreachConfig(): Promise<OutreachConfig> {
  try {
    const { data } = await getSupabaseAdmin()
      .from("company_settings")
      .select(
        "outreach_paused, outreach_daily_quota, outreach_cal_link, outreach_sender_name, outreach_sender_email, outreach_min_score, outreach_max_score, outreach_nace_prefixes, outreach_lands, outreach_started_at",
      )
      .eq("id", "default")
      .maybeSingle();
    if (!data) return DEFAULT_CONFIG;
    const r = data as Record<string, unknown>;
    const lands = ((r.outreach_lands as string[] | null) ?? ["be"]).filter(
      (l): l is Land => l === "be" || l === "fr" || l === "uk",
    );
    return {
      // Bij twijfel: gepauzeerd.
      paused: (r.outreach_paused as boolean | null) ?? true,
      dailyQuota: (r.outreach_daily_quota as number) ?? 20,
      calLink: (r.outreach_cal_link as string) || null,
      senderName: (r.outreach_sender_name as string) || DEFAULT_CONFIG.senderName,
      senderEmail:
        (r.outreach_sender_email as string) || DEFAULT_CONFIG.senderEmail,
      minScore: (r.outreach_min_score as number) ?? 30,
      maxScore: (r.outreach_max_score as number) ?? 65,
      nacePrefixes: parseNaceList(r.outreach_nace_prefixes),
      lands: lands.length > 0 ? lands : ["be"],
      startedAt: (r.outreach_started_at as string | null) ?? null,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// Taalkeuze per prospect.
//   UK → en, Frankrijk → fr.
//   België: eerst de taal van hun eigen website (<html lang>), anders de
//   postcode: 1000-1299 Brussel (meestal Franstalig) → fr, 1300-1499
//   Waals-Brabant → fr, 4700-4799 Duitstalige Gemeenschap → de,
//   4000-7999 Wallonië → fr, de rest (Vlaanderen) → nl.
export function detectLang(
  land: Land,
  postcode: string | null,
  siteLang?: MailTaal | null,
): MailTaal {
  if (land === "uk") return "en";
  if (land === "fr") return "fr";
  if (siteLang === "nl" || siteLang === "fr" || siteLang === "de") return siteLang;
  const pc = Number((postcode || "0").replace(/\D/g, "").slice(0, 4) || "0");
  if (pc >= 1000 && pc <= 1499) return "fr";
  if (pc >= 4700 && pc <= 4799) return "de";
  if (pc >= 4000 && pc <= 7999) return "fr";
  return "nl";
}

/** NACE-hoofdcode van een prospect (bepaalt de doelgroep en dus de mail). */
export async function naceVanProspect(land: Land, prospectId: string): Promise<string | null> {
  const src = sourceFromLand(land);
  const { data } = await getSupabaseAdmin().from(src.table).select(src.codeCol).eq(src.idCol, prospectId).maybeSingle();
  const v = (data as Record<string, unknown> | null)?.[src.codeCol];
  return typeof v === "string" ? v : null;
}

/** Taal voor een bestaande outreach-rij (postcode uit KBO voor BE). */
export async function langVoorProspect(
  land: Land,
  prospectId: string,
  signalen: Signalen | null,
): Promise<MailTaal> {
  if (land !== "be") return detectLang(land, null, signalen?.taal ?? null);
  try {
    const { data } = await getSupabaseAdmin()
      .from("kbo_enterprises")
      .select("postcode")
      .eq("enterprise_number", prospectId)
      .maybeSingle();
    return detectLang(
      "be",
      (data as { postcode: string | null } | null)?.postcode ?? null,
      signalen?.taal ?? null,
    );
  } catch {
    return detectLang("be", null, signalen?.taal ?? null);
  }
}

/** Signalen uit een outreach-rij (scan_stack bevat de JSON). */
export function signalenUitRij(r: {
  scan_stack?: string | null;
  signalen?: unknown;
}): Signalen | null {
  return decodeSignalen(r.signalen ?? null) ?? decodeSignalen(r.scan_stack ?? null);
}

// Token voor de afmeldlink (bewaard in prospect_outreach.scan_token).
function makeToken(): string {
  return randomBytes(18).toString("base64url");
}

const EMAIL_RE = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i;

export function bruikbaarAdres(e: unknown): string | null {
  const s = String(e ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(s)) return null;
  if (/^(no-?reply|postmaster|mailer-daemon|abuse)@/.test(s)) return null;
  return s;
}

// Optionele jsonb-kolom 'signalen' (migratie 0048). Bestaat ze nog niet,
// dan schrijven we enkel in de bestaande scan_*-kolommen.
let signalenKolom: boolean | null = null;

const HOMEPAGE_UA =
  "StudioVM/1.0 (+https://studio-vm.be; leest enkel de publieke homepage)";

async function schrijfRij(
  row: Record<string, unknown>,
  signalen: Signalen,
): Promise<boolean> {
  const db = getSupabaseAdmin();
  if (signalenKolom !== false) {
    const { error } = await db
      .from("prospect_outreach")
      .upsert({ ...row, signalen }, { onConflict: "land,prospect_id" });
    if (!error) {
      signalenKolom = true;
      return true;
    }
    if (!/signalen/i.test(error.message)) return false;
    signalenKolom = false;
  }
  const { error } = await db
    .from("prospect_outreach")
    .upsert(row, { onConflict: "land,prospect_id" });
  return !error;
}

export type QualifyResult = {
  ok: boolean;
  grade?: AannemerGrade;
  score?: number;
  /** Reden als er niet gemaild kan worden (rij staat dan op 'nieuw'). */
  overgeslagen?: string;
};

/**
 * Kwalificeer één aannemer: lees (licht, SSRF-veilig) de homepage, zoek
 * machinesturing- en grondwerksignalen, bepaal prioriteit, en zet de rij
 * in prospect_outreach op 'gescand' (= klaar om te mailen).
 *
 * - Geparkeerd/te koop staand domein → het op die site gevonden adres
 *   wordt genegeerd (dat is van de makelaar); enkel een adres uit het
 *   register blijft over.
 * - Geen bruikbaar adres → rij op 'nieuw' met reden in notes (wordt nooit
 *   gemaild en niet elke run opnieuw opgehaald).
 * - Raakt nooit een rij aan die al gemaild, afgemeld of gebounced is.
 */
export async function qualifyProspect(
  land: Land,
  prospectId: string,
  website: string | null,
  adressen: { site: string | null; register: string | null },
  nace: string | null = null,
): Promise<QualifyResult> {
  const db = getSupabaseAdmin();

  // Bestaande rij? Enkel een nooit-gemailde rij uit de oude
  // website-campagne mag opnieuw gekwalificeerd worden.
  const { data: bestaand } = await db
    .from("prospect_outreach")
    .select("status, scan_token, scan_grade, mail_sent_at, bounced_at, complaint_at")
    .eq("land", land)
    .eq("prospect_id", prospectId)
    .maybeSingle();
  const b = bestaand as {
    status: string;
    scan_token: string | null;
    scan_grade: string | null;
    mail_sent_at: string | null;
    bounced_at: string | null;
    complaint_at: string | null;
  } | null;
  if (
    b &&
    (isAannemerGrade(b.scan_grade) ||
      b.status !== "gescand" ||
      b.mail_sent_at ||
      b.bounced_at ||
      b.complaint_at)
  ) {
    return { ok: false };
  }

  const siteAdres = bruikbaarAdres(adressen.site);
  const registerAdres = bruikbaarAdres(adressen.register);

  let signalen: Signalen;
  let mailTo: string | null;
  const site = website && website.trim() ? website.trim() : null;
  if (site) {
    const page = await safeFetchText(site, {
      timeoutMs: 8000,
      maxBytes: 400_000,
      userAgent: HOMEPAGE_UA,
    });
    const html =
      page && page.ok && /html|xml|text\/plain/i.test(page.contentType || "text/html")
        ? page.text
        : null;
    if (html && isGeparkeerd(html)) {
      signalen = legeSignalen("geparkeerd");
      mailTo = registerAdres;
    } else if (html) {
      signalen = detecteerSignalen(html);
      mailTo = siteAdres ?? registerAdres;
    } else {
      // Tijdelijk onbereikbaar: het eerder op de site gevonden adres blijft geldig.
      signalen = legeSignalen("onbereikbaar");
      mailTo = siteAdres ?? registerAdres;
    }
  } else {
    signalen = legeSignalen("geen-site");
    mailTo = registerAdres;
  }
  const { grade, score } = beoordeel(signalen);
  const now = new Date().toISOString();
  // Randactiviteit (bv. 43.99) zonder enig signaal: niet mailen.
  const zonderSignaal = grade === "3D:AL" || grade === "3D:NS";
  const randZonderSignaal = zonderSignaal && !!nace && !isKernNace(nace);
  const klaar = !!mailTo && !randZonderSignaal;

  const row: Record<string, unknown> = {
    land,
    prospect_id: prospectId,
    website: site,
    scan_score: score,
    scan_grade: grade,
    scan_stack: encodeSignalen(signalen),
    scan_issues: signaalLabels(signalen),
    scan_token: b?.scan_token || makeToken(),
    scan_at: now,
    mail_to: mailTo,
    status: klaar ? "gescand" : "nieuw",
    updated_at: now,
  };
  let overgeslagen: string | undefined;
  if (!mailTo) {
    overgeslagen =
      signalen.bron === "geparkeerd"
        ? "overgeslagen: website is een geparkeerd/te koop staand domein, geen adres in het register"
        : "overgeslagen: geen bruikbaar e-mailadres";
  } else if (randZonderSignaal) {
    overgeslagen = `overgeslagen: randactiviteit (NACE ${naceMetPunt(nace ?? "")}) zonder grondwerk- of machinesturing-signalen`;
  }
  if (overgeslagen) row.notes = overgeslagen;
  const ok = await schrijfRij(row, signalen);
  if (!ok) return { ok: false };
  return klaar ? { ok: true, grade, score } : { ok: false, grade, score, overgeslagen };
}

export type PrescanPick = {
  id: string;
  website: string | null;
  /** Op de eigen website gevonden adres (email_found), indien plausibel. */
  siteEmail: string | null;
  /** Adres uit het ondernemingsregister (kolom email). */
  registerEmail: string | null;
  /** Hoofdactiviteit (NACE/APE/SIC zoals in de bron-tabel). */
  nace: string | null;
};

const PAGE = 250;
const MAX_PAGES = 24;

/**
 * Kies tot `limit` aannemers (NACE-filter) die nog niet gekwalificeerd
 * zijn. Eerst wie een website + gevonden contactadres heeft, daarna wie
 * een e-mailadres in het register heeft (ook zonder website). Wie geen
 * website én geen gekend adres heeft, wordt overgeslagen.
 */
export async function pickForPrescan(
  land: Land,
  limit: number,
  nacePrefixes: string[],
): Promise<PrescanPick[]> {
  const src = sourceFromLand(land);
  const db = getSupabaseAdmin();
  const naceFilter = naceOrFilter(src.codeCol, nacePrefixes, land);
  if (!naceFilter || limit <= 0) return [];

  const out: PrescanPick[] = [];
  const gezien = new Set<string>();

  type Ruw = Record<string, unknown>;
  const groepen: { soort: "site" | "register"; query: (from: number) => PromiseLike<{ data: unknown }> }[] = [
    {
      soort: "site",
      query: (from) =>
        db
          .from(src.table)
          .select(`${src.idCol}, website, email_found, email, ${src.codeCol}`)
          .or(naceFilter)
          .eq(src.statusCol, src.activeValue)
          .not("website", "is", null)
          .not("email_found", "is", null)
          .neq("email_found", "[]")
          .order(src.idCol, { ascending: true })
          .range(from, from + PAGE - 1),
    },
    {
      soort: "register",
      query: (from) => {
        let q = db
          .from(src.table)
          .select(`${src.idCol}, website, email_found, email, ${src.codeCol}`)
          .or(naceFilter)
          .eq(src.statusCol, src.activeValue)
          .not("email", "is", null);
        // België: enkel rechtspersonen voor adressen uit het register
        // (geen eenmanszaken/natuurlijke personen zonder eigen site).
        if (land === "be") q = q.eq("type_of_enterprise", "2");
        return q.order(src.idCol, { ascending: true }).range(from, from + PAGE - 1);
      },
    },
  ];

  for (const g of groepen) {
    // Enkel de KBO bevat e-mailadressen uit het register; Sirene en
    // Companies House niet (en die tabellen zijn te groot om leeg te zoeken).
    if (g.soort === "register" && land !== "be") continue;
    for (let page = 0; page < MAX_PAGES && out.length < limit; page++) {
      const { data } = await g.query(page * PAGE);
      const rows = (data as Ruw[] | null) ?? [];
      if (rows.length === 0) break;

      const kandidaten: PrescanPick[] = [];
      for (const r of rows) {
        const id = String(r[src.idCol] ?? "");
        if (!id || gezien.has(id)) continue;
        const site =
          typeof r.website === "string" && r.website.trim() ? r.website.trim() : null;
        const siteEmail = Array.isArray(r.email_found)
          ? ((r.email_found as unknown[])
              .map(bruikbaarAdres)
              .find((e): e is string => !!e && adresPastBijSite(e, site)) ?? null)
          : null;
        const registerEmail = bruikbaarAdres(r.email);
        // Zonder website én zonder gekend adres: overslaan.
        if (!siteEmail && !registerEmail) continue;
        const nace = typeof r[src.codeCol] === "string" ? (r[src.codeCol] as string) : null;
        kandidaten.push({ id, website: site, siteEmail, registerEmail, nace });
      }
      if (kandidaten.length === 0) {
        if (rows.length < PAGE) break;
        continue;
      }

      // Wie heeft al een outreach-rij?
      const { data: bestaand } = await db
        .from("prospect_outreach")
        .select("prospect_id, status, scan_grade, mail_sent_at, bounced_at, complaint_at")
        .eq("land", land)
        .in(
          "prospect_id",
          kandidaten.map((k) => k.id),
        );
      const blok = new Set<string>();
      for (const e of (bestaand as {
        prospect_id: string;
        status: string;
        scan_grade: string | null;
        mail_sent_at: string | null;
        bounced_at: string | null;
        complaint_at: string | null;
      }[] | null) ?? []) {
        const herkwalificeerbaar =
          !isAannemerGrade(e.scan_grade) &&
          e.status === "gescand" &&
          !e.mail_sent_at &&
          !e.bounced_at &&
          !e.complaint_at;
        if (!herkwalificeerbaar) blok.add(e.prospect_id);
      }

      for (const k of kandidaten) {
        gezien.add(k.id);
        if (blok.has(k.id)) continue;
        out.push(k);
        if (out.length >= limit) break;
      }
      if (rows.length < PAGE) break;
    }
  }
  return out;
}

/**
 * Onderdrukking op adresniveau: is dit adres al afgemeld, gebounced,
 * als klacht gemeld, of al gemaild in de aannemers-campagne (via een
 * andere onderneming met hetzelfde adres)?
 */
export async function adresOnderdrukt(
  email: string,
  self: { land: string; prospect_id: string },
): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from("prospect_outreach")
    .select("land, prospect_id, status, scan_grade, mail_sent_at, bounced_at, complaint_at")
    .ilike("mail_to", email.replace(/[%_\\]/g, (c) => `\\${c}`))
    .limit(50);
  for (const r of (data as {
    land: string;
    prospect_id: string;
    status: string;
    scan_grade: string | null;
    mail_sent_at: string | null;
    bounced_at: string | null;
    complaint_at: string | null;
  }[] | null) ?? []) {
    if (r.land === self.land && r.prospect_id === self.prospect_id) continue;
    if (r.status === "geen_interesse" || r.bounced_at || r.complaint_at) return true;
    if (isAannemerGrade(r.scan_grade) && r.mail_sent_at) return true;
  }
  return false;
}
