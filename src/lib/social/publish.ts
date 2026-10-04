// De publisher: zet goedgekeurde social-berichten op elk verbonden kanaal.
//
// Afspraak met de contentmachine (social-generator.ts): enkel rijen met
// status = 'goedgekeurd' en scheduled_for <= nu, en enkel als migratie 0050
// gedraaid is. Nooit de oude status 'klaar'.
//
// Werking per bericht:
//   1. Grendel: één voorwaardelijke UPDATE goedgekeurd → gepland (met een
//      eigen sleutel in publicatie._slot). Wie de rij niet krijgt, doet niets:
//      twee runs tegelijk publiceren nooit hetzelfde bericht.
//   2. Plan per kanaal (planBericht): welk beeld, welke tekst, of het kanaal
//      overgeslagen wordt en waarom (geen video, enkel NL, uitgezet, …).
//   3. Beelden bevriezen: de JPEG's van /beeld/social/... gaan als vaste kopie
//      naar de publieke bucket social-media. Zonder bucket: het absolute adres
//      op https://www.studio-vm.be.
//   4. Per kanaal: eerst "bezig" wegschrijven, dan publiceren, dan het
//      resultaat wegschrijven. Een kanaal dat al verzonden of gepubliceerd is,
//      wordt nooit opnieuw verstuurd. Bleef iets "bezig" hangen (de functie
//      viel weg) of was een fout onzeker (time-out), dan kijken we eerst in
//      Buffer na of het bericht er al staat, pas daarna opnieuw.
//   5. Eindstatus: gepubliceerd (minstens één kanaal), mislukt (geen enkel
//      kanaal lukte) of overgeslagen (geen enkel kanaal kon). Wacht Buffer nog
//      op het netwerk, dan blijft het bericht 'gepland' tot de volgende run
//      het bevestigt.
//
// Facebook-linklimiet: hoogstens LINK_BUDGET_PER_MAAND linkberichten per
// kalendermaand (Belgische tijd), geteld in de databank op het moment van
// publiceren. Daarna gaat een linkbericht als gewoon beeldbericht uit. Er
// staat nooit een URL in de tekst; de link van een linkbericht is een
// linkkaart (Facebook), een pin-link (Pinterest) of de knop van een
// Google-bericht.
//
// Alles staat uit zolang BUFFER_API_KEY ontbreekt of migratie 0050 niet
// gedraaid is: dan wordt er niets gelezen bij Buffer en niets geschreven.

import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SITE_ADRES } from "@/lib/utm";
import { socialBeeldPad, type SocialFormaat } from "@/lib/social/beeld-url";
import {
  LINK_BUDGET_PER_MAAND,
  brusselsDelen,
  brusselsNaarUtc,
  socialMigratie,
  socialUtmLink,
  type SocialMedia,
} from "@/lib/admin/social-generator";
import { KANAAL_LABEL, KANALEN, isKanaal, tekstProblemen, type Kanaal } from "@/lib/admin/social-templates";
import { buildPublicatieMeldingMail, type PublicatieFout } from "@/lib/admin/social-mail";
import { maakBufferDienst } from "./adapters/buffer";

// =====================================================================
// Adapters: de afspraak met elke publicatiedienst
// =====================================================================

export type PublicatieSoort = "bericht" | "story" | "reel" | "google";

/** Wat een dienst nodig heeft om één bericht op één kanaal te zetten. */
export type PublicatieBericht = {
  postId: string;
  soort: PublicatieSoort;
  /** Zonder URL. */
  tekst: string;
  /** Kop (YouTube-titel, pintitel, titel van de linkkaart). */
  titel: string;
  /** Publieke JPEG-adressen, in volgorde (carrousel: omslag + dia's). */
  beelden: Array<{ url: string; alt: string }>;
  /** Publieke mp4 (reel, Short, TikTok). */
  video: string | null;
  /** Linkkaart van een Facebook-linkbericht (gaat niet samen met beelden). */
  link: { url: string; titel: string; beschrijving: string; beeld: string } | null;
  /** Bestemming van een pin of de knop van een Google-bericht (met UTM). */
  doelLink: string | null;
};

export type PublicatieKanaal = { id: string; dienst: Kanaal; naam: string; bord?: string | null };

export type PublicatieUitkomst = {
  ok: boolean;
  url: string | null;
  id: string | null;
  error: string | null;
  /** Aanvaard, maar het netwerk heeft het nog niet bevestigd. */
  verzonden?: boolean;
  /** Later opnieuw proberen. */
  tijdelijk?: boolean;
  /** Misschien toch aangemaakt (time-out): eerst nakijken, dan pas opnieuw. */
  onzeker?: boolean;
  /** Hele run stoppen: sleutel geweigerd of limiet bereikt. */
  stop?: "sleutel" | "limiet";
  retryNa?: number | null;
};

/** publish(post, channel) → { ok, url, id, error } */
export interface PublicatieAdapter {
  naam: string;
  publish(post: PublicatieBericht, channel: PublicatieKanaal): Promise<PublicatieUitkomst>;
}

export type Venster = { over: number; quota: number | null; resetS: number | null };
/** Wat er over is per venster (RateLimit-koppen van Buffer). */
export type Verzoeken = { op: string; kwartier?: Venster; dag?: Venster; maand?: Venster };

/** Een kanaal zoals de dienst het teruggeeft. */
export type GevondenKanaal = {
  id: string;
  dienst: Kanaal;
  service: string;
  naam: string;
  weergave: string | null;
  soort: string | null;
  link: string | null;
  avatar: string | null;
  ontkoppeld: boolean;
  vergrendeld: boolean;
  gepauzeerd: boolean;
  borden: Array<{ id: string; naam: string }>;
};

export type Verbindingstest = {
  ok: boolean;
  sleutelFout?: boolean;
  limiet?: boolean;
  fout?: string;
  waarschuwing?: string;
  retryNa?: number | null;
  organisatie?: { id: string; naam: string; maxKanalen: number | null };
  organisaties?: number;
  kanalen?: GevondenKanaal[];
  ongebruikt?: Array<{ service: string; naam: string }>;
  verzoeken?: Verzoeken | null;
};

export type RecentPost = {
  id: string;
  kanaalId: string;
  status: "gepubliceerd" | "mislukt" | "verzonden";
  tekst: string;
  url: string | null;
  fout: string | null;
  op: string | null;
};

export type RecentAntwoord = { ok: boolean; stop?: "sleutel" | "limiet"; posts: RecentPost[]; fout?: string };

/** Een volledige dienst (Buffer): publiceren, kanalen ontdekken, nakijken. */
export interface PublicatieDienst extends PublicatieAdapter {
  test(): Promise<Verbindingstest>;
  recent(organisatieId: string, kanaalIds: string[], sinds: Date): Promise<RecentAntwoord>;
  verzoeken(): Verzoeken | null;
}

// =====================================================================
// Kanalen: wat elk netwerk krijgt
// =====================================================================

export type KanaalRegel = {
  /** Beeldformaat voor een gewoon bericht; null = enkel video. */
  beeld: SocialFormaat | null;
  tekst: "volledig" | "kort";
  maxTekens: number;
  maxBeelden: number;
  video: "nodig" | "kan" | "nee";
  story: boolean;
  uitleg: string;
};

/** Per netwerk (limieten uit developers.buffer.com/guides/character-limits). */
export const KANAAL_REGELS: Record<Kanaal, KanaalRegel> = {
  facebook: { beeld: "portrait", tekst: "volledig", maxTekens: 5000, maxBeelden: 10, video: "kan", story: true, uitleg: "Staand beeld · volledige tekst · ook story en reel" },
  instagram: { beeld: "portrait", tekst: "volledig", maxTekens: 2196, maxBeelden: 10, video: "kan", story: true, uitleg: "Staand beeld · volledige tekst · ook story en reel" },
  google: { beeld: "gbp", tekst: "volledig", maxTekens: 1500, maxBeelden: 1, video: "nee", story: false, uitleg: "Beeld 1200×900 · tekst zonder hashtags · knop Meer info" },
  youtube: { beeld: null, tekst: "volledig", maxTekens: 5000, maxBeelden: 0, video: "nodig", story: false, uitleg: "Enkel berichten met een video (Short)" },
  tiktok: { beeld: null, tekst: "volledig", maxTekens: 2200, maxBeelden: 0, video: "nodig", story: false, uitleg: "Enkel berichten met een video" },
  pinterest: { beeld: "portrait", tekst: "volledig", maxTekens: 500, maxBeelden: 1, video: "nee", story: false, uitleg: "Staand beeld · pin met link naar de site" },
  x: { beeld: "square", tekst: "kort", maxTekens: 280, maxBeelden: 4, video: "kan", story: false, uitleg: "Vierkant beeld · korte tekst (280 tekens)" },
  threads: { beeld: "portrait", tekst: "volledig", maxTekens: 500, maxBeelden: 10, video: "kan", story: false, uitleg: "Staand beeld · tekst tot 500 tekens" },
  bluesky: { beeld: "square", tekst: "kort", maxTekens: 300, maxBeelden: 4, video: "kan", story: false, uitleg: "Vierkant beeld · korte tekst (300 tekens)" },
};

/** Een kanaal met de instellingen van de eigenaar (bewaard in app_settings). */
export type SocialKanaal = GevondenKanaal & {
  aan: boolean;
  /** Enkel Nederlandstalige berichten (FR en andere talen worden overgeslagen). */
  alleenNl: boolean;
  /** Pinterest: serviceId van het bord. */
  bord: string | null;
  /** Laatst gezien bij een ontdekking. */
  gezien: string;
  /** Niet meer gevonden bij de laatste ontdekking. */
  weg: boolean;
};

export type KanalenStand = {
  bijgewerkt: string | null;
  organisatie: { id: string; naam: string; maxKanalen: number | null } | null;
  kanalen: SocialKanaal[];
  /** Verbonden in Buffer, maar niet gebruikt (Mastodon, …). LinkedIn staat hier nooit. */
  ongebruikt: Array<{ service: string; naam: string }>;
};

export type PublisherStand = {
  sleutel?: { op: string; ok: boolean; fout?: string | null; waarschuwing?: string | null };
  verzoeken?: Verzoeken | null;
  laatsteRun?: { op: string; tekst: string };
  alertMail?: string;
  /** Fouten die nog niet gemaild zijn (hoogstens één mail per dag). */
  uitgesteld?: PublicatieFout[];
};

export const KANALEN_SLEUTEL = "social_kanalen";
export const PUBLISHER_SLEUTEL = "social_publisher";
export const BUCKET = "social-media";

const MIN = 60_000;
const UUR = 60 * MIN;
const DAG = 24 * UUR;
/** Later dan dit na het tijdstip (of na het akkoord) gaat een bericht niet meer uit. */
export const TE_LAAT_UUR = 48;
const MAX_POGINGEN = 3;
const SLOT_VERLOOPT = 20 * MIN;
const BEVESTIGING_UUR = 24;
const WEKELIJKSE_CHECK = 7 * DAG;

export const LEGE_KANALEN: KanalenStand = { bijgewerkt: null, organisatie: null, kanalen: [], ongebruikt: [] };

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function leesKanalenStand(json: string | null | undefined): KanalenStand {
  if (!json) return { ...LEGE_KANALEN, kanalen: [] };
  try {
    const o = JSON.parse(json) as unknown;
    if (!isObj(o)) return { ...LEGE_KANALEN, kanalen: [] };
    const kanalen = (Array.isArray(o.kanalen) ? o.kanalen : [])
      .filter((k): k is SocialKanaal => isObj(k) && typeof k.id === "string" && isKanaal(k.dienst))
      .map((k) => ({
        ...k,
        aan: k.aan !== false,
        alleenNl: k.alleenNl === true,
        bord: typeof k.bord === "string" ? k.bord : null,
        borden: Array.isArray(k.borden) ? k.borden : [],
        weg: k.weg === true,
      }));
    return {
      bijgewerkt: typeof o.bijgewerkt === "string" ? o.bijgewerkt : null,
      organisatie: isObj(o.organisatie) && typeof o.organisatie.id === "string" ? (o.organisatie as KanalenStand["organisatie"]) : null,
      kanalen,
      ongebruikt: Array.isArray(o.ongebruikt) ? (o.ongebruikt as KanalenStand["ongebruikt"]) : [],
    };
  } catch {
    return { ...LEGE_KANALEN, kanalen: [] };
  }
}

export function leesPublisherStand(json: string | null | undefined): PublisherStand {
  if (!json) return {};
  try {
    const o = JSON.parse(json) as unknown;
    return isObj(o) ? (o as PublisherStand) : {};
  } catch {
    return {};
  }
}

/**
 * Nieuwe ontdekking samenvoegen met wat er was: instellingen per kanaal
 * blijven, nieuwe kanalen staan meteen aan (alles automatisch), verdwenen
 * kanalen blijven 30 dagen zichtbaar als "weg" en krijgen niets meer.
 */
export function voegKanalenSamen(oud: KanalenStand, t: Verbindingstest, nu = new Date()): KanalenStand {
  const vorige = new Map(oud.kanalen.map((k) => [k.id, k]));
  const gevonden = t.kanalen ?? [];
  const ids = new Set(gevonden.map((k) => k.id));
  const kanalen: SocialKanaal[] = gevonden.map((g) => {
    const v = vorige.get(g.id);
    const bord = v?.bord && g.borden.some((b) => b.id === v.bord) ? v.bord : (g.borden[0]?.id ?? null);
    return { ...g, aan: v ? v.aan : true, alleenNl: v?.alleenNl ?? false, bord, gezien: nu.toISOString(), weg: false };
  });
  for (const v of oud.kanalen) {
    if (!ids.has(v.id) && nu.getTime() - (Date.parse(v.gezien) || 0) < 30 * DAG) kanalen.push({ ...v, weg: true });
  }
  kanalen.sort((a, b) => KANALEN.indexOf(a.dienst) - KANALEN.indexOf(b.dienst) || Number(a.weg) - Number(b.weg));
  return {
    bijgewerkt: nu.toISOString(),
    organisatie: t.organisatie ?? oud.organisatie,
    kanalen,
    ongebruikt: t.ongebruikt ?? [],
  };
}

// =====================================================================
// Berichten
// =====================================================================

/** Bevroren kopieën in de bucket social-media, per beeldsleutel. */
export type PubliekeMedia = { v: string; beelden: Record<string, string>; op: string };

/** Een rij uit social_posts zoals de publisher ze leest (kolommen van 0050). */
export type PostRij = {
  id: string;
  status: string;
  title: string;
  body: string | null;
  hashtags: string | null;
  tekst_kort?: string | null;
  taal?: string | null;
  platform: string;
  post_kind: string | null;
  post_type?: string | null;
  kanalen?: string[] | null;
  media?: (Partial<SocialMedia> & { publiek?: PubliekeMedia }) | null;
  publicatie?: unknown;
  link_post?: boolean | null;
  target_url: string | null;
  utm_campaign: string | null;
  utm_source?: string | null;
  scheduled_for: string | null;
  gekeurd_op?: string | null;
  updated_at?: string | null;
  notes?: string | null;
};

export type KanaalStatus = "bezig" | "verzonden" | "gepubliceerd" | "mislukt" | "overgeslagen" | "opnieuw";

/** Resultaat van één kanaal in social_posts.publicatie. */
export type KanaalPublicatie = {
  status: KanaalStatus;
  kanaal: Kanaal;
  via?: string;
  kanaalId?: string | null;
  naam?: string | null;
  id?: string | null;
  url?: string | null;
  fout?: string | null;
  reden?: string | null;
  op: string;
  pogingen?: number;
  /** Fout of time-out waarbij het bericht misschien toch aangemaakt werd. */
  onzeker?: boolean;
  /** Ging uit als Facebook-linkbericht (telt voor de maandlimiet). */
  link?: boolean;
  beeld?: string | null;
  /** Begin van de verstuurde tekst (om na te kijken in Buffer). */
  tekst?: string | null;
};

export type PublicatieData = {
  kanalen: Record<string, KanaalPublicatie>;
  slot: { token: string; op: string } | null;
  doel: string[] | null;
  reden: string | null;
};

export function leesPublicatie(v: unknown): PublicatieData {
  const o = isObj(v) ? v : {};
  const kanalen: Record<string, KanaalPublicatie> = {};
  for (const [k, x] of Object.entries(o)) {
    if (k.startsWith("_") || !isObj(x) || typeof x.status !== "string") continue;
    const kanaal = isKanaal(x.kanaal) ? x.kanaal : (k.split(":")[0] as Kanaal);
    kanalen[k] = { ...(x as KanaalPublicatie), kanaal };
  }
  const slot = isObj(o._slot) && typeof o._slot.token === "string" && typeof o._slot.op === "string" ? { token: o._slot.token, op: o._slot.op } : null;
  const doel = Array.isArray(o._doel) ? o._doel.filter((x): x is string => typeof x === "string") : null;
  return { kanalen, slot, doel, reden: typeof o._reden === "string" ? o._reden : null };
}

export function schrijfPublicatie(p: PublicatieData): Record<string, unknown> {
  return {
    ...p.kanalen,
    ...(p.slot ? { _slot: p.slot } : {}),
    ...(p.doel ? { _doel: p.doel } : {}),
    ...(p.reden ? { _reden: p.reden } : {}),
  };
}

export function soortVan(p: Pick<PostRij, "post_kind" | "platform">): PublicatieSoort {
  if (p.post_kind === "reel") return "reel";
  if (p.post_kind === "story") return "story";
  if (p.platform === "google" || p.platform === "algemeen") return "google";
  return "bericht";
}

/** Doelkanalen van een bericht (kolom kanalen, anders het oude platform). */
export function doelKanalen(p: Pick<PostRij, "kanalen" | "platform">): Kanaal[] {
  const k = Array.isArray(p.kanalen) ? p.kanalen.filter(isKanaal) : [];
  if (k.length) return [...new Set(k)];
  if (p.platform === "algemeen") return ["google"];
  return isKanaal(p.platform) ? [p.platform] : [];
}

export function versieVan(p: Pick<PostRij, "media" | "updated_at">): string {
  return p.media?.v || (p.updated_at ? (Date.parse(p.updated_at) || 0).toString(36) : "0");
}

/** "portrait", "square", … of een dia: "portrait-2". */
export type BeeldSleutel = string;

/** Relatief pad van een beeld (zelfde route als de admin en de mail). */
export function beeldPad(postId: string, sleutel: BeeldSleutel, v: string): string {
  const m = sleutel.match(/^([a-z]+)-(\d{1,2})$/);
  if (m) {
    const f = m[1] as SocialFormaat;
    return socialBeeldPad(postId, f, v).replace(`/${f}.jpg`, `/${sleutel}.jpg`);
  }
  return socialBeeldPad(postId, sleutel as SocialFormaat, v);
}

function diaAantal(p: PostRij): number {
  const d = p.media?.dias;
  return Array.isArray(d) ? Math.min(d.length, 10) : 0;
}

// ---------- Tekst ----------

const SEGMENTEERDER = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("nl", { granularity: "grapheme" }) : null;

/** Lengte zoals het netwerk telt (Buffer: UTF-16; Bluesky: tekens; Instagram: regeleinde = 2). */
export function telTekens(dienst: Kanaal, s: string): number {
  if (dienst === "bluesky") return SEGMENTEERDER ? [...SEGMENTEERDER.segment(s)].length : [...s].length;
  if (dienst === "instagram") return s.length + (s.match(/\n/g)?.length ?? 0);
  return s.length;
}

/** Inkorten op een woordgrens, met "…". */
export function knip(s: string, max: number, tel: (x: string) => number = (x) => x.length): string {
  const t = s.trim();
  if (tel(t) <= max) return t;
  const woorden = t.split(/(\s+)/);
  while (woorden.length > 1) {
    woorden.pop();
    const kandidaat = `${woorden.join("").trimEnd().replace(/[,;:·–-]$/, "")}…`;
    if (tel(kandidaat) <= max) return kandidaat;
  }
  let r = t;
  while (r.length && tel(`${r}…`) > max) r = r.slice(0, -1);
  return `${r}…`;
}

function zonderHashtags(s: string): string {
  return s
    .replace(/(^|\s)#[\p{L}\p{N}_]+/gu, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function tagsVan(p: PostRij, body: string): string[] {
  const inBody = new Set((body.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((t) => t.toLowerCase()));
  const uit: string[] = [];
  for (const t of (p.hashtags ?? "").split(/[\s,]+/)) {
    const tag = t.trim();
    if (!/^#[\p{L}\p{N}_]+$/u.test(tag) || inBody.has(tag.toLowerCase()) || uit.includes(tag)) continue;
    uit.push(tag);
  }
  return uit.slice(0, 5);
}

/** Korte tekst: tekst_kort, anders het begin van het bijschrift. */
function korteTekst(p: PostRij): string {
  const k = (p.tekst_kort ?? "").trim();
  if (k) return k;
  const body = zonderHashtags(p.body ?? "").replace(/\s+/g, " ");
  return knip(body || p.title, 200);
}

/** De tekst die één netwerk krijgt (nooit met URL; die staat er al niet in). */
export function tekstVoor(p: PostRij, dienst: Kanaal, soort: PublicatieSoort): string {
  const regel = KANAAL_REGELS[dienst];
  const tel = (s: string) => telTekens(dienst, s);
  const body = (p.body ?? "").replace(/\r\n/g, "\n").trim();
  if (soort === "google" || dienst === "google") return knip(zonderHashtags(body || p.title), regel.maxTekens, tel);
  if (soort === "story") return knip(korteTekst(p) || p.title, regel.maxTekens, tel);
  const tags = tagsVan(p, body);
  const kort = korteTekst(p);
  const opties: string[] = [];
  if (regel.tekst === "volledig" && body) {
    opties.push(tags.length ? `${body}\n\n${tags.join(" ")}` : body, body);
  }
  for (let n = tags.length; n >= 0; n--) opties.push(n ? `${kort} ${tags.slice(0, n).join(" ")}` : kort);
  for (const t of opties) if (t && tel(t) <= regel.maxTekens) return t;
  return knip(kort || body || p.title, regel.maxTekens, tel);
}

// ---------- Plan per kanaal ----------

export type KanaalPlan =
  | {
      sleutel: string;
      dienst: Kanaal;
      kanaal: SocialKanaal;
      actie: "publiceer";
      bericht: PublicatieBericht;
      /** Beelden die bevroren moeten worden (ook de linkkaart). */
      beelden: BeeldSleutel[];
      link: boolean;
      /** Linkbericht gevraagd, maar het maandbudget is op. */
      linkBudgetOp: boolean;
      omschrijving: string;
    }
  | { sleutel: string; dienst: Kanaal; kanaal: SocialKanaal | null; actie: "overslaan"; reden: string };

const FORMAAT_KORT: Record<string, string> = {
  portrait: "staand beeld",
  square: "vierkant beeld",
  story: "storybeeld",
  gbp: "beeld 1200×900",
  og: "linkkaart",
};

/** Waarom dit kanaal dit bericht niet krijgt (null = het krijgt het wel). */
export function waaromNiet(p: PostRij, soort: PublicatieSoort, k: SocialKanaal): string | null {
  const regel = KANAAL_REGELS[k.dienst];
  const video = p.media?.video;
  if (k.weg) return "niet meer verbonden in Buffer";
  if (!k.aan) return "uitgezet bij Kanalen";
  if (k.ontkoppeld) return "verbinding verbroken in Buffer: opnieuw verbinden";
  if (k.vergrendeld) return "vergrendeld in Buffer (meer kanalen dan het plan toelaat)";
  if (k.gepauzeerd) return "wachtrij staat op pauze in Buffer";
  if ((p.taal ?? "nl") !== "nl" && k.alleenNl) return "krijgt enkel Nederlandstalige berichten";
  if (k.dienst === "google" && soort !== "google") return "krijgt enkel de Google-berichten";
  if (soort === "google" && k.dienst !== "google") return "een Google-bericht gaat enkel naar Google";
  if (soort === "story" && !regel.story) return "kent geen stories";
  if (soort === "reel") {
    if (regel.video === "nee") return "kent geen video";
    if (!video) return "geen video bij dit bericht";
  }
  if (regel.video === "nodig" && !video) return "vraagt een video (dit bericht heeft enkel een beeld)";
  if (k.dienst === "pinterest" && !(k.bord ?? k.borden[0]?.id)) return "geen Pinterest-bord gekozen";
  return null;
}

export type PlanContext = {
  /** Mag dit bericht nog een Facebook-link gebruiken (maandbudget)? */
  linkVrij: boolean;
  /** Publiek adres van een beeld (bevroren kopie of het adres op de site). */
  beeldUrl: (sleutel: BeeldSleutel) => string;
};

/** Plan per kanaal voor één bericht. Puur: raakt databank noch netwerk aan. */
export function planBericht(p: PostRij, kanalen: SocialKanaal[], c: PlanContext): KanaalPlan[] {
  const soort = soortVan(p);
  const uit: KanaalPlan[] = [];
  for (const dienst of doelKanalen(p)) {
    const kandidaten = kanalen.filter((k) => k.dienst === dienst && !k.weg);
    if (!kandidaten.length) {
      uit.push({ sleutel: dienst, dienst, kanaal: null, actie: "overslaan", reden: "niet verbonden in Buffer" });
      continue;
    }
    for (const k of kandidaten) {
      const sleutel = kandidaten.length > 1 ? `${dienst}:${k.id}` : dienst;
      const reden = waaromNiet(p, soort, k);
      if (reden) {
        uit.push({ sleutel, dienst, kanaal: k, actie: "overslaan", reden });
        continue;
      }
      const regel = KANAAL_REGELS[dienst];
      const video = p.media?.video ?? null;
      const metVideo = soort === "reel" || regel.video === "nodig";
      const linkGevraagd = dienst === "facebook" && soort === "bericht" && !!p.link_post;
      const link = linkGevraagd && c.linkVrij;
      let beelden: BeeldSleutel[] = [];
      if (soort === "google") beelden = ["gbp"];
      else if (soort === "story") beelden = ["story"];
      else if (metVideo) beelden = [];
      else if (link) beelden = ["og"];
      else if (regel.beeld) {
        const extra = Math.max(0, Math.min(diaAantal(p), regel.maxBeelden - 1));
        beelden = [regel.beeld, ...Array.from({ length: extra }, (_, i) => `${regel.beeld}-${i + 1}`)];
      }
      const tekst = tekstVoor(p, dienst, soort);
      const kort = korteTekst(p);
      const bericht: PublicatieBericht = {
        postId: p.id,
        soort,
        tekst,
        titel: p.title,
        beelden: link ? [] : beelden.map((s) => ({ url: c.beeldUrl(s), alt: p.title })),
        video: metVideo ? video : null,
        link: link
          ? { url: socialUtmLink(p, "facebook"), titel: p.title, beschrijving: knip(kort, 200), beeld: c.beeldUrl("og") }
          : null,
        doelLink: dienst === "pinterest" || dienst === "google" ? socialUtmLink(p, dienst) : null,
      };
      const beeldTekst = metVideo
        ? soort === "reel"
          ? "video (reel)"
          : "video"
        : link
          ? "linkbericht met kaart 1200×630"
          : `${FORMAAT_KORT[beelden[0] ?? ""] ?? "zonder beeld"}${beelden.length > 1 ? ` + ${beelden.length - 1} dia's` : ""}`;
      uit.push({
        sleutel,
        dienst,
        kanaal: k,
        actie: "publiceer",
        bericht,
        beelden,
        link,
        linkBudgetOp: linkGevraagd && !link,
        omschrijving: `${beeldTekst} · ${telTekens(dienst, tekst)} tekens${linkGevraagd && !link ? " · linkbudget op: zonder link" : ""}`,
      });
    }
  }
  return uit;
}

/** Eindstatus van een bericht, of null zolang een kanaal nog niet af is. */
export function eindStatus(p: PublicatieData): "gepubliceerd" | "mislukt" | "overgeslagen" | null {
  const sleutels = p.doel ?? Object.keys(p.kanalen);
  if (!sleutels.length) return "overgeslagen";
  const e = sleutels.map((k) => p.kanalen[k]);
  if (e.some((x) => !x || x.status === "bezig" || x.status === "opnieuw" || x.status === "verzonden")) return null;
  if (e.some((x) => x!.status === "gepubliceerd")) return "gepubliceerd";
  if (e.some((x) => x!.status === "mislukt")) return "mislukt";
  return "overgeslagen";
}

function eersteUrl(p: PublicatieData): string | null {
  const volgorde = [...KANALEN];
  const lijst = Object.values(p.kanalen)
    .filter((x) => x.url)
    .sort((a, b) => volgorde.indexOf(a.kanaal) - volgorde.indexOf(b.kanaal));
  return lijst[0]?.url ?? null;
}

// ---------- Linkbudget ----------

/** Begin van de huidige kalendermaand in België, als UTC-moment. */
export function maandBegin(nu: Date): Date {
  const d = brusselsDelen(nu);
  return brusselsNaarUtc(d.jaar, d.maand, 1);
}

/** Facebook-linkberichten die deze maand al uitgingen (uit publicatie). */
export function telLinkberichten(rijen: Array<{ id: string; publicatie: unknown }>, nu: Date, behalve?: string): number {
  const van = maandBegin(nu).getTime();
  let n = 0;
  for (const r of rijen) {
    if (r.id === behalve) continue;
    const p = leesPublicatie(r.publicatie);
    for (const e of Object.values(p.kanalen)) {
      if (e.kanaal !== "facebook" || !e.link) continue;
      if (e.status !== "verzonden" && e.status !== "gepubliceerd") continue;
      if ((Date.parse(e.op) || 0) >= van) n++;
    }
  }
  return n;
}

// =====================================================================
// Opslag (databank + bucket), los zodat de logica getest kan worden
// =====================================================================

export type UploadUitkomst = { ok: true; url: string } | { ok: false; bucketOntbreekt: boolean; fout: string };

export type PublicatieOpslag = {
  migratieOk(): Promise<boolean>;
  /** status goedgekeurd, scheduled_for <= tot, oudste eerst. */
  leesKlaar(totIso: string, max: number): Promise<PostRij[]>;
  /** status goedgekeurd, van < scheduled_for <= tot. */
  leesOpkomend(vanIso: string, totIso: string, max: number): Promise<PostRij[]>;
  leesGepland(max: number): Promise<PostRij[]>;
  /** goedgekeurd → gepland, enkel als de rij nog goedgekeurd is. */
  claim(id: string, publicatie: Record<string, unknown>): Promise<PostRij | null>;
  /** Enkel zolang de rij 'gepland' is en onze sleutel draagt. */
  bewaar(id: string, token: string, patch: Record<string, unknown>): Promise<boolean>;
  /** Status van een rij die nog een van `van` heeft. */
  zetStatus(id: string, van: string[], patch: Record<string, unknown>): Promise<boolean>;
  linkRijen(vanafIso: string): Promise<Array<{ id: string; publicatie: unknown }>>;
  leesInstelling(sleutel: string): Promise<string | null>;
  bewaarInstelling(sleutel: string, waarde: string): Promise<void>;
  /** media vervangen, enkel als media.v nog `v` is. */
  bewaarMedia(id: string, v: string | null, media: Record<string, unknown>): Promise<boolean>;
  upload(pad: string, bytes: Uint8Array): Promise<UploadUitkomst>;
};

type Db = ReturnType<typeof getSupabaseAdmin>;

export function supabaseOpslag(db: Db = getSupabaseAdmin()): PublicatieOpslag {
  const posts = () => db.from("social_posts");
  const lijst = (data: unknown, error: unknown) => (error ? [] : ((data as PostRij[] | null) ?? []));
  return {
    async migratieOk() {
      return (await socialMigratie(db)).kolommen;
    },
    async leesKlaar(tot, max) {
      const { data, error } = await posts()
        .select("*")
        .eq("status", "goedgekeurd")
        .not("scheduled_for", "is", null)
        .lte("scheduled_for", tot)
        .order("scheduled_for", { ascending: true })
        .limit(max);
      return lijst(data, error);
    },
    async leesOpkomend(van, tot, max) {
      const { data, error } = await posts()
        .select("*")
        .eq("status", "goedgekeurd")
        .gt("scheduled_for", van)
        .lte("scheduled_for", tot)
        .order("scheduled_for", { ascending: true })
        .limit(max);
      return lijst(data, error);
    },
    async leesGepland(max) {
      const { data, error } = await posts().select("*").eq("status", "gepland").order("scheduled_for", { ascending: true }).limit(max);
      return lijst(data, error);
    },
    async claim(id, publicatie) {
      const { data, error } = await posts()
        .update({ status: "gepland", publicatie })
        .eq("id", id)
        .eq("status", "goedgekeurd")
        .select("*")
        .maybeSingle();
      return error ? null : ((data as PostRij | null) ?? null);
    },
    async bewaar(id, token, patch) {
      const { data, error } = await posts()
        .update(patch)
        .eq("id", id)
        .eq("status", "gepland")
        .eq("publicatie->_slot->>token", token)
        .select("id")
        .maybeSingle();
      if (error) console.error("[social-publish] bewaren mislukt:", error.message);
      return !error && !!data;
    },
    async zetStatus(id, van, patch) {
      const { data, error } = await posts().update(patch).eq("id", id).in("status", van).select("id").maybeSingle();
      return !error && !!data;
    },
    async linkRijen(vanaf) {
      const { data, error } = await posts()
        .select("id, publicatie")
        .eq("link_post", true)
        .in("status", ["goedgekeurd", "gepland", "gepubliceerd", "mislukt"])
        .gte("scheduled_for", vanaf)
        .limit(200);
      return error ? [] : ((data as Array<{ id: string; publicatie: unknown }> | null) ?? []);
    },
    async leesInstelling(sleutel) {
      const { data, error } = await db.from("app_settings").select("value").eq("key", sleutel).maybeSingle();
      return error ? null : ((data as { value: string | null } | null)?.value ?? null);
    },
    async bewaarInstelling(sleutel, waarde) {
      await db.from("app_settings").upsert({ key: sleutel, value: waarde, updated_at: new Date().toISOString() }, { onConflict: "key" });
    },
    async bewaarMedia(id, v, media) {
      let q = posts().update({ media }).eq("id", id);
      if (v) q = q.eq("media->>v", v);
      const { data, error } = await q.select("id").maybeSingle();
      return !error && !!data;
    },
    async upload(pad, bytes) {
      const { error } = await db.storage
        .from(BUCKET)
        .upload(pad, bytes, { contentType: "image/jpeg", upsert: true, cacheControl: "31536000" });
      if (error) {
        const fout = error.message ?? String(error);
        return { ok: false, bucketOntbreekt: /bucket/i.test(fout) && /not.?found|does not exist/i.test(fout), fout };
      }
      return { ok: true, url: db.storage.from(BUCKET).getPublicUrl(pad).data.publicUrl };
    },
  };
}

// =====================================================================
// Beelden bevriezen
// =====================================================================

export type BevriesOpties = {
  opslag: PublicatieOpslag;
  /** Waar de beeldroute draait (standaard de live site). */
  origin?: string;
  fetch?: typeof fetch;
  nu?: Date;
};

export type BevriesUitkomst = { publiek: PubliekeMedia | null; nieuw: string[]; bucket: boolean; fouten: string[] };

async function haalBeeld(url: string, f: typeof fetch): Promise<{ bytes: Uint8Array } | { fout: string }> {
  try {
    const res = await f(url, { cache: "no-store", signal: AbortSignal.timeout(60_000) });
    if (!res.ok) return { fout: `HTTP ${res.status}` };
    if (!(res.headers.get("content-type") ?? "").startsWith("image/jpeg")) return { fout: "geen JPEG" };
    // Een noodbeeld (render of lettertype ontbrak) niet vastleggen.
    if (res.headers.get("x-merkkaart") === "noodbeeld") return { fout: "noodbeeld" };
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (!bytes.length || bytes.length > 8_000_000) return { fout: "lege of te grote JPEG" };
    return { bytes };
  } catch (e) {
    return { fout: e instanceof Error ? e.message : "netwerkfout" };
  }
}

/** Beelden die bij de huidige versie al bevroren zijn. */
export function bevroren(p: PostRij): PubliekeMedia | null {
  const pub = p.media?.publiek;
  return pub && isObj(pub) && pub.v === versieVan(p) && isObj(pub.beelden) ? pub : null;
}

/** Publiek adres: bevroren kopie, anders het absolute adres op de live site. */
export function beeldUrlVoor(p: PostRij, publiek: PubliekeMedia | null = bevroren(p)): (s: BeeldSleutel) => string {
  const v = versieVan(p);
  return (s) => publiek?.beelden[s] ?? `${SITE_ADRES}${beeldPad(p.id, s, v)}`;
}

/** Welke beelden een bericht nodig heeft, los van de verbonden kanalen. */
export function nodigeBeelden(p: PostRij): BeeldSleutel[] {
  const nep = doelKanalen(p).map(
    (dienst): SocialKanaal => ({
      id: dienst,
      dienst,
      service: dienst,
      naam: dienst,
      weergave: null,
      soort: null,
      link: null,
      avatar: null,
      ontkoppeld: false,
      vergrendeld: false,
      gepauzeerd: false,
      borden: [{ id: "bord", naam: "bord" }],
      aan: true,
      alleenNl: false,
      bord: "bord",
      gezien: "",
      weg: false,
    }),
  );
  const plannen = planBericht(p, nep, { linkVrij: true, beeldUrl: () => "" });
  return [...new Set(plannen.flatMap((x) => (x.actie === "publiceer" ? x.beelden : [])))];
}

/**
 * Kopieert de gevraagde JPEG's van de beeldroute naar de publieke bucket en
 * bewaart de adressen in media.publiek (enkel als media.v ondertussen niet
 * veranderde). Wat al bevroren is, wordt niet opnieuw gehaald.
 */
export async function bevriesBeelden(p: PostRij, sleutels: BeeldSleutel[], o: BevriesOpties): Promise<BevriesUitkomst> {
  const nu = o.nu ?? new Date();
  const v = versieVan(p);
  const huidig = bevroren(p);
  const beelden: Record<string, string> = { ...(huidig?.beelden ?? {}) };
  const nieuw: string[] = [];
  const fouten: string[] = [];
  const origin = (o.origin ?? SITE_ADRES).replace(/\/$/, "");
  const f = o.fetch ?? fetch;
  let bucket = true;
  for (const s of [...new Set(sleutels)]) {
    if (beelden[s]) continue;
    const r = await haalBeeld(`${origin}${beeldPad(p.id, s, v)}`, f);
    if ("fout" in r) {
      fouten.push(`${s}: ${r.fout}`);
      continue;
    }
    const up = await o.opslag.upload(`post/${p.id}/${v}/${s}.jpg`, r.bytes);
    if (!up.ok) {
      fouten.push(`${s}: ${up.fout}`);
      if (up.bucketOntbreekt) {
        bucket = false;
        break;
      }
      continue;
    }
    beelden[s] = up.url;
    nieuw.push(s);
  }
  if (!nieuw.length) return { publiek: huidig, nieuw, bucket, fouten };
  const publiek: PubliekeMedia = { v, beelden, op: nu.toISOString() };
  await o.opslag.bewaarMedia(p.id, p.media?.v ?? null, { ...(p.media ?? {}), publiek });
  return { publiek, nieuw, bucket, fouten };
}

/**
 * Bij een akkoord in het beheer: de beelden van één bericht meteen bevriezen
 * (na de redirect, via after()). Doet niets zonder migratie 0050 of bucket;
 * de cron probeert het later opnieuw en publiceert anders met het adres op
 * de site.
 */
export async function bevriesBericht(id: string, o: { opslag?: PublicatieOpslag; db?: Db; origin?: string; fetch?: typeof fetch } = {}): Promise<BevriesUitkomst | null> {
  const db = o.db ?? getSupabaseAdmin();
  const opslag = o.opslag ?? supabaseOpslag(db);
  if (!(await opslag.migratieOk())) return null;
  const { data, error } = await db.from("social_posts").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const rij = data as PostRij;
  if (rij.status !== "goedgekeurd") return null;
  const nodig = nodigeBeelden(rij).filter((s) => !bevroren(rij)?.beelden[s]);
  if (!nodig.length) return { publiek: bevroren(rij), nieuw: [], bucket: true, fouten: [] };
  return bevriesBeelden(rij, nodig, { opslag, origin: o.origin, fetch: o.fetch });
}

// =====================================================================
// Kanalen ontdekken (knop "Verbinding testen" en de wekelijkse controle)
// =====================================================================

export type VernieuwUitkomst = { test: Verbindingstest; kanalen: KanalenStand; publisher: PublisherStand };

/** Test de sleutel, haalt alle kanalen op en bewaart ze (instellingen blijven). */
export async function vernieuwKanalen(o: { dienst: PublicatieDienst; opslag: PublicatieOpslag; nu?: Date }): Promise<VernieuwUitkomst> {
  const nu = o.nu ?? new Date();
  const [kanalenJson, standJson] = await Promise.all([
    o.opslag.leesInstelling(KANALEN_SLEUTEL),
    o.opslag.leesInstelling(PUBLISHER_SLEUTEL),
  ]);
  let kanalen = leesKanalenStand(kanalenJson);
  const publisher = leesPublisherStand(standJson);
  const test = await o.dienst.test();
  if (test.ok) {
    kanalen = voegKanalenSamen(kanalen, test, nu);
    await o.opslag.bewaarInstelling(KANALEN_SLEUTEL, JSON.stringify(kanalen));
  }
  // Een volle limiet zegt niets over de sleutel: dan de vorige uitslag houden.
  if (!test.limiet) {
    publisher.sleutel = {
      op: nu.toISOString(),
      ok: test.ok,
      fout: test.ok ? null : (test.fout ?? null),
      waarschuwing: test.waarschuwing ?? null,
    };
  }
  publisher.verzoeken = test.verzoeken ?? publisher.verzoeken ?? null;
  await o.opslag.bewaarInstelling(PUBLISHER_SLEUTEL, JSON.stringify(publisher));
  return { test, kanalen, publisher };
}

// =====================================================================
// De run (cron /api/cron/social-publish)
// =====================================================================

export type Mail = { subject: string; html: string };

export type RunOpties = {
  nu?: Date;
  /** Enkel tonen wat er zou gebeuren: niets schrijven, niets naar Buffer. */
  droog?: boolean;
  /** Standaard Buffer (null zonder BUFFER_API_KEY). */
  dienst?: PublicatieDienst | null;
  opslag?: PublicatieOpslag;
  /** Mail naar de eigenaar; zonder: geen meldingen. */
  mail?: ((m: Mail) => Promise<boolean>) | null;
  /** Waar de beelden gerenderd worden (standaard de live site). */
  origin?: string;
  fetch?: typeof fetch;
  maxBerichten?: number;
  tijdBudgetMs?: number;
};

export type KanaalVerslag = {
  status: string;
  reden?: string | null;
  fout?: string | null;
  url?: string | null;
  plan?: string;
};

export type RunVerslag = {
  op: string;
  actief: boolean;
  droog: boolean;
  reden?: string;
  kanalen: number;
  berichten: Array<{ id: string; titel: string; wanneer: string | null; uitkomst: string; kanalen: Record<string, KanaalVerslag> }>;
  bijgewerkt: Array<{ id: string; uitkomst: string }>;
  bevroren: Array<{ id: string; beelden: string[]; fouten: string[] }>;
  mails: string[];
  gestopt?: "sleutel" | "limiet" | "tijd";
  verzoeken?: Verzoeken | null;
};

function verslagVan(p: PublicatieData): Record<string, KanaalVerslag> {
  const uit: Record<string, KanaalVerslag> = {};
  for (const [k, e] of Object.entries(p.kanalen)) uit[k] = { status: e.status, reden: e.reden ?? null, fout: e.fout ?? null, url: e.url ?? null };
  return uit;
}

function genormaliseerd(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60);
}

function laagBudget(v: Verzoeken | null | undefined): boolean {
  return !!v && ((v.kwartier?.over ?? 99) <= 2 || (v.dag?.over ?? 99) <= 3 || (v.maand?.over ?? 99) <= 3);
}

/**
 * Kanalen nakijken bij Buffer: "verzonden" bevestigen (of als mislukt
 * melden) en onzekere pogingen terugvinden, zodat er nooit dubbel gepost
 * wordt. Eén verzoek voor het hele bericht. Geeft "stop" terug bij een
 * sleutel- of limietprobleem.
 */
async function kijkNa(
  p: PublicatieData,
  dienst: PublicatieDienst,
  orgId: string | null,
  nu: Date,
): Promise<{ veranderd: boolean; stop?: "sleutel" | "limiet" }> {
  const open = Object.entries(p.kanalen).filter(
    ([, e]) => e.kanaalId && (e.status === "verzonden" || e.status === "bezig" || (e.status === "opnieuw" && e.onzeker)),
  );
  if (!open.length || !orgId) return { veranderd: false };
  const sinds = new Date(Math.min(...open.map(([, e]) => Date.parse(e.op) || nu.getTime())) - 15 * MIN);
  const r = await dienst.recent(orgId, [...new Set(open.map(([, e]) => e.kanaalId!))], sinds);
  if (r.stop) return { veranderd: false, stop: r.stop };
  if (!r.ok) return { veranderd: false };
  let veranderd = false;
  for (const [sleutel, e] of open) {
    const gevonden =
      (e.id ? r.posts.find((x) => x.id === e.id) : undefined) ??
      (e.status !== "verzonden" && e.tekst
        ? r.posts.find(
            (x) =>
              x.kanaalId === e.kanaalId &&
              genormaliseerd(x.tekst).startsWith(genormaliseerd(e.tekst!).slice(0, 40)) &&
              (!x.op || Date.parse(x.op) >= (Date.parse(e.op) || 0) - 15 * MIN),
          )
        : undefined);
    if (gevonden) {
      p.kanalen[sleutel] = {
        ...e,
        status: gevonden.status,
        id: gevonden.id,
        url: gevonden.url ?? e.url ?? null,
        fout: gevonden.status === "mislukt" ? gevonden.fout || "Buffer meldt een fout" : null,
        onzeker: false,
        op: gevonden.status === "verzonden" ? e.op : nu.toISOString(),
      };
      veranderd = true;
    } else if (e.status === "verzonden") {
      if (nu.getTime() - (Date.parse(e.op) || 0) > BEVESTIGING_UUR * UUR) {
        p.kanalen[sleutel] = { ...e, status: "mislukt", fout: "Geen bevestiging van Buffer na 24 uur: kijk het na in Buffer", op: nu.toISOString() };
        veranderd = true;
      }
    } else {
      // Niet terug te vinden: het bericht werd niet aangemaakt, veilig opnieuw.
      p.kanalen[sleutel] = { ...e, status: "opnieuw", onzeker: false, fout: e.fout ?? "onderbroken", op: nu.toISOString() };
      veranderd = true;
    }
  }
  return { veranderd };
}

export async function voerPublisherUit(o: RunOpties = {}): Promise<RunVerslag> {
  const nu = o.nu ?? new Date();
  const start = Date.now();
  const budget = o.tijdBudgetMs ?? 240_000;
  const droog = !!o.droog;
  const verslag: RunVerslag = { op: nu.toISOString(), actief: false, droog, kanalen: 0, berichten: [], bijgewerkt: [], bevroren: [], mails: [] };
  const dienst = "dienst" in o ? (o.dienst ?? null) : maakBufferDienst();
  if (!dienst) return { ...verslag, reden: "Geen BUFFER_API_KEY: de publisher staat uit." };
  const opslag = o.opslag ?? supabaseOpslag();
  if (!(await opslag.migratieOk())) return { ...verslag, reden: "Migratie 0050 is nog niet gedraaid: de publisher staat uit." };

  let kanalen = leesKanalenStand(await opslag.leesInstelling(KANALEN_SLEUTEL));
  const stand = leesPublisherStand(await opslag.leesInstelling(PUBLISHER_SLEUTEL));
  const fouten: PublicatieFout[] = [];
  let stop: "sleutel" | "limiet" | "tijd" | undefined;
  verslag.actief = true;

  // 1. Wekelijkse controle van sleutel en verbindingen (en de eerste ontdekking).
  const laatsteCheck = Date.parse(stand.sleutel?.op ?? "") || 0;
  if (!droog && (!kanalen.kanalen.length || nu.getTime() - laatsteCheck > WEKELIJKSE_CHECK)) {
    const t = await dienst.test();
    if (t.ok) {
      kanalen = voegKanalenSamen(kanalen, t, nu);
      await opslag.bewaarInstelling(KANALEN_SLEUTEL, JSON.stringify(kanalen));
      for (const k of kanalen.kanalen) {
        if (k.aan && !k.weg && (k.ontkoppeld || k.vergrendeld))
          fouten.push({
            titel: "Verbinding",
            kanaal: KANAAL_LABEL[k.dienst] ?? k.dienst,
            fout: k.ontkoppeld ? "Verbinding verbroken in Buffer: verbind het kanaal opnieuw" : "Vergrendeld in Buffer: meer kanalen dan het plan toelaat",
            op: nu.toISOString(),
          });
      }
    }
    if (!t.limiet) stand.sleutel = { op: nu.toISOString(), ok: t.ok, fout: t.ok ? null : (t.fout ?? null), waarschuwing: t.waarschuwing ?? null };
    if (t.sleutelFout) stop = "sleutel";
    else if (t.limiet) stop = "limiet";
  }
  verslag.kanalen = kanalen.kanalen.filter((k) => k.aan && !k.weg).length;
  const orgId = kanalen.organisatie?.id ?? null;

  // 2. Berichten die 'gepland' staan: bevestigen, en vastgelopen runs opruimen.
  //    Enkel als de grendel ouder is dan SLOT_VERLOOPT: een run die nu nog
  //    loopt (langer dan de functie kan duren) bestaat dan niet meer.
  if (!stop && !droog && kanalen.kanalen.length) {
    for (const rij of await opslag.leesGepland(20)) {
      const p = leesPublicatie(rij.publicatie);
      const token = p.slot?.token;
      if (!token || nu.getTime() - (Date.parse(p.slot!.op) || 0) <= SLOT_VERLOOPT) continue;
      const voor = new Map(Object.entries(p.kanalen).map(([k, e]) => [k, e.status]));
      const voorJson = JSON.stringify(p.kanalen);
      const n = await kijkNa(p, dienst, orgId, nu);
      if (n.stop) {
        stop = n.stop;
        break;
      }
      for (const [k, e] of Object.entries(p.kanalen)) {
        if (e.status === "mislukt" && voor.get(k) !== "mislukt")
          fouten.push({ titel: rij.title, kanaal: KANAAL_LABEL[e.kanaal] ?? e.kanaal, fout: e.fout ?? "mislukt", op: nu.toISOString(), postId: rij.id });
      }
      const eind = eindStatus(p);
      if (eind) {
        await opslag.bewaar(rij.id, token, {
          status: eind,
          publicatie: schrijfPublicatie({ ...p, slot: null }),
          ...(eind === "gepubliceerd" ? { posted_at: nu.toISOString(), posted_url: eersteUrl(p) } : {}),
        });
        verslag.bijgewerkt.push({ id: rij.id, uitkomst: eind });
      } else if (
        Object.values(p.kanalen).every((e) => e.status !== "bezig" && !(e.status === "opnieuw" && e.onzeker)) &&
        (p.doel ?? []).some((k) => !p.kanalen[k] || p.kanalen[k]!.status === "opnieuw")
      ) {
        // Vrijgeven: de volgende run maakt de ontbrekende kanalen af.
        await opslag.bewaar(rij.id, token, { status: "goedgekeurd", publicatie: schrijfPublicatie(p) });
        verslag.bijgewerkt.push({ id: rij.id, uitkomst: "vrijgegeven" });
      } else if (JSON.stringify(p.kanalen) !== voorJson) {
        await opslag.bewaar(rij.id, token, { publicatie: schrijfPublicatie(p) });
        verslag.bijgewerkt.push({ id: rij.id, uitkomst: "nagekeken" });
      }
    }
  }

  // 3. Berichten waarvan het tijdstip voorbij is.
  // Zonder gekende kanalen (eerste ontdekking mislukt) niets afhandelen: anders
  // zou elk bericht als "niet verbonden" overgeslagen worden.
  let linkVrij = LINK_BUDGET_PER_MAAND;
  const zonderKanalen = !droog && !kanalen.kanalen.length;
  if (zonderKanalen && !stop) verslag.reden = "Nog geen kanalen gevonden in Buffer: goedgekeurde berichten blijven wachten.";
  const klaar = stop || zonderKanalen ? [] : await opslag.leesKlaar(nu.toISOString(), droog ? 20 : (o.maxBerichten ?? 4));
  if (klaar.some((r) => r.link_post)) {
    const rijen = await opslag.linkRijen(new Date(maandBegin(nu).getTime() - 40 * DAG).toISOString());
    linkVrij = Math.max(0, LINK_BUDGET_PER_MAAND - telLinkberichten(rijen, nu));
  }

  for (const rij of klaar) {
    if (stop) break;
    if (Date.now() - start > budget) {
      stop = "tijd";
      break;
    }
    const p0 = leesPublicatie(rij.publicatie);
    const naam = rij.title;
    const basis = Math.max(Date.parse(rij.scheduled_for ?? "") || 0, Date.parse(rij.gekeurd_op ?? "") || 0);
    const eerste = !Object.keys(p0.kanalen).length;

    // Te laat (bv. de publisher stond dagen uit): niet alsnog uitsturen.
    if (eerste && nu.getTime() - basis > TE_LAAT_UUR * UUR) {
      const reden = `te laat: meer dan ${TE_LAAT_UUR} uur na het geplande tijdstip. Keur opnieuw goed om het alsnog te publiceren.`;
      if (!droog) await opslag.zetStatus(rij.id, ["goedgekeurd"], { status: "overgeslagen", publicatie: schrijfPublicatie({ ...p0, reden }) });
      verslag.berichten.push({ id: rij.id, titel: naam, wanneer: rij.scheduled_for, uitkomst: "overgeslagen (te laat)", kanalen: {} });
      continue;
    }

    // Harde tekstcontrole: nooit een link, MV3D, Convertor, beschermde titel, LinkedIn of persoonsnaam.
    const hard = tekstProblemen(rij).filter((x) => x.startsWith("bevat"));
    if (hard.length) {
      const reden = `tekstcontrole: ${hard.join(", ")}`;
      if (!droog) {
        await opslag.zetStatus(rij.id, ["goedgekeurd"], { status: "mislukt", publicatie: schrijfPublicatie({ ...p0, reden }) });
        fouten.push({ titel: naam, kanaal: "Alle kanalen", fout: reden, op: nu.toISOString(), postId: rij.id });
      }
      verslag.berichten.push({ id: rij.id, titel: naam, wanneer: rij.scheduled_for, uitkomst: "mislukt (tekstcontrole)", kanalen: {} });
      continue;
    }

    // Droog: enkel het plan tonen.
    if (droog) {
      const plannen = planBericht(rij, kanalen.kanalen, { linkVrij: linkVrij > 0, beeldUrl: beeldUrlVoor(rij) });
      verslag.berichten.push({
        id: rij.id,
        titel: naam,
        wanneer: rij.scheduled_for,
        uitkomst: "voorbeeld",
        kanalen: Object.fromEntries(
          plannen.map((x) => [x.sleutel, x.actie === "publiceer" ? { status: "zou publiceren", plan: x.omschrijving } : { status: "overgeslagen", reden: x.reden }]),
        ),
      });
      continue;
    }

    // 3a. Grendel.
    const token = randomUUID();
    const gekeurd = Date.parse(rij.gekeurd_op ?? "") || 0;
    const p: PublicatieData = { ...p0, kanalen: { ...p0.kanalen }, slot: { token, op: nu.toISOString() }, reden: null };
    for (const [k, e] of Object.entries(p.kanalen)) {
      // Opnieuw goedgekeurd na een fout of overslaan: dat kanaal opnieuw proberen.
      if ((e.status === "mislukt" && gekeurd > (Date.parse(e.op) || 0)) || e.status === "overgeslagen") delete p.kanalen[k];
      // Bleef "bezig" staan: de vorige run viel weg. Eerst nakijken.
      else if (e.status === "bezig") p.kanalen[k] = { ...e, status: "opnieuw", onzeker: true };
    }
    const geclaimd = await opslag.claim(rij.id, schrijfPublicatie(p));
    if (!geclaimd) {
      verslag.berichten.push({ id: rij.id, titel: naam, wanneer: rij.scheduled_for, uitkomst: "al in behandeling", kanalen: {} });
      continue;
    }
    const post: PostRij = { ...rij, ...geclaimd };
    const bewaar = (patch: Record<string, unknown> = {}) => opslag.bewaar(post.id, token, { publicatie: schrijfPublicatie(p), ...patch });

    // 3b. Onzekere kanalen eerst terugzoeken in Buffer.
    const nagekeken = await kijkNa(p, dienst, orgId, nu);
    if (nagekeken.stop) stop = nagekeken.stop;

    // 3c. Plan en beelden.
    const plannen = planBericht(post, kanalen.kanalen, { linkVrij: linkVrij > 0, beeldUrl: () => "" });
    p.doel = plannen.map((x) => x.sleutel);
    const teBevriezen = plannen.flatMap((x) => (x.actie === "publiceer" && !p.kanalen[x.sleutel] ? x.beelden : []));
    let publiek = bevroren(post);
    if (teBevriezen.length && !stop) {
      const b = await bevriesBeelden(post, teBevriezen, { opslag, origin: o.origin, fetch: o.fetch, nu });
      publiek = b.publiek;
      if (b.nieuw.length || b.fouten.length) verslag.bevroren.push({ id: post.id, beelden: b.nieuw, fouten: b.fouten });
    }
    const definitief = planBericht(post, kanalen.kanalen, { linkVrij: linkVrij > 0, beeldUrl: beeldUrlVoor(post, publiek) });

    // 3d. Per kanaal.
    for (const plan of definitief) {
      const bestaand = p.kanalen[plan.sleutel];
      if (bestaand && ["verzonden", "gepubliceerd", "mislukt"].includes(bestaand.status)) continue;
      if (bestaand?.status === "opnieuw" && bestaand.onzeker) continue; // nog niet terug te vinden: volgende run
      if (plan.actie === "overslaan") {
        p.kanalen[plan.sleutel] = { status: "overgeslagen", kanaal: plan.dienst, kanaalId: plan.kanaal?.id ?? null, naam: plan.kanaal?.weergave ?? plan.kanaal?.naam ?? null, reden: plan.reden, op: nu.toISOString() };
        continue;
      }
      if (stop) continue;
      if (Date.now() - start > budget || laagBudget(dienst.verzoeken())) {
        stop = Date.now() - start > budget ? "tijd" : "limiet";
        continue;
      }
      const pogingen = (bestaand?.pogingen ?? 0) + 1;
      const basisEntry: KanaalPublicatie = {
        status: "bezig",
        kanaal: plan.dienst,
        via: dienst.naam,
        kanaalId: plan.kanaal.id,
        naam: plan.kanaal.weergave ?? plan.kanaal.naam,
        op: new Date().toISOString(),
        pogingen,
        beeld: plan.bericht.beelden[0]?.url ?? plan.bericht.link?.beeld ?? plan.bericht.video ?? null,
        tekst: plan.bericht.tekst.slice(0, 80),
        link: plan.link,
      };
      p.kanalen[plan.sleutel] = basisEntry;
      if (!(await bewaar())) {
        // Grendel kwijt (rij veranderd): niets meer versturen.
        delete p.kanalen[plan.sleutel];
        stop = stop ?? "tijd";
        break;
      }
      const u = await dienst.publish(plan.bericht, { id: plan.kanaal.id, dienst: plan.dienst, naam: plan.kanaal.naam, bord: plan.kanaal.bord ?? plan.kanaal.borden[0]?.id ?? null });
      const op = new Date().toISOString();
      if (u.stop) {
        // Afgewezen vóór er iets aangemaakt werd (401/429): niet als poging tellen.
        if (bestaand) p.kanalen[plan.sleutel] = bestaand;
        else delete p.kanalen[plan.sleutel];
        stop = u.stop;
      } else if (u.ok) {
        p.kanalen[plan.sleutel] = { ...basisEntry, status: u.verzonden ? "verzonden" : "gepubliceerd", id: u.id, url: u.url, fout: null, op };
        if (plan.link) linkVrij = Math.max(0, linkVrij - 1);
      } else if (u.tijdelijk && pogingen < MAX_POGINGEN) {
        p.kanalen[plan.sleutel] = { ...basisEntry, status: "opnieuw", id: u.id, fout: u.error, onzeker: !!u.onzeker, op };
      } else {
        p.kanalen[plan.sleutel] = { ...basisEntry, status: "mislukt", id: u.id, fout: u.error ?? "mislukt", onzeker: false, op };
        fouten.push({ titel: naam, kanaal: KANAAL_LABEL[plan.dienst] ?? plan.dienst, fout: u.error ?? "mislukt", op, postId: post.id });
      }
      if (plan.linkBudgetOp) p.kanalen[plan.sleutel] = { ...p.kanalen[plan.sleutel]!, reden: "linkbudget van de maand op: als beeldbericht" };
      await bewaar();
    }

    // 3e. Afronden.
    const eind = eindStatus(p);
    let uitkomst: string;
    if (eind) {
      await bewaar({
        status: eind,
        publicatie: schrijfPublicatie({ ...p, slot: null }),
        ...(eind === "gepubliceerd" ? { posted_at: nu.toISOString(), posted_url: eersteUrl(p) } : {}),
      });
      uitkomst = eind;
    } else if ((p.doel ?? []).some((k) => !p.kanalen[k] || (p.kanalen[k]!.status === "opnieuw" && !p.kanalen[k]!.onzeker))) {
      // Iets moet nog (limiet, tijd, tijdelijke fout): terug naar goedgekeurd.
      await bewaar({ status: "goedgekeurd" });
      uitkomst = "later verder";
    } else {
      await bewaar();
      uitkomst = "wacht op bevestiging";
    }
    verslag.berichten.push({ id: post.id, titel: naam, wanneer: post.scheduled_for, uitkomst, kanalen: verslagVan(p) });
  }

  // 4. Beelden vooraf bevriezen voor goedgekeurde berichten van de komende 26 uur
  //    (goedkeuring via de mail of de contentmachine bevriest zelf niets).
  if (!stop && !droog && Date.now() - start < budget / 2) {
    for (const rij of await opslag.leesOpkomend(nu.toISOString(), new Date(nu.getTime() + 26 * UUR).toISOString(), 6)) {
      if (Date.now() - start > budget / 2) break;
      const nodig = nodigeBeelden(rij).filter((s) => !bevroren(rij)?.beelden[s]);
      if (!nodig.length) continue;
      const b = await bevriesBeelden(rij, nodig, { opslag, origin: o.origin, fetch: o.fetch, nu });
      if (b.nieuw.length || b.fouten.length) verslag.bevroren.push({ id: rij.id, beelden: b.nieuw, fouten: b.fouten });
      if (!b.bucket) break;
    }
  }

  // 5. Meldingen (hoogstens één mail per dag) en stand bewaren.
  if (stop) verslag.gestopt = stop;
  verslag.verzoeken = dienst.verzoeken() ?? stand.verzoeken ?? null;
  if (droog) return verslag;
  const sleutelFout = stop === "sleutel";
  if (sleutelFout && stand.sleutel?.ok !== false) stand.sleutel = { op: nu.toISOString(), ok: false, fout: "Buffer weigert de API-sleutel" };
  const wachtend = [...(stand.uitgesteld ?? []), ...fouten].slice(-20);
  if (wachtend.length || sleutelFout) {
    const recent = stand.alertMail && nu.getTime() - (Date.parse(stand.alertMail) || 0) < DAG;
    if (!recent && o.mail) {
      const ok = await o.mail(buildPublicatieMeldingMail({ fouten: wachtend, sleutel: sleutelFout ? "Buffer weigert de API-sleutel" : null }));
      if (ok) {
        stand.alertMail = nu.toISOString();
        stand.uitgesteld = [];
        verslag.mails.push(sleutelFout ? "sleutel" : `fouten:${wachtend.length}`);
      } else stand.uitgesteld = wachtend;
    } else stand.uitgesteld = wachtend;
  }
  stand.verzoeken = verslag.verzoeken;
  stand.laatsteRun = {
    op: nu.toISOString(),
    tekst: `${verslag.berichten.length} bericht(en), ${verslag.bijgewerkt.length} nagekeken${stop ? `, gestopt: ${stop}` : ""}`,
  };
  await opslag.bewaarInstelling(PUBLISHER_SLEUTEL, JSON.stringify(stand));
  return verslag;
}
