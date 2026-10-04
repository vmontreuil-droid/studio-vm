// Contentmachine: plant elke week de social-berichten van Studio VM.
//
// Wordt aangeroepen door /api/cron/social-generate (maandag 06:00 UTC, dus
// 07:00 in de winter en 08:00 in de zomer) en door de knop "Week plannen" in
// /admin/social. Per week vier plaatsen (Belgische tijd):
//   di 12:00  Nederlandstalig bericht  (Facebook, Instagram, Threads, Bluesky, X, Pinterest)
//   wo 12:00  Google Bedrijfsprofiel   (NL)
//   do 12:00  Franstalig bericht       (zelfde kanalen als dinsdag)
//   vr 12:00  story of reel            (reel als er een video klaarstaat)
// De soort volgt een rotatie over 4 weken (typeVoorWeek). Tips, vragen,
// carrousels, aanbod en video's staan meteen op "goedgekeurd"; realisaties
// wachten op een akkoord (ze kunnen klantgegevens tonen), tenzij de schakelaar
// "social_alles_automatisch" aan staat. Een tekst die de controle niet
// doorstaat (link, verboden woord, te veel hashtags) wacht altijd.
//
// Publiceren doet de publisher, niet deze module. Afspraak: enkel rijen met
// status = 'goedgekeurd' en scheduled_for <= nu, en enkel als migratie 0050
// gedraaid is (kolom post_type bestaat). Nooit de oude status 'klaar': daar
// staan honderden drafts van de oude dagelijkse machine op.
// goedkeuring_nodig blijft true na een akkoord; de status is leidend.
//
// Zonder migratie 0050 plant de machine niets (voorbeeld kan wel, dryRun).

import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/config";
import { SOCIAL_FORMATEN, socialBeeldPad, type SocialFormaat } from "@/lib/social/beeld-url";
import { isUtmBron, metUtm, type UtmBron } from "@/lib/utm";
import {
  GOEDKEURING_VERPLICHT,
  REALISATIE_IDS,
  STANDAARD_KANALEN,
  bouwTekst,
  kaartVan,
  realisatieKeuze,
  storyVoorWeek,
  templatesVanType,
  tekstProblemen,
  typeVoorWeek,
  TEMPLATES,
  type Dia,
  type Kanaal,
  type PostType,
  type Taal,
  type Template,
  type TemplateCtx,
} from "./social-templates";

type Db = ReturnType<typeof getSupabaseAdmin>;

// =====================================================================
// Tijd: weken en Belgische uren
// =====================================================================

const TZ = "Europe/Brussels";
const DAG_MS = 86_400_000;

export type Delen = { jaar: number; maand: number; dag: number; uur: number; minuut: number };

/** Kalenderdelen van een moment in Belgische tijd. */
export function brusselsDelen(d: Date): Delen {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const n = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return { jaar: n("year"), maand: n("month"), dag: n("day"), uur: n("hour"), minuut: n("minute") };
}

/** Belgische kloktijd → UTC-moment (zomer- en wintertijd inbegrepen). */
export function brusselsNaarUtc(jaar: number, maand: number, dag: number, uur = 0, minuut = 0): Date {
  const doel = Date.UTC(jaar, maand - 1, dag, uur, minuut);
  let t = doel;
  for (let i = 0; i < 3; i++) {
    const d = brusselsDelen(new Date(t));
    const verschil = doel - Date.UTC(d.jaar, d.maand - 1, d.dag, d.uur, d.minuut);
    if (!verschil) break;
    t += verschil;
  }
  return new Date(t);
}

/** ISO-week van een kalenderdatum. */
export function isoWeekVan(jaar: number, maand: number, dag: number): { jaar: number; week: number } {
  const d = new Date(Date.UTC(jaar, maand - 1, dag));
  const wd = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - wd);
  const begin = Date.UTC(d.getUTCFullYear(), 0, 1);
  return { jaar: d.getUTCFullYear(), week: Math.ceil(((d.getTime() - begin) / DAG_MS + 1) / 7) };
}

export function weekSleutel(jaar: number, week: number): string {
  return `${jaar}-W${String(week).padStart(2, "0")}`;
}

export function parseWeek(s: unknown): { jaar: number; week: number } | null {
  const m = typeof s === "string" ? s.match(/^(\d{4})-W(\d{2})$/) : null;
  if (!m) return null;
  const jaar = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > 53) return null;
  // Week 53 bestaat niet elk jaar.
  if (week === 53 && isoWeekVan(jaar, 12, 28).week !== 53) return null;
  return { jaar, week };
}

/** De week (YYYY-Www) waarin dit moment in België valt. */
export function huidigeWeek(nu = new Date()): string {
  const d = brusselsDelen(nu);
  const w = isoWeekVan(d.jaar, d.maand, d.dag);
  return weekSleutel(w.jaar, w.week);
}

/** Maandag van een ISO-week, als kalenderdatum. */
export function maandagVan(sleutel: string): { jaar: number; maand: number; dag: number } {
  const w = parseWeek(sleutel) ?? parseWeek(huidigeWeek())!;
  const jan4 = new Date(Date.UTC(w.jaar, 0, 4));
  const wd = jan4.getUTCDay() || 7;
  const ma = new Date(Date.UTC(w.jaar, 0, 4 - (wd - 1)) + (w.week - 1) * 7 * DAG_MS);
  return { jaar: ma.getUTCFullYear(), maand: ma.getUTCMonth() + 1, dag: ma.getUTCDate() };
}

/** Kalenderdatum n dagen na een andere. */
export function plusDagenDatum(d: { jaar: number; maand: number; dag: number }, n: number) {
  const t = new Date(Date.UTC(d.jaar, d.maand - 1, d.dag) + n * DAG_MS);
  return { jaar: t.getUTCFullYear(), maand: t.getUTCMonth() + 1, dag: t.getUTCDate() };
}

/** [maandag 00:00, volgende maandag 00:00) in Belgische tijd, als UTC-momenten. */
export function weekBereik(sleutel: string): { van: Date; tot: Date } {
  const ma = maandagVan(sleutel);
  const vm = plusDagenDatum(ma, 7);
  return { van: brusselsNaarUtc(ma.jaar, ma.maand, ma.dag), tot: brusselsNaarUtc(vm.jaar, vm.maand, vm.dag) };
}

export function verschuifWeek(sleutel: string, n: number): string {
  const ma = plusDagenDatum(maandagVan(sleutel), n * 7);
  const w = isoWeekVan(ma.jaar, ma.maand, ma.dag);
  return weekSleutel(w.jaar, w.week);
}

/** utm_campaign van een week: "2026-w41" (zelfde vorm als utmWeek() in lib/utm). */
export function utmCampagne(sleutel: string): string {
  return sleutel.toLowerCase();
}

/** UTC-moment → waarde voor <input type="datetime-local">, in Belgische tijd. */
export function datumVeld(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = brusselsDelen(new Date(iso));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.jaar}-${p(d.maand)}-${p(d.dag)}T${p(d.uur)}:${p(d.minuut)}`;
}

/** Waarde van <input type="datetime-local"> (Belgische tijd) → UTC-moment. */
export function vanDatumVeld(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const d = brusselsNaarUtc(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Een draft van de oude dagelijkse machine (vóór oktober 2026): nooit gepland, nooit gepost. */
export function isOudeDraft(p: { notes?: string | null; scheduled_for?: string | null; status?: string | null }): boolean {
  return !p.scheduled_for && (p.notes ?? "").includes("auto-engine") && !["gepost", "gepubliceerd"].includes(p.status ?? "");
}

// =====================================================================
// Media en UTM: de afspraak met de beeldroute en de publisher
// =====================================================================

export type SocialMedia = {
  /** Versie: breekt caches van de beelden na een wijziging. */
  v: string;
  /** Pad per formaat, uit socialBeeldPad() (relatief; de site-URL ervoor zetten). */
  beelden: Partial<Record<SocialFormaat, string>>;
  /** Bronbeeld voor de kaart (pad in /public; .png, .jpg of .webp). */
  kaart?: string;
  /** Projectbeeld om mee te sturen (realisatie). */
  beeld?: string;
  /** Publieke mp4 (bucket social-media) voor een reel / Short / TikTok. */
  video?: string;
  /** Dia's van een carrousel (kop + korte tekst, eventueel eigen beeld). */
  dias?: Dia[];
};

export function nieuweVersie(): string {
  return Date.now().toString(36);
}

export function mediaVoor(id: string, v: string, extra: Omit<SocialMedia, "v" | "beelden"> = {}): SocialMedia {
  const beelden: Partial<Record<SocialFormaat, string>> = {};
  for (const f of Object.keys(SOCIAL_FORMATEN) as SocialFormaat[]) beelden[f] = socialBeeldPad(id, f, v);
  return { v, beelden, ...extra };
}

/** Het beeldformaat dat bij een plaats hoort (voor voorbeelden en mails). */
export function hoofdFormaat(p: { post_kind?: string | null; platform?: string | null }): SocialFormaat {
  if (p.post_kind === "story" || p.post_kind === "reel") return "story";
  if (p.platform === "google") return "gbp";
  return "portrait";
}

/**
 * Link met UTM voor één bericht op één kanaal, via het gedeelde schema in
 * lib/utm.ts (metUtm): bron = kanaal, medium = social (gbp voor Google),
 * campagne = week van het bericht ("2026-w41"), inhoud = id van het bericht.
 * Vaste profiel-, bio- en knoplinks komen uit profielLinks(), niet van hier.
 */
export function socialUtmLink(
  p: { id: string; target_url?: string | null; utm_campaign?: string | null; utm_source?: string | null },
  kanaal: Kanaal | string,
): string {
  const bron: UtmBron = isUtmBron(kanaal) ? kanaal : isUtmBron(p.utm_source) ? p.utm_source : "facebook";
  return metUtm(p.target_url || "/nl", {
    bron,
    medium: bron === "google" ? "gbp" : "social",
    campagne: p.utm_campaign || undefined,
    inhoud: p.id,
  });
}

// =====================================================================
// Databank: migratie, instellingen, gebruik
// =====================================================================

export type MigratieStand = { kolommen: boolean; tokens: boolean };

/** Is migratie 0050 gedraaid? (alleen lezen) */
export async function socialMigratie(db: Db = getSupabaseAdmin()): Promise<MigratieStand> {
  const [a, b] = await Promise.all([
    db.from("social_posts").select("post_type").limit(1),
    db.from("goedkeur_tokens").select("id").limit(1),
  ]);
  return { kolommen: !a.error, tokens: !b.error };
}

export const ALLES_AUTOMATISCH_SLEUTEL = "social_alles_automatisch";

export async function leesAllesAutomatisch(db: Db = getSupabaseAdmin()): Promise<boolean> {
  const { data } = await db.from("app_settings").select("value").eq("key", ALLES_AUTOMATISCH_SLEUTEL).maybeSingle();
  return (data as { value: string | null } | null)?.value === "ja";
}

type Gebruik = {
  template: Map<string, number>;
  realisatie: Map<string, number>;
  video: Map<string, number>;
};

function noteer(m: Map<string, number>, k: string | undefined, t: number) {
  if (!k) return;
  if ((m.get(k) ?? 0) < t) m.set(k, t);
}

/** Wanneer elk sjabloon, elke realisatie en elke video laatst gebruikt werd. */
async function leesGebruik(db: Db): Promise<Gebruik> {
  const sinds = new Date(Date.now() - 365 * DAG_MS).toISOString();
  const { data } = await db
    .from("social_posts")
    .select("notes, created_at, scheduled_for")
    .like("notes", "%auto-engine%")
    .gte("created_at", sinds)
    .order("created_at", { ascending: false })
    .limit(1000);
  const g: Gebruik = { template: new Map(), realisatie: new Map(), video: new Map() };
  for (const r of (data as Array<{ notes: string | null; created_at: string; scheduled_for: string | null }> | null) ?? []) {
    const t = Date.parse(r.scheduled_for ?? r.created_at) || 0;
    const n = r.notes ?? "";
    noteer(g.template, n.match(/template:([\w-]+)/)?.[1], t);
    noteer(g.realisatie, n.match(/realisatie:([\w-]+)/)?.[1], t);
    noteer(g.video, n.match(/video:([^\s·]+)/)?.[1], t);
  }
  return g;
}

/** Plaatsen van deze week die al bestaan (marker "slot:2026-W41-di"). */
async function bestaandeSlots(db: Db, week: string): Promise<Set<string>> {
  const { data } = await db.from("social_posts").select("notes").like("notes", `%slot:${week}-%`).limit(50);
  const uit = new Set<string>();
  for (const r of (data as Array<{ notes: string | null }> | null) ?? []) {
    const s = r.notes?.match(new RegExp(`slot:${week}-(\\w+)`))?.[1];
    if (s) uit.add(s);
  }
  return uit;
}

/** Aantal linkberichten per kalendermaand ("2026-10"), vanaf vorige maand. */
async function linkBerichtenPerMaand(db: Db, vanaf: Date): Promise<Map<string, number>> {
  const { data, error } = await db
    .from("social_posts")
    .select("scheduled_for")
    .eq("link_post", true)
    .neq("status", "overgeslagen")
    .gte("scheduled_for", new Date(vanaf.getTime() - 40 * DAG_MS).toISOString())
    .limit(200);
  const m = new Map<string, number>();
  if (error) return m;
  for (const r of (data as Array<{ scheduled_for: string | null }> | null) ?? []) {
    if (!r.scheduled_for) continue;
    const d = brusselsDelen(new Date(r.scheduled_for));
    const k = `${d.jaar}-${String(d.maand).padStart(2, "0")}`;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** Maximaal aantal linkberichten per maand (Facebook telt links in berichten én reacties). */
export const LINK_BUDGET_PER_MAAND = 2;

const VIDEO_BUCKET = "social-media";
const VIDEO_MAP = "video";

/** Video's die klaarstaan in de bucket social-media/video (leeg zonder bucket). */
async function beschikbareVideos(db: Db): Promise<Array<{ naam: string; url: string }>> {
  try {
    const { data, error } = await db.storage.from(VIDEO_BUCKET).list(VIDEO_MAP, { limit: 100 });
    if (error || !data) return [];
    return data
      .filter((f) => /\.mp4$/i.test(f.name))
      .map((f) => ({
        naam: f.name,
        url: db.storage.from(VIDEO_BUCKET).getPublicUrl(`${VIDEO_MAP}/${f.name}`).data.publicUrl,
      }));
  } catch {
    return [];
  }
}

// =====================================================================
// Kiezen
// =====================================================================

function minstRecent<T>(items: T[], sleutel: (t: T) => string, gebruik: Map<string, number>, uitsluiten: Set<string> = new Set()): T | undefined {
  const pool = items.filter((t) => !uitsluiten.has(sleutel(t)));
  const lijst = pool.length ? pool : items;
  let best = Infinity;
  let top: T[] = [];
  for (const t of lijst) {
    const u = gebruik.get(sleutel(t)) ?? 0;
    if (u < best) {
      best = u;
      top = [t];
    } else if (u === best) top.push(t);
  }
  return top[Math.floor(Math.random() * top.length)];
}

// =====================================================================
// Een weekplan bouwen (zonder databank: puur)
// =====================================================================

export type Plaats = "feed" | "google" | "story" | "reel";

export const WEEK_SLOTS: ReadonlyArray<{ id: string; dagNaMaandag: number; uur: number; plaats: "feed" | "google" | "story"; taal?: "nl" | "fr"; label: string }> = [
  { id: "di", dagNaMaandag: 1, uur: 12, plaats: "feed", taal: "nl", label: "dinsdag 12:00 · NL-bericht" },
  { id: "wo", dagNaMaandag: 2, uur: 12, plaats: "google", taal: "nl", label: "woensdag 12:00 · Google Bedrijfsprofiel" },
  { id: "do", dagNaMaandag: 3, uur: 12, plaats: "feed", taal: "fr", label: "donderdag 12:00 · FR-bericht" },
  { id: "vr", dagNaMaandag: 4, uur: 12, plaats: "story", label: "vrijdag 12:00 · story of reel" },
];

/** Eén bericht zoals het in social_posts komt (met de kolommen van migratie 0050). */
export type SocialRij = {
  id: string;
  platform: string;
  post_kind: string;
  status: "concept" | "goedgekeurd";
  title: string;
  body: string | null;
  hashtags: string | null;
  target_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  scheduled_for: string;
  attachments_json: Array<{ type: string; src: string }>;
  notes: string;
  post_type: PostType;
  taal: Taal;
  goedkeuring_nodig: boolean;
  gekeurd_op: string | null;
  media: SocialMedia;
  kanalen: Kanaal[];
  publicatie: Record<string, unknown>;
  link_post: boolean;
  tekst_kort: string | null;
  /** Vaste plaats, bv. "2026-W41-di" (uniek in de databank: nooit dubbel). */
  slot: string;
};

export type WeekContext = {
  gebruik: Gebruik;
  bestaand: Set<string>;
  allesAutomatisch: boolean;
  /** Linkberichten al gepland per maand ("2026-10" → 1). */
  linkBudget: Map<string, number>;
  videos: Array<{ naam: string; url: string }>;
};

export type WeekPlan = {
  week: string;
  type: PostType;
  rijen: SocialRij[];
  overgeslagen: string[];
};

function bouwRij(a: {
  week: string;
  slot: (typeof WEEK_SLOTS)[number];
  plaats: Plaats;
  taal: "nl" | "fr";
  t: Template;
  ctx: TemplateCtx;
  moment: Date;
  allesAutomatisch: boolean;
  linkPost: boolean;
  video?: { naam: string; url: string };
  nu: Date;
}): SocialRij {
  const id = randomUUID();
  const v = nieuweVersie();
  const kaart = kaartVan(a.t, a.ctx);
  const beeld = a.t.beeld?.(a.ctx);
  const doel = `/${a.taal}${a.t.doel}`;

  let title: string;
  let body: string | null;
  let hashtags: string | null;
  let kort: string | null;
  let kanalen: Kanaal[];
  let platform: string;
  let post_kind: string;
  if (a.plaats === "google" && a.t.google) {
    const g = a.t.google(a.ctx);
    title = g.kop;
    body = g.body;
    hashtags = null;
    kort = null;
    kanalen = [...STANDAARD_KANALEN.google];
    platform = "google";
    post_kind = "page";
  } else {
    const tk = bouwTekst(a.t, a.taal, a.ctx);
    title = tk.kop;
    if (a.plaats === "story") {
      // Een story heeft geen bijschrift: de kop staat op het beeld.
      body = tk.kort;
      hashtags = null;
      kort = tk.kort;
      kanalen = [...STANDAARD_KANALEN.story];
      platform = "instagram";
      post_kind = "story";
    } else {
      body = tk.body;
      hashtags = tk.tags.slice(0, 5).join(" ");
      kort = tk.kort;
      kanalen = [...(a.plaats === "reel" ? STANDAARD_KANALEN.reel : STANDAARD_KANALEN.feed)];
      platform = a.plaats === "reel" ? "instagram" : "facebook";
      post_kind = a.plaats === "reel" ? "reel" : "page";
    }
  }

  const problemen = tekstProblemen({ title, body, tekst_kort: kort, hashtags });
  const verplicht = GOEDKEURING_VERPLICHT.includes(a.t.type);
  const nodig = problemen.length > 0 || (verplicht && !a.allesAutomatisch);

  const notes = [
    "auto-engine",
    `template:${a.t.id}`,
    `slot:${a.week}-${a.slot.id}`,
    `type:${a.t.type}`,
    `taal:${a.plaats === "google" ? "nl" : a.taal}`,
    `plaats:${a.plaats}`,
    `kaart:${kaart}`,
    beeld ? `beeld:${beeld}` : "",
    a.ctx.realisatie ? `realisatie:${a.ctx.realisatie.id}` : "",
    a.video ? `video:${a.video.naam}` : "",
    a.plaats === "story" || a.plaats === "reel" ? "format:story" : "",
    problemen.length ? `controle:${problemen.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id,
    platform,
    post_kind,
    status: nodig ? "concept" : "goedgekeurd",
    title,
    body,
    hashtags,
    target_url: doel,
    utm_source: platform,
    utm_medium: platform === "google" ? "gbp" : "social",
    utm_campaign: utmCampagne(a.week),
    scheduled_for: a.moment.toISOString(),
    attachments_json: beeld ? [{ type: "image", src: beeld }] : [],
    notes,
    post_type: a.t.type,
    taal: a.plaats === "google" ? "nl" : a.taal,
    goedkeuring_nodig: nodig,
    gekeurd_op: nodig ? null : a.nu.toISOString(),
    media: mediaVoor(id, v, {
      kaart,
      ...(beeld ? { beeld } : {}),
      ...(a.video ? { video: a.video.url } : {}),
      ...(a.t.dias ? { dias: a.t.dias[a.taal] } : {}),
    }),
    kanalen,
    publicatie: {},
    link_post: a.linkPost,
    tekst_kort: kort,
    slot: `${a.week}-${a.slot.id}`,
  };
}

/** Bouwt het plan van een week. Raakt de databank niet aan. */
export function bouwWeekPlan(week: string, c: WeekContext, nu = new Date()): WeekPlan {
  const w = parseWeek(week);
  if (!w) return { week, type: "tip", rijen: [], overgeslagen: [`onbekende week ${week}`] };
  const type = typeVoorWeek(w.week);
  const ma = maandagVan(week);
  const rijen: SocialRij[] = [];
  const overgeslagen: string[] = [];
  const gebruikt = new Set<string>();
  const linkBudget = new Map(c.linkBudget);

  const ctxVoor = (t: Template): TemplateCtx => {
    if (!t.realisatie) return {};
    const r = minstRecent(REALISATIE_IDS, (x) => x, c.gebruik.realisatie, gebruikt);
    if (r) {
      gebruikt.add(r);
      c.gebruik.realisatie.set(r, nu.getTime());
    }
    return { realisatie: realisatieKeuze(r) };
  };
  const kies = (lijst: Template[]): Template | undefined => {
    const t = minstRecent(lijst, (x) => x.id, c.gebruik.template, gebruikt);
    if (t) {
      // Een sjabloon met een realisatie mag twee keer per week (telkens een ander project).
      if (!t.realisatie) gebruikt.add(t.id);
      // Telt meteen als gebruikt, zodat de volgende plaats iets anders kiest.
      c.gebruik.template.set(t.id, nu.getTime());
    }
    return t;
  };

  for (const slot of WEEK_SLOTS) {
    if (c.bestaand.has(slot.id)) {
      overgeslagen.push(`${slot.label}: staat al gepland`);
      continue;
    }
    const dag = plusDagenDatum(ma, slot.dagNaMaandag);
    const moment = brusselsNaarUtc(dag.jaar, dag.maand, dag.dag, slot.uur, 0);
    if (moment.getTime() < nu.getTime() + 30 * 60_000) {
      overgeslagen.push(`${slot.label}: tijdstip is voorbij`);
      continue;
    }
    const maandKey = `${dag.jaar}-${String(dag.maand).padStart(2, "0")}`;

    if (slot.plaats === "feed") {
      const t = kies(templatesVanType(type)) ?? kies(templatesVanType("tip"));
      if (!t) continue;
      // Aanbod mag een linkbericht zijn, zolang het maandbudget het toelaat.
      const link = t.type === "aanbod" && (linkBudget.get(maandKey) ?? 0) < LINK_BUDGET_PER_MAAND;
      if (link) linkBudget.set(maandKey, (linkBudget.get(maandKey) ?? 0) + 1);
      rijen.push(
        bouwRij({ week, slot, plaats: "feed", taal: slot.taal ?? "nl", t, ctx: ctxVoor(t), moment, allesAutomatisch: c.allesAutomatisch, linkPost: link, nu }),
      );
    } else if (slot.plaats === "google") {
      const t = kies(TEMPLATES.filter((x) => x.google));
      if (!t) continue;
      rijen.push(bouwRij({ week, slot, plaats: "google", taal: "nl", t, ctx: ctxVoor(t), moment, allesAutomatisch: c.allesAutomatisch, linkPost: false, nu }));
    } else {
      const s = storyVoorWeek(w.week);
      // Even weken een reel als er een (nog niet recent gebruikte) video klaarstaat.
      const video =
        w.week % 2 === 0 && c.videos.length
          ? minstRecent(c.videos, (x) => x.naam, c.gebruik.video)
          : undefined;
      if (video) {
        const t = kies(templatesVanType("video"));
        if (t) {
          rijen.push(bouwRij({ week, slot, plaats: "reel", taal: s.taal, t, ctx: {}, moment, allesAutomatisch: c.allesAutomatisch, linkPost: false, video, nu }));
          continue;
        }
      }
      const t = kies(templatesVanType(s.type));
      if (!t) continue;
      rijen.push(bouwRij({ week, slot, plaats: "story", taal: s.taal, t, ctx: ctxVoor(t), moment, allesAutomatisch: c.allesAutomatisch, linkPost: false, nu }));
    }
  }
  return { week, type, rijen, overgeslagen };
}

// =====================================================================
// Goedkeurlinks (eenmalig, 7 dagen, gehasht bewaard)
// =====================================================================

export const GOEDKEUR_GELDIG_DAGEN = 7;

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isTokenVorm(t: unknown): t is string {
  return typeof t === "string" && /^[A-Za-z0-9_-]{43}$/.test(t);
}

export type GoedkeurLinks = { goedkeuren: string; overslaan: string };

/** Maakt per bericht twee eenmalige links. Leeg zonder migratie 0050. */
export async function maakGoedkeurLinks(db: Db, postIds: string[]): Promise<Map<string, GoedkeurLinks>> {
  const uit = new Map<string, GoedkeurLinks>();
  if (!postIds.length) return uit;
  const verloopt = new Date(Date.now() + GOEDKEUR_GELDIG_DAGEN * DAG_MS).toISOString();
  const rijen: Array<{ token_hash: string; post_id: string; actie: string; expires_at: string }> = [];
  for (const id of postIds) {
    const ja = randomBytes(32).toString("base64url");
    const nee = randomBytes(32).toString("base64url");
    rijen.push({ token_hash: hashToken(ja), post_id: id, actie: "goedkeuren", expires_at: verloopt });
    rijen.push({ token_hash: hashToken(nee), post_id: id, actie: "overslaan", expires_at: verloopt });
    uit.set(id, {
      goedkeuren: `${siteUrl}/api/social/keur?t=${ja}`,
      overslaan: `${siteUrl}/api/social/keur?t=${nee}`,
    });
  }
  const { error } = await db.from("goedkeur_tokens").insert(rijen);
  if (error) return new Map();
  // Oude, verlopen links opruimen.
  await db
    .from("goedkeur_tokens")
    .delete()
    .lt("expires_at", new Date(Date.now() - 30 * DAG_MS).toISOString());
  return uit;
}

// =====================================================================
// Week plannen (met databank)
// =====================================================================

/** Een bericht zoals het uit social_posts gelezen wordt (kolommen van 0050 optioneel). */
export type WeekBericht = {
  id: string;
  platform: string;
  post_kind: string | null;
  status: string;
  title: string;
  body: string | null;
  hashtags: string | null;
  target_url: string | null;
  utm_campaign: string | null;
  scheduled_for: string | null;
  updated_at?: string | null;
  notes: string | null;
  post_type?: string | null;
  taal?: string | null;
  goedkeuring_nodig?: boolean | null;
  media?: Partial<SocialMedia> | null;
  kanalen?: string[] | null;
  link_post?: boolean | null;
  tekst_kort?: string | null;
};

export type PlanResultaat = {
  week: string;
  type: PostType;
  migratie: MigratieStand;
  allesAutomatisch: boolean;
  /** Nieuw ingeplande berichten (bij dryRun: het voorstel). */
  nieuw: SocialRij[];
  /** Alle berichten van de week na het plannen (niet bij dryRun). */
  weekBerichten: WeekBericht[];
  links: Map<string, GoedkeurLinks>;
  overgeslagen: string[];
  fout?: string;
};

export async function leesWeekBerichten(db: Db, week: string): Promise<WeekBericht[]> {
  const { van, tot } = weekBereik(week);
  const { data } = await db
    .from("social_posts")
    .select("*")
    .gte("scheduled_for", van.toISOString())
    .lt("scheduled_for", tot.toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(100);
  return (data as WeekBericht[] | null) ?? [];
}

/**
 * Plant de lege plaatsen van een week. Zonder migratie 0050 gebeurt er niets
 * (dryRun geeft dan wel een voorstel). Nooit dubbel: bestaande plaatsen
 * (marker slot: in notes) worden overgeslagen, en de unieke index op de
 * kolom slot houdt twee gelijktijdige runs tegen.
 */
export async function planWeek(opts: { week?: string; dryRun?: boolean; nu?: Date } = {}): Promise<PlanResultaat> {
  const nu = opts.nu ?? new Date();
  const week = opts.week && parseWeek(opts.week) ? opts.week : huidigeWeek(nu);
  const db = getSupabaseAdmin();
  const [migratie, allesAutomatisch, gebruik, bestaand, videos] = await Promise.all([
    socialMigratie(db),
    leesAllesAutomatisch(db),
    leesGebruik(db),
    bestaandeSlots(db, week),
    beschikbareVideos(db),
  ]);
  const linkBudget = migratie.kolommen ? await linkBerichtenPerMaand(db, nu) : new Map<string, number>();
  const plan = bouwWeekPlan(week, { gebruik, bestaand, allesAutomatisch, linkBudget, videos }, nu);
  const basis = { week, type: plan.type, migratie, allesAutomatisch, overgeslagen: plan.overgeslagen };

  if (opts.dryRun) return { ...basis, nieuw: plan.rijen, weekBerichten: [], links: new Map() };
  if (!migratie.kolommen) {
    return { ...basis, nieuw: [], weekBerichten: [], links: new Map(), fout: "Migratie 0050 is nog niet gedraaid: er wordt niets gepland." };
  }
  // De unieke index op slot is de grendel: lopen de cron en de knop tegelijk,
  // dan slaat de tweede de plaatsen die de eerste al vulde stil over.
  let nieuw: SocialRij[] = [];
  if (plan.rijen.length) {
    const { data, error } = await db
      .from("social_posts")
      .upsert(plan.rijen, { onConflict: "slot", ignoreDuplicates: true })
      .select("id");
    if (error) return { ...basis, nieuw: [], weekBerichten: [], links: new Map(), fout: `Databank: ${error.message}` };
    const ingevoegd = new Set(((data as Array<{ id: string }> | null) ?? []).map((r) => r.id));
    nieuw = plan.rijen.filter((r) => ingevoegd.has(r.id));
  }
  const weekBerichten = await leesWeekBerichten(db, week);
  const wachtend = weekBerichten.filter((b) => b.status === "concept" && b.goedkeuring_nodig).map((b) => b.id);
  const links = migratie.tokens && nieuw.length ? await maakGoedkeurLinks(db, wachtend) : new Map<string, GoedkeurLinks>();
  return { ...basis, nieuw, weekBerichten, links };
}
